import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder  # Import LabelEncoder
import joblib
import os
import nltk
from nltk.stem import PorterStemmer
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords

nltk.download('punkt')
nltk.download('stopwords')

class CustomTokenizer:
    def __init__(self):
        self.stemmer = PorterStemmer()
        self.stop_words = set(stopwords.words('english'))

    def __call__(self, document):
        document = document.replace('_', '')
        tokens = word_tokenize(document)
        enhanced_tokens = [self.stemmer.stem(word) for word in tokens if word.lower() not in self.stop_words and word.isalnum()]
        return enhanced_tokens

model_file_path = 'cookie_classifier_model.joblib'

if os.path.exists(model_file_path):
    model, vectorizer = joblib.load(model_file_path)
else:
    df = pd.read_csv('updated_final.csv')  # Adjust path as needed
    df['Cookie-ID'] = df['Cookie-ID'].fillna('missing')

    # New: Initialize LabelEncoder and encode y labels
    le = LabelEncoder()
    df['Category'] = le.fit_transform(df['Category'])

    X = df['Cookie-ID']
    y = df['Category']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    tokenizer = CustomTokenizer()
    vectorizer = TfidfVectorizer(tokenizer=tokenizer)

    X_train_tfidf = vectorizer.fit_transform(X_train)

    model = XGBClassifier(n_estimators=1000, max_depth=10, learning_rate=0.1, subsample=0.8, colsample_bytree=1, objective='binary:logistic', eval_metric='logloss', use_label_encoder=False)
    model.fit(X_train_tfidf, y_train)

    # Evaluate model performance on the test set
    X_test_tfidf = vectorizer.transform(X_test)
    y_pred = model.predict(X_test_tfidf)

    accuracy = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {accuracy:.4f}")
    print("Classification Report:\n", classification_report(y_test, y_pred))
    print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred))

    joblib.dump((model, vectorizer, le), model_file_path)  # Also save LabelEncoder

# Adjusted predict_category function to decode prediction
def predict_category(cookie_name, model, vectorizer, le):
    cookie_name_vectorized = vectorizer.transform([cookie_name])
    prediction = model.predict(cookie_name_vectorized)
    return le.inverse_transform([prediction[0]])[0]  # Decode prediction back to string label

if os.path.exists(model_file_path):
    model, vectorizer, le = joblib.load(model_file_path)  # Load LabelEncoder as well
    cookie_name = "csrf"  # Example cookie name for prediction
    predicted_category = predict_category(cookie_name, model, vectorizer, le)
    print(f"The predicted category for '{cookie_name}' is '{predicted_category}'")
