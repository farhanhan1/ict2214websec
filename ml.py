# import pandas as pd
# from sklearn.model_selection import train_test_split
# from sklearn.ensemble import RandomForestClassifier
# from sklearn.preprocessing import LabelEncoder
# from sklearn.metrics import accuracy_score
# import joblib

# # Load data from CSV file
# csv_file_path = 'D:\SIT\Y2S2\ICT2214 Web Security\Assignment_Git\ict2214websec\cookie_data.csv'  # Replace with your actual CSV file path
# df = pd.read_csv(csv_file_path)

# # Display the first few rows of the dataframe
# print(df.head())

# # Separate features and target variable
# X = df.drop(['Category'], axis=1)  # Assuming 'Category' is the target variable
# y = df['Category']

# # Identify categorical columns
# cat_cols = ['Cookie-ID']  # Add other categorical columns as needed

# # Initialize LabelEncoder
# label_encoder = LabelEncoder()

# # Iterate over categorical columns and apply LabelEncoder
# for col in cat_cols:
#     X[col] = X[col].astype(str)  # Ensure the column is treated as a string
#     X[col] = label_encoder.fit_transform(X[col])

# # Split the data into training and testing sets
# X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# # Train a RandomForestClassifier
# model = RandomForestClassifier(n_estimators=100, random_state=42)
# model.fit(X_train, y_train)

# # Make predictions on the test set
# y_pred = model.predict(X_test)

# # Evaluate the model
# accuracy = accuracy_score(y_test, y_pred)
# print(f'Model Accuracy: {accuracy * 100:.2f}%')

# # Save the trained model to a file
# model_filename = 'cookie_classifier_model.joblib'
# joblib.dump(model, model_filename)
# print(f'Model saved as {model_filename}')

# # Now, you can use the trained model to predict the category based on user-inputted 'Cookie-ID'
# def predict_category(user_input_cookie_id):
#     # Encode user input using the same LabelEncoder
#     user_input_encoded = label_encoder.transform([user_input_cookie_id])

#     # Make the prediction
#     prediction = model.predict([user_input_encoded])

#     return prediction[0]

# # Example usage:
# user_input_cookie_id = 'lcsrftoken'  # Replace with the actual user input
# predicted_category = predict_category(user_input_cookie_id)
# print(f'Predicted Category for Cookie-ID "{user_input_cookie_id}": {predicted_category}')


# Testing code - Sent TJ later

# import pandas as pd
# from sklearn.model_selection import train_test_split
# from sklearn.ensemble import RandomForestClassifier
# from sklearn.preprocessing import LabelEncoder, OneHotEncoder
# from sklearn.metrics import accuracy_score, f1_score, confusion_matrix
# import joblib

# # Load data from CSV file (replace with your actual path)
# csv_file_path = 'D:\SIT\Y2S2\ICT2214 Web Security\Assignment_Git\ict2214websec\cookie_data.csv'
# df = pd.read_csv(csv_file_path)
# print('reading')

# # Separate features and target variable
# X = df.drop(['Category'], axis=1)
# y = df['Category']
# print('read')

# # Handle categorical features using OneHotEncoder
# cat_cols = ['Cookie-ID']  # Add other categorical columns
# encoder = OneHotEncoder(handle_unknown='ignore')  # Handle unseen values
# X_encoded = encoder.fit_transform(X[cat_cols])
# X = pd.concat([X.drop(cat_cols, axis=1), pd.DataFrame(X_encoded.toarray())], axis=1)
# print('done1')

# # Split data into training and testing sets
# X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
# print('done2')

# # Train the model
# model = RandomForestClassifier(n_estimators=100, random_state=42)
# model.fit(X_train, y_train)
# print('done3')

# # Evaluate model performance
# y_pred = model.predict(X_test)
# accuracy = accuracy_score(y_test, y_pred)
# f1 = f1_score(y_test, y_pred, average='weighted')  # Consider weighted F1-score
# print(f'Accuracy: {accuracy:.2f}')
# print(f'F1-score: {f1:.2f}')
# print(confusion_matrix(y_test, y_pred))

# # Save the model
# model_filename = 'cookie_classifier_model.joblib'
# joblib.dump(model, model_filename)

# # Function to predict category for new cookies
# def predict_category(cookie_data):
#     # Extract relevant features from cookie_data
#     features = [
#         cookie_data['Cookie-ID'],
#         cookie_data['Domain'],
#         cookie_data['Path'],
#         cookie_data['Expiration-Time']
#         ]

#     # Encode categorical features
#     features_encoded = encoder.transform( pd.DataFrame([features]))

#     # Make the prediction
#     prediction = model.predict(features_encoded)[0]
#     return prediction

# # Example usage
# new_cookie_data = {'Cookie-ID': 'lcsrftoken', 'Domain':'.singaporetech.edu.sg','Path':'/','Expiration-Time':'Invalid Date' }  # Replace with actual cookie data
# predicted_category = predict_category(new_cookie_data)
# print(f'Predicted Category: {predicted_category}')

# import pandas as pd
# from sklearn.model_selection import train_test_split
# from sklearn.feature_extraction.text import CountVectorizer
# from sklearn.naive_bayes import MultinomialNB
# from sklearn.metrics import accuracy_score, classification_report

# # Example dataset
# csv_file_path = 'D:\SIT\Y2S2\ICT2214 Web Security\Assignment_Git\ict2214websec\cookie_data.csv'
# df = pd.read_csv(csv_file_path)

# # Handle missing values in the 'Cookie-ID' column by replacing them with an empty string
# df['Cookie-ID'].fillna('', inplace=True)

# # Split the data into training and testing sets
# train_data, test_data, train_labels, test_labels = train_test_split(df['Cookie-ID'], df['Category'], test_size=0.2, random_state=42)

# # Feature extraction using CountVectorizer
# vectorizer = CountVectorizer()
# X_train = vectorizer.fit_transform(train_data)
# X_test = vectorizer.transform(test_data)

# # Use a simple classifier like Multinomial Naive Bayes
# classifier = MultinomialNB()
# classifier.fit(X_train, train_labels)

# # Make predictions on the test set
# predictions = classifier.predict(X_test)

# # Evaluate the model
# accuracy = accuracy_score(test_labels, predictions)
# print(f'Accuracy: {accuracy:.2f}')

# # Classification report for more detailed evaluation
# print(classification_report(test_labels, predictions))

# raw_cookie_data = "SignOnDefault"

# # Preprocess and vectorize the cookie data
# preprocessed_cookie = vectorizer.transform([raw_cookie_data])

# # Make predictions
# predicted_category = classifier.predict(preprocessed_cookie)

# # Print the predicted category
# print(f"Predicted Category: {predicted_category[0]}")

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, classification_report

# Example dataset
csv_file_path = 'D:\SIT\Y2S2\ICT2214 Web Security\Assignment_Git\ict2214websec\cookie_data.csv'
df = pd.read_csv(csv_file_path)

# Handle missing values in the 'Cookie-ID' column by replacing them with an empty string
df['Cookie-ID'].fillna('', inplace=True)

# Split the data into training and testing sets
train_data, test_data, train_labels, test_labels = train_test_split(df['Cookie-ID'], df['Category'], test_size=0.2, random_state=42)

# Feature extraction using CountVectorizer
vectorizer = CountVectorizer()
X_train = vectorizer.fit_transform(train_data)
X_test = vectorizer.transform(test_data)

# Use a simple classifier like Multinomial Naive Bayes
classifier = MultinomialNB()
classifier.fit(X_train, train_labels)

# Make predictions on the test set
predictions = classifier.predict(X_test)

# Evaluate the model
accuracy = accuracy_score(test_labels, predictions)
print(f'Accuracy: {accuracy:.2f}')

# Classification report for more detailed evaluation
print(classification_report(test_labels, predictions))

# Example raw cookie data
raw_cookie_data = "lcsrftoken"

# Preprocess and vectorize the cookie data
preprocessed_cookie = vectorizer.transform([raw_cookie_data])

# Make predictions
predicted_category = classifier.predict(preprocessed_cookie)

# Print the predicted category
print(f"Predicted Category: {predicted_category[0]}")

