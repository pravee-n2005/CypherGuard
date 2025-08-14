import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import pickle
import joblib  # For saving the column order

# ----------------------------
# 1. Load training and testing datasets
# ----------------------------
train_data = pd.read_csv('UNSW_NB15_training-set.csv')
test_data = pd.read_csv('UNSW_NB15_testing-set.csv')

print("✅ Data loaded successfully.")
print(f"Training rows: {len(train_data)}, Testing rows: {len(test_data)}")

# ----------------------------
# 2. Combine ONLY feature columns (drop target columns before encoding)
# ----------------------------
combined_features = pd.concat([
    train_data.drop(columns=['label', 'attack_cat']),
    test_data.drop(columns=['label', 'attack_cat'])
], sort=False)

# One-hot encode categorical columns so that both train/test have the same encoded columns
combined_encoded = pd.get_dummies(combined_features)

# 💾 Save the feature column names in the exact order for backend use
joblib.dump(combined_encoded.columns.tolist(), "feature_columns.pkl")
print("💾 Saved feature column names to feature_columns.pkl")

# ----------------------------
# 3. Split back into train & test sets
# ----------------------------
X_train = combined_encoded.iloc[:len(train_data), :]
y_train = train_data['label']  # Binary target: 0 = normal, 1 = attack

X_test = combined_encoded.iloc[len(train_data):, :]
y_test = test_data['label']

print(f"✅ Features after encoding: {X_train.shape[1]} columns")

# ----------------------------
# 4. Train Random Forest model
# ----------------------------
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# ----------------------------
# 5. Evaluate the model
# ----------------------------
y_pred = model.predict(X_test)
print("\n🎯 Accuracy:", accuracy_score(y_test, y_pred))
print("\n📊 Classification Report:\n", classification_report(y_test, y_pred))

# ----------------------------
# 6. Save the trained model to use in backend
# ----------------------------
with open('saved_model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("\n💾 Model saved as saved_model.pkl")
