import React, { useState, useEffect } from "react";
import {
  Typography, Box, Paper, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, AppBar, Toolbar,
  List, ListItemButton, ListItemIcon, ListItemText
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Warning as WarningIcon,
  Assessment as AssessmentIcon
} from "@mui/icons-material";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import axios from "axios";
import { Pie, Bar } from "react-chartjs-2";
import { motion } from "framer-motion";
import {
  Chart as ChartJS, ArcElement, CategoryScale, LinearScale,
  BarElement, Tooltip, Legend, Title
} from "chart.js";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

const initialForm = {
  duration: 0,
  src_bytes: 0,
  dst_bytes: 0,
  proto: "tcp",
  service: "http"
};

/* ---------- DASHBOARD PAGE ---------- */
function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [prediction, setPrediction] = useState(null);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [loadingPred, setLoadingPred] = useState(false);

  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const res = await axios.get("/alerts");
      setAlerts(res.data);
    } catch {
      alert("Failed to fetch alerts");
    } finally {
      setLoadingAlerts(false);
    }
  };

  const fetchAlertDetail = async (id) => {
    try {
      const res = await axios.get(`/alert/${id}`);
      setSelectedAlert(res.data);
    } catch {
      alert("Failed to fetch alert details");
    }
  };

  const handlePredict = async () => {
    setLoadingPred(true);
    setPrediction(null);
    try {
      const res = await axios.post("/predict", formData);
      setPrediction(res.data.prediction === 1 ? "🚨 Threat" : "✅ Normal");
    } catch {
      alert("Prediction failed");
    } finally {
      setLoadingPred(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const alertTypeCounts = alerts.reduce((acc, a) => {
    acc[a.alert_type] = (acc[a.alert_type] || 0) + 1;
    return acc;
  }, {});
  const protocolCounts = alerts.reduce((acc, a) => {
    acc[a.proto] = (acc[a.proto] || 0) + 1;
    return acc;
  }, {});

  return (
    <Box sx={{ p: 2 }}>
      {/* Charts */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Paper sx={{ flex: 1, p: 2, bgcolor: "#1b263b" }}>
          <Typography variant="subtitle1">Attack Type Distribution</Typography>
          <Pie data={{
            labels: Object.keys(alertTypeCounts),
            datasets: [{ data: Object.values(alertTypeCounts),
              backgroundColor: ["#ff4d4d", "#ff9900", "#4caf50", "#2196f3", "#9c27b0"] }]
          }} />
        </Paper>
        <Paper sx={{ flex: 1, p: 2, bgcolor: "#1b263b" }}>
          <Typography variant="subtitle1">Protocol Usage</Typography>
          <Bar data={{
            labels: Object.keys(protocolCounts),
            datasets: [{ label: "Count", data: Object.values(protocolCounts), backgroundColor: "#2196f3" }]
          }} />
        </Paper>
      </Box>
      {/* Alerts + Details */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Paper sx={{ flex: 1, p: 2, bgcolor: "#1b263b", maxHeight: 300, overflow: "auto" }}>
          <Typography variant="h6">Latest Alerts</Typography>
          <Button variant="outlined" onClick={fetchAlerts} disabled={loadingAlerts} sx={{ mb: 1 }}>
            {loadingAlerts ? "Refreshing..." : "Refresh Alerts"}
          </Button>
          {alerts.map(a => (
            <motion.div whileHover={{ scale: 1.02 }} key={a.id}>
              <Box
                sx={{
                  p: 1, my: 1, cursor: "pointer",
                  bgcolor: selectedAlert?.id === a.id ? "#364fc7" : "#112240", borderRadius: 1
                }}
                onClick={() => fetchAlertDetail(a.id)}
              >
                <Typography variant="body2">
                  {a.time} | {a.ip} | {a.alert_type} | Score: {a.threat_score}
                </Typography>
              </Box>
            </motion.div>
          ))}
        </Paper>
        <Paper sx={{ flex: 1, p: 2, bgcolor: "#1b263b" }}>
          <Typography variant="h6">Threat Details</Typography>
          {selectedAlert ? (
            <>
              <Typography><strong>Time:</strong> {selectedAlert.time}</Typography>
              <Typography><strong>IP:</strong> {selectedAlert.ip}</Typography>
              <Typography><strong>Protocol:</strong> {selectedAlert.proto}</Typography>
              <Typography><strong>Service:</strong> {selectedAlert.service}</Typography>
              <Typography><strong>Threat Score:</strong> {selectedAlert.threat_score}</Typography>
              <Typography><strong>Type:</strong> {selectedAlert.alert_type}</Typography>
              <Box sx={{ mt: 2, p: 1, bgcolor: "#112240", borderRadius: 1 }}>
                <Typography><strong>Mitigation:</strong> {selectedAlert.mitigation}</Typography>
              </Box>
            </>
          ) : (
            <Typography>Select an alert to see details</Typography>
          )}
        </Paper>
      </Box>
      {/* Prediction Form */}
      <Paper sx={{ p: 2, bgcolor: "#1b263b" }}>
        <Typography variant="h6">Test Network Traffic</Typography>
        <TextField label="Duration" type="number" fullWidth sx={{ mb: 2 }}
          value={formData.duration} onChange={e => setFormData({ ...formData, duration: +e.target.value })} />
        <TextField label="Source Bytes" type="number" fullWidth sx={{ mb: 2 }}
          value={formData.src_bytes} onChange={e => setFormData({ ...formData, src_bytes: +e.target.value })} />
        <TextField label="Destination Bytes" type="number" fullWidth sx={{ mb: 2 }}
          value={formData.dst_bytes} onChange={e => setFormData({ ...formData, dst_bytes: +e.target.value })} />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Protocol</InputLabel>
          <Select value={formData.proto} onChange={e => setFormData({ ...formData, proto: e.target.value })}>
            <MenuItem value="tcp">TCP</MenuItem>
            <MenuItem value="udp">UDP</MenuItem>
            <MenuItem value="icmp">ICMP</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Service</InputLabel>
          <Select value={formData.service} onChange={e => setFormData({ ...formData, service: e.target.value })}>
            <MenuItem value="http">HTTP</MenuItem>
            <MenuItem value="ftp">FTP</MenuItem>
            <MenuItem value="dns">DNS</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" color="primary" fullWidth
          onClick={handlePredict} disabled={loadingPred}>
          {loadingPred ? "Predicting..." : "Predict Threat"}
        </Button>
        {prediction && (
          <Typography variant="h6" sx={{ mt: 2, color: prediction.includes("Threat") ? "#f44336" : "#4caf50" }}>
            Prediction: {prediction}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}

/* ---------- ALERTS PAGE ---------- */
function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    axios.get("/alerts")
      .then(res => setAlerts(res.data))
      .catch(() => alert("Failed to fetch alerts"));
  }, []);

  const fetchAlertDetail = (id) => {
    axios.get(`/alert/${id}`)
      .then(res => setSelectedAlert(res.data))
      .catch(() => alert("Failed to fetch alert details"));
  };

  return (
    <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
      <Paper sx={{ flex: 1, p: 2, bgcolor: "#1b263b", maxHeight: 400, overflowY: 'auto' }}>
        <Typography variant="h6">Alerts List</Typography>
        {alerts.map(alert => (
          <Box key={alert.id} sx={{
            cursor: 'pointer', mb: 1, p: 1, borderRadius: 1,
            bgcolor: selectedAlert?.id === alert.id ? '#364fc7' : '#112240'
          }} onClick={() => fetchAlertDetail(alert.id)}>
            <Typography variant="body2">
              {alert.time} | {alert.ip} | {alert.alert_type} | Score: {alert.threat_score}
            </Typography>
          </Box>
        ))}
      </Paper>
      <Paper sx={{ flex: 1, p: 2, bgcolor: "#1b263b" }}>
        <Typography variant="h6">Alert Details</Typography>
        {selectedAlert ? (
          <>
            <Typography><strong>Time:</strong> {selectedAlert.time}</Typography>
            <Typography><strong>IP:</strong> {selectedAlert.ip}</Typography>
            <Typography><strong>Protocol:</strong> {selectedAlert.proto}</Typography>
            <Typography><strong>Service:</strong> {selectedAlert.service}</Typography>
            <Typography><strong>Threat Score:</strong> {selectedAlert.threat_score}</Typography>
            <Typography><strong>Type:</strong> {selectedAlert.alert_type}</Typography>
            <Box sx={{ mt: 2, p: 1, bgcolor: "#112240", borderRadius: 1 }}>
              <Typography><strong>Mitigation:</strong> {selectedAlert.mitigation}</Typography>
            </Box>
          </>
        ) : (
          <Typography>Select an alert to view details</Typography>
        )}
      </Paper>
    </Box>
  );
}

/* ---------- ANALYTICS PAGE ---------- */
function Analytics() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    axios.get("/alerts")
      .then(res => setAlerts(res.data))
      .catch(() => alert("Failed to fetch alerts"));
  }, []);

  const alertTypeCounts = alerts.reduce((acc, a) => {
    acc[a.alert_type] = (acc[a.alert_type] || 0) + 1;
    return acc;
  }, {});
  const protocolCounts = alerts.reduce((acc, a) => {
    acc[a.proto] = (acc[a.proto] || 0) + 1;
    return acc;
  }, {});

  return (
    <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
      <Paper sx={{ flex: 1, p: 2, bgcolor: "#1b263b" }}>
        <Typography variant="h6">Attack Type Distribution</Typography>
        <Pie data={{
          labels: Object.keys(alertTypeCounts),
          datasets: [{ data: Object.values(alertTypeCounts),
            backgroundColor: ["#ff4d4d", "#ff9900", "#4caf50", "#2196f3", "#9c27b0"] }]
        }} />
      </Paper>
      <Paper sx={{ flex: 1, p: 2, bgcolor: "#1b263b" }}>
        <Typography variant="h6">Protocol Usage</Typography>
        <Bar data={{
          labels: Object.keys(protocolCounts),
          datasets: [{ label: "Count", data: Object.values(protocolCounts), backgroundColor: "#2196f3" }]
        }} />
      </Paper>
    </Box>
  );
}

/* ---------- APP SHELL WITH ROUTES ---------- */
export default function App() {
  const activeStyle = { backgroundColor: '#364fc7', borderRadius: 4 };
  return (
    <BrowserRouter>
      <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#0a192f', color: '#e4e6ef' }}>
        {/* Sidebar */}
        <Box sx={{ width: 220, bgcolor: "#112240", p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, color: "#90caf9" }}>CypherGuard</Typography>
          <List>
            <ListItemButton component={NavLink} to="/" style={({ isActive }) => isActive ? activeStyle : undefined}>
              <ListItemIcon><DashboardIcon sx={{ color: '#90caf9' }} /></ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
            <ListItemButton component={NavLink} to="/alerts" style={({ isActive }) => isActive ? activeStyle : undefined}>
              <ListItemIcon><WarningIcon sx={{ color: '#f44336' }} /></ListItemIcon>
              <ListItemText primary="Alerts" />
            </ListItemButton>
            <ListItemButton component={NavLink} to="/analytics" style={({ isActive }) => isActive ? activeStyle : undefined}>
              <ListItemIcon><AssessmentIcon sx={{ color: '#ff9800' }} /></ListItemIcon>
              <ListItemText primary="Analytics" />
            </ListItemButton>
          </List>
        </Box>
        {/* Main Content */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <AppBar position="static" sx={{ background: "linear-gradient(135deg,#0a192f 0%,#162447 100%)" }}>
            <Toolbar>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Threat Monitoring Dashboard
              </Typography>
            </Toolbar>
          </AppBar>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </Box>
      </Box>
    </BrowserRouter>
  );
}
