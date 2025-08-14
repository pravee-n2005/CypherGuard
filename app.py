from flask import Flask, request, jsonify, send_from_directory
import pandas as pd
import pickle
import joblib
import os

# -------------------------
# Load model & feature columns
# -------------------------
with open('saved_model.pkl', 'rb') as f:
    model = pickle.load(f)

feature_columns = joblib.load('feature_columns.pkl')

# -------------------------
# Flask app init
# -------------------------
app = Flask(__name__, static_folder='frontend/build', static_url_path='')

# -------------------------
# Health check
# -------------------------
@app.route('/', methods=['GET'])
def home():
    return "CypherGuard backend is running. Use POST /predict for predictions."

# -------------------------
# Prediction endpoint
# -------------------------
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        df = pd.DataFrame([data])

        # One-hot encode like in training
        df_encoded = pd.get_dummies(df)

        # Match training columns order, fill missing with 0
        df_encoded = df_encoded.reindex(columns=feature_columns, fill_value=0)

        prediction = model.predict(df_encoded)[0]
        return jsonify({'prediction': int(prediction)})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# -------------------------
# Dummy alerts data + mitigation mapping
# -------------------------
alerts_data = [
    {"id": 1, "time": "2025-08-14 11:00", "ip": "192.168.1.10", "proto": "tcp", "service": "http",
     "threat_score": 85, "alert_type": "DDoS"},
    {"id": 2, "time": "2025-08-14 10:30", "ip": "192.168.1.15", "proto": "udp", "service": "dns",
     "threat_score": 30, "alert_type": "Normal"},
]

mitigations = {
    "DoS": "Monitor traffic closely; consider rate limiting and blocking suspicious IPs.",
    "Probe": "Review network logs; apply firewall rules to limit scanning.",
    "Ransomware": "Isolate affected systems; update antivirus and backup recovery process.",
    "DDoS": "Use DDoS protection services; block or throttle attacker IP ranges.",
    "Normal": "No action needed."
}

@app.route('/alerts', methods=['GET'])
def get_alerts():
    return jsonify(alerts_data)

@app.route('/alert/<int:alert_id>', methods=['GET'])
def get_alert(alert_id):
    alert = next((a for a in alerts_data if a["id"] == alert_id), None)
    if alert:
        alert["mitigation"] = mitigations.get(
            alert["alert_type"], "Investigate the alert and apply appropriate security policies."
        )
        return jsonify(alert)
    return jsonify({"error": "Alert not found"}), 404

# -------------------------
# Optional: Serve React build (remove if running React separately)
# -------------------------
@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(app.static_folder, path)

@app.route('/frontend')
def index():
    return send_from_directory(app.static_folder, 'index.html')

# -------------------------
# Run server
# -------------------------
if __name__ == '__main__':
    app.run(debug=True)
