import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
import joblib

# Load data from CSV file
csv_file_path = 'cookie_data.csv'  # Replace with your actual CSV file path
df = pd.read_csv(csv_file_path)

# Display the first few rows of the dataframe
print(df.head())

# Separate features and target variable
X = df.drop(['Category'], axis=1)  # Assuming 'Category' is the target variable
y = df['Category']

# Identify categorical columns
cat_cols = ['Cookie-ID']  # Add other categorical columns as needed

# Initialize LabelEncoder
label_encoder = LabelEncoder()

# Iterate over categorical columns and apply LabelEncoder
for col in cat_cols:
    X[col] = X[col].astype(str)  # Ensure the column is treated as a string
    X[col] = label_encoder.fit_transform(X[col])

# Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train a RandomForestClassifier
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Make predictions on the test set
y_pred = model.predict(X_test)

# Evaluate the model
accuracy = accuracy_score(y_test, y_pred)
print(f'Model Accuracy: {accuracy * 100:.2f}%')

# Save the trained model to a file
model_filename = 'cookie_classifier_model.joblib'
joblib.dump(model, model_filename)
print(f'Model saved as {model_filename}')

# Now, you can use the trained model to predict the category based on user-inputted 'Cookie-ID'
def predict_category(user_input_cookie_id):
    # Encode user input using the same LabelEncoder
    user_input_encoded = label_encoder.transform([user_input_cookie_id])

    # Make the prediction
    prediction = model.predict([user_input_encoded])

    return prediction[0]

# Example usage:
user_input_cookie_id = '___utmvbPEusctSB'  # Replace with the actual user input
predicted_category = predict_category(user_input_cookie_id)
print(f'Predicted Category for Cookie-ID "{user_input_cookie_id}": {predicted_category}')
