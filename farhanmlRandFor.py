import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, f1_score, precision_score, recall_score, confusion_matrix
from sklearn.pipeline import Pipeline
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
        # Remove underscores before tokenization
        document = document.replace('_', '')
        tokens = word_tokenize(document)
        enhanced_tokens = [self.stemmer.stem(word) for word in tokens if word.lower() not in self.stop_words and word.isalnum()]
        return enhanced_tokens

# Define the path for the model file
model_file_path = 'cookie_classifier_model.joblib'

if os.path.exists(model_file_path):
    model, vectorizer = joblib.load(model_file_path)
else:
    df = pd.read_csv('updated_final.csv')  # Make sure this is the correct path
    df['Cookie-ID'] = df['Cookie-ID'].fillna('missing')
    
    X = df['Cookie-ID']
    y = df['Category']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    tokenizer = CustomTokenizer()
    vectorizer = TfidfVectorizer(tokenizer=tokenizer)
    
    X_train_tfidf = vectorizer.fit_transform(X_train)
    
    model = RandomForestClassifier(n_estimators=50000, class_weight='balanced')
    model.fit(X_train_tfidf, y_train)

    # Evaluate model performance on the test set
    X_test_tfidf = vectorizer.transform(X_test)
    y_pred = model.predict(X_test_tfidf)

    accuracy = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {accuracy:.4f}")
    print("Classification Report:\n", classification_report(y_test, y_pred))
    print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred))
    
    joblib.dump((model, vectorizer), model_file_path)

def predict_category(cookie_name, model, vectorizer):
    cookie_name_vectorized = vectorizer.transform([cookie_name])
    prediction = model.predict(cookie_name_vectorized)
    return prediction[0]

cookie_name = "gtag"  # Example cookie name for prediction
predicted_category = predict_category(cookie_name, model, vectorizer)
print(f"The predicted category for '{cookie_name}' is '{predicted_category}'")

if not os.path.exists(model_file_path):
    X_test_tfidf = vectorizer.transform(X_test)
    y_pred = model.predict(X_test_tfidf)
    print(f"Accuracy: {accuracy_score(y_test, y_pred)}")
    print(classification_report(y_test, y_pred))
