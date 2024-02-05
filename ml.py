# -----------------------------------------------------------------------
# OG CODE BY TJ, THE CODE SEARCHES THRUGH DATASET.
# THIS CODE HAS THE HIGHEST ACCURACY OF 92%  BY FAR
# BUT IF COOKIE PRESENTED TO CODE IS NOT IN MODEL, IT CANT PREDICT
# -----------------------------------------------------------------------

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
#     # Check if the user input label is in the training data labels
#     if user_input_cookie_id not in label_encoder.classes_:
#         print(f"Unseen label: '{user_input_cookie_id}'. Model not trained on this label.")
#         return None  # You can handle this case accordingly

#     # Encode user input using the same LabelEncoder
#     user_input_encoded = label_encoder.transform([user_input_cookie_id])

#     # Make the prediction
#     prediction = model.predict([user_input_encoded])

#     return prediction[0]

# # Example usage:
# user_input_cookie_id = 'lcsrftoken'  # Replace with the actual user input
# predicted_category = predict_category(user_input_cookie_id)
# if predicted_category is not None:
#     print(f'Predicted Category for Cookie-ID "{user_input_cookie_id}": {predicted_category}')

# -----------------------------------------------------------------------
# THE CODE CURRENTLY IDK WHAT IT DOES COZ I CANT RUN. NEED SOMEONE WITH MORE RAM THAN ME
# BUT PROB GONA FAIL AH
# -----------------------------------------------------------------------

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

# -----------------------------------------------------------------------
# THE CODE CURRENTLY CAN PREDICT OTHER TYPES BUT GIVES WRONG RESULT, HAS THE ACCURACY
# OF 0.84 BUT THE PRECISION LOW FOR MOST, BIASNESS IS FOUND AS OTHERS CATEGORY HAS WAY MORE 
# DATA.
# -----------------------------------------------------------------------

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

# # Example raw cookie data
# raw_cookie_data = "cmpcccu35134"

# # Preprocess and vectorize the cookie data
# preprocessed_cookie = vectorizer.transform([raw_cookie_data])

# # Make predictions
# predicted_category = classifier.predict(preprocessed_cookie)

# # Print the predicted category
# print(f"Predicted Category: {predicted_category[0]}")

# -----------------------------------------------------------------------
# THE FOLLOWING CODE IS TOO BIAS TOWARDS FUNCTIONAL, EVERY COOKIE PRESENTED IS 
# LISTED AS FUNCTIONAL. CODE USES LABELENCODER, CAN RESEARCH ON IT BUT
# FROM WHAT I KNOW, ONEHOTENCODER IS MORE SUITABLE FOR OUR PROJ
# -----------------------------------------------------------------------

# import pandas as pd
# from sklearn.model_selection import train_test_split
# from sklearn.ensemble import RandomForestClassifier
# from sklearn.metrics import accuracy_score
# from sklearn.preprocessing import LabelEncoder

# # Assume you have a DataFrame `df` with your data
# # and 'Category' column for cookie type ('Functional', 'Analytics', 'Marketing')
# df = pd.read_csv('D:\SIT\Y2S2\ICT2214 Web Security\Assignment_WebSec\AssignmentCodes\open-cookie-database.csv')

# # Select the features for your model
# features = ['Cookie / Data Key name', 'Description']

# # One-hot encode the categorical features
# df_encoded = pd.get_dummies(df[features])

# # Encode the labels
# le = LabelEncoder()
# df['Category'] = le.fit_transform(df['Category'])

# # Split the data into training and test sets
# X_train, X_test, y_train, y_test = train_test_split(df_encoded, df['Category'], test_size=0.2, random_state=42)

# # Ensure the new data has the same columns as the training data
# missing_cols = set(X_train.columns) - set(df_encoded.columns)
# for c in missing_cols:
#     df_encoded[c] = 0
# df_encoded = df_encoded[X_train.columns]

# # Create a random forest classifier
# clf = RandomForestClassifier(n_estimators=100, random_state=42)

# # Train the classifier
# clf.fit(X_train, y_train)

# # Make predictions on the test set
# y_pred = clf.predict(X_test)

# # Calculate the accuracy of the model
# accuracy = accuracy_score(y_test, y_pred)

# print(f"Model accuracy: {accuracy}")

# # Assume 'new_cookie_name' and 'new_cookie_value' are the name and value of the new cookie
# new_cookie_name = 'ps3'

# # Create a new DataFrame with the cookie name and value
# new_data = pd.DataFrame({
#     'Cookie / Data Key name': [new_cookie_name],
# })

# # One-hot encode the new data in the same way as the training data
# new_data_encoded = pd.get_dummies(new_data)

# # Ensure the new data has the same columns as the training data
# missing_cols = set(X_train.columns) - set(new_data_encoded.columns)
# for c in missing_cols:
#     new_data_encoded[c] = 0
# new_data_encoded = new_data_encoded[X_train.columns]


# # Use the model to make a prediction
# prediction = clf.predict(new_data_encoded)

# # Convert the prediction back into the original label
# prediction_label = le.inverse_transform(prediction)

# print(f"The predicted category for the new cookie is: {prediction_label[0]}")

# -----------------------------------------------------------------------
# THE FOLLOWING CODE USES OVERSAMPLING STRATEGY ON ONE CATEGORY, ADVERTISEMENTS
# DOESNT WORK, ACCURACY LOWERS BY ALOT
# -----------------------------------------------------------------------

# import pandas as pd
# from sklearn.model_selection import train_test_split
# from sklearn.feature_extraction.text import CountVectorizer
# from sklearn.naive_bayes import MultinomialNB
# from sklearn.metrics import accuracy_score, classification_report
# from imblearn.over_sampling import SMOTE

# # Example dataset
# csv_file_path = 'D:\SIT\Y2S2\ICT2214 Web Security\Assignment_WebSec\AssignmentCodes\cookie_data.csv'
# df = pd.read_csv(csv_file_path)

# # Handle missing values in the 'Cookie-ID' and 'Category' columns by replacing them with an empty string
# df['Cookie-ID'].fillna('', inplace=True)
# df.dropna(subset=['Category'], inplace=True)
# print(df['Category'].value_counts())
# df.drop(df[df['Category'] == 'Category'].index, inplace=True)


# # Split the data into training and testing sets
# train_data, test_data, train_labels, test_labels = train_test_split(df['Cookie-ID'], df['Category'], test_size=0.2, random_state=42)

# # Feature extraction using CountVectorizer
# vectorizer = CountVectorizer()
# X_train = vectorizer.fit_transform(train_data)
# X_test = vectorizer.transform(test_data)

# # Use SMOTE with reduced n_neighbors
# smote = SMOTE(sampling_strategy={'advertisement': 1000}, random_state=42)  # Adjust the value based on your dataset
# smote = SMOTE(k_neighbors=3, random_state=42)  # Adjust the value based on your dataset
# X_train_over, train_labels_over = smote.fit_resample(X_train, train_labels)

# # Use a simple classifier like Multinomial Naive Bayes
# classifier = MultinomialNB()
# classifier.fit(X_train_over, train_labels_over)

# # Make predictions on the test set
# predictions = classifier.predict(X_test)

# # Evaluate the model
# accuracy = accuracy_score(test_labels, predictions)
# print(f'Accuracy: {accuracy:.2f}')

# # Classification report for more detailed evaluation
# print(classification_report(test_labels, predictions))

# raw_cookie_data = ["visid_incap"]  # Pass data as a list

# # Preprocess and vectorize the cookie data
# preprocessed_cookie = vectorizer.transform(raw_cookie_data)

# # Make predictions
# predicted_category = classifier.predict(preprocessed_cookie)

# # Print the predicted category
# print(f"Predicted Category: {predicted_category[0]}")

# -----------------------------------------------------------------------
# THE FOLLOWING CODE USES 3 DIFFERENT MODEL TYPES AND COMPARE THE RESULTS. 
# WILL NEED MORE THAN A CERTAIN AMOUNT OF RAM AND NEED WAIT FOR QUITE AWHILE
# CAN TEST IF YOU HAVE MORE THAN 7GB IIRC
# -----------------------------------------------------------------------

# import pandas as pd
# from sklearn.model_selection import train_test_split, GridSearchCV
# from sklearn.feature_extraction.text import TfidfVectorizer
# from sklearn.naive_bayes import MultinomialNB
# from sklearn.svm import SVC
# from sklearn.ensemble import RandomForestClassifier
# from sklearn.metrics import accuracy_score, classification_report
# from imblearn.under_sampling import RandomUnderSampler
# import numpy as np

# # Load dataset and handle missing values
# df = pd.read_csv('D:\SIT\Y2S2\ICT2214 Web Security\Assignment_WebSec\AssignmentCodes\cookie_data.csv')
# df['Cookie-ID'].fillna('', inplace=True)
# df.dropna(subset=['Category'], inplace=True)
# df.drop(df[df['Category'] == 'Category'].index, inplace=True)

# # Split data into features and labels
# train_data, test_data, train_labels, test_labels = train_test_split(
#     df['Cookie-ID'], df['Category'], test_size=0.2, random_state=42
# )

# # Feature engineering
# vectorizer = TfidfVectorizer()
# X_train = vectorizer.fit_transform(train_data)
# X_test = vectorizer.transform(test_data)

# # Undersample specific categories
# categories_to_undersample = ['others']
# X_undersampled = []
# y_undersampled = []

# for category in categories_to_undersample:
#     X_category = X_train[train_labels == category]
#     y_category = train_labels[train_labels == category]

#     # Check if the category has more than one unique class before applying undersampling
#     if len(np.unique(y_category)) > 1:
#         undersampler = RandomUnderSampler(sampling_strategy='majority', random_state=42)
#         X_category_under, y_category_under = undersampler.fit_resample(X_category, y_category)
#         X_undersampled.append(X_category_under)
#         y_undersampled.append(y_category_under)

# # Concatenate arrays only if they are not empty
# if X_undersampled:
#     X_train_under = np.concatenate([X_train, *X_undersampled])
#     train_labels_under = np.concatenate([train_labels, *y_undersampled])
# else:
#     X_train_under = X_train
#     train_labels_under = train_labels

# # Model selection and training
# best_model = None
# best_accuracy = 0
# best_params = None

# for model in [MultinomialNB(), SVC(), RandomForestClassifier()]:
#     param_grid = [
#         # For MultinomialNB
#         {'alpha': [0.1, 1, 10], 'fit_prior': [True, False]} if model == MultinomialNB else
#         # For SVC
#         {'C': [0.1, 1, 10], 'kernel': ['linear', 'rbf'], 'class_weight': ['balanced']} if model == SVC else
#         # For RandomForestClassifier
#         {'n_estimators': [100, 200, 500]} if model == RandomForestClassifier else {}
#     ]

#     grid_search = GridSearchCV(model, param_grid, cv=5)  # Use cross-validation
#     grid_search.fit(X_train_under, train_labels_under)

#     best_estimator = grid_search.best_estimator_
#     predictions = best_estimator.predict(X_test)

#     accuracy = accuracy_score(test_labels, predictions)
#     print(f'Accuracy for {model.__class__.__name__}: {accuracy:.2f}')
#     print(classification_report(test_labels, predictions))

#     if accuracy > best_accuracy:
#         best_model = best_estimator
#         best_accuracy = accuracy
#         best_params = grid_search.best_params_

# # Prediction
# raw_cookie_data = ["lcsrftoken"] 
# preprocessed_cookie = vectorizer.transform(raw_cookie_data)
# predicted_category = best_model.predict(preprocessed_cookie)
# print(f"Predicted Category: {predicted_category[0]}")

# -----------------------------------------------------------------------
# THE FOLLOWING CODE USES CLASS WEIGHTS STRATEGY. YOU CAN CHOOSE
# TO DO IT MANUALLY BY ASSIGNING IT THE WEIGHTS OR CODE IT TO BECOME 
# AUTOMATICALLY WEIGHTED. BOTH CODES ARE A FAIL THOE.
# -----------------------------------------------------------------------

# import pandas as pd
# from sklearn.model_selection import train_test_split
# from sklearn.feature_extraction.text import CountVectorizer
# from sklearn.naive_bayes import MultinomialNB
# from sklearn.metrics import accuracy_score, classification_report
# from sklearn.utils import class_weight
# import numpy as np

# # Load the dataset
# csv_file_path = 'D:\SIT\Y2S2\ICT2214 Web Security\Assignment_Git\ict2214websec\cookie_data.csv'
# df = pd.read_csv(csv_file_path)

# # Handle missing values
# df['Cookie-ID'].fillna('', inplace=True)
# df.drop(df[df['Category'] == 'Category'].index, inplace=True)

# # Split the data
# train_data, test_data, train_labels, test_labels = train_test_split(
#     df['Cookie-ID'], df['Category'], test_size=0.2, random_state=42
# )

# # Feature extraction
# vectorizer = CountVectorizer()
# X_train = vectorizer.fit_transform(train_data)
# X_test = vectorizer.transform(test_data)

# class_weights = {
#     'advertisement': 1.1,
#     'analytics': 1.0,
#     'functional': 1.0,  # Assign higher weight to prioritize
#     'necessary': 1.0,  # Assign even higher weight to prioritize
#     'others': 1.0,
#     'performance': 0.5,
# }

# # Convert dictionary values to array
# class_prior_array = np.array(list(class_weights.values()))

# # Create the classifier with manually assigned class weights
# classifier = MultinomialNB(class_prior=class_prior_array)

# # Fit the model
# classifier.fit(X_train, train_labels)

# # Make predictions
# predictions = classifier.predict(X_test)

# # Evaluate the model
# accuracy = accuracy_score(test_labels, predictions)
# print(f'Accuracy: {accuracy:.2f}')
# print(classification_report(test_labels, predictions))

# # Example prediction
# raw_cookie_data = "hotsite"
# preprocessed_cookie = vectorizer.transform([raw_cookie_data])
# predicted_category = classifier.predict(preprocessed_cookie)
# print(f"Predicted Category: {predicted_category[0]}")

# -----------------------------------------------------------------------
# THE FOLLOWING CODE USES UNDERSAMPLING STRATEGY
# -----------------------------------------------------------------------

# import pandas as pd
# from sklearn.model_selection import train_test_split
# from sklearn.feature_extraction.text import CountVectorizer
# from sklearn.naive_bayes import MultinomialNB
# from sklearn.metrics import accuracy_score, classification_report
# from imblearn.under_sampling import RandomUnderSampler

# # Example dataset
# csv_file_path = 'D:\SIT\Y2S2\ICT2214 Web Security\Assignment_Git\ict2214websec\cookie_data.csv'
# df = pd.read_csv(csv_file_path)

# # Handle missing values in the 'Cookie-ID' column by replacing them with an empty string
# df['Cookie-ID'].fillna('', inplace=True)
# df.drop(df[df['Category'] == 'Category'].index, inplace=True)

# # Split the data into training and testing sets
# train_data, test_data, train_labels, test_labels = train_test_split(df['Cookie-ID'], df['Category'], test_size=0.2, random_state=42)

# # Apply Random Under-Sampling to the training data
# rus = RandomUnderSampler(random_state=42)  # Adjust random_state if needed
# X_train_res, y_train_res = rus.fit_resample(train_data.to_frame(), train_labels)

# # Feature extraction using CountVectorizer
# vectorizer = CountVectorizer()
# X_train = vectorizer.fit_transform(X_train_res['Cookie-ID'])  # Use resampled data for training
# X_test = vectorizer.transform(test_data)

# # Use a simple classifier like Multinomial Naive Bayes
# classifier = MultinomialNB()
# classifier.fit(X_train, y_train_res)  # Use y_train_res instead of train_labels

# # Make predictions on the test set
# predictions = classifier.predict(X_test)

# # Evaluate the model
# accuracy = accuracy_score(test_labels, predictions)
# print(f'Accuracy: {accuracy:.2f}')

# # Classification report for more detailed evaluation
# print(classification_report(test_labels, predictions))

# # Example raw cookie data
# raw_cookie_data = "lcsrftoken"

# # Preprocess and vectorize the cookie data
# preprocessed_cookie = vectorizer.transform([raw_cookie_data])

# # Make predictions
# predicted_category = classifier.predict(preprocessed_cookie)

# # Print the predicted category
# print(f"Predicted Category: {predicted_category[0]}")
