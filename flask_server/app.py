from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os
import logging
import numpy as np
from time import sleep
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer
from nltk.corpus import stopwords
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_extraction.text import TfidfVectorizer
from scipy.sparse import hstack, csr_matrix
from nltk.tokenize import word_tokenize

class CustomTokenizer:
    def __init__(self):
        self.stemmer = PorterStemmer()
        self.stop_words = set(stopwords.words('english'))

    def __call__(self, document):
        document = document.lower().replace('_', '')
        tokens = word_tokenize(document)
        enhanced_tokens = [self.stemmer.stem(word) for word in tokens if word.isalnum() and word not in self.stop_words]
        return enhanced_tokens

class CustomFeatureExtractor(BaseEstimator, TransformerMixin):
    def __init__(self, tokenizer, category_keywords):
        # Specify ngram_range in TfidfVectorizer initialization
        self.tfidf_vectorizer = TfidfVectorizer(tokenizer=tokenizer, ngram_range=(1, 3))
        self.category_keywords = category_keywords

    def fit(self, X, y=None):
        self.tfidf_vectorizer.fit(X)
        return self 

    def transform(self, X, y=None):
        tfidf_features = self.tfidf_vectorizer.transform(X)
        custom_features = self.generate_keyword_features(X)
        combined_features = hstack([tfidf_features, csr_matrix(custom_features)])
        return combined_features

    def generate_keyword_features(self, X):
        feature_matrix = []
        for document in X:
            features = []
            document = document.lower()
            for keywords in self.category_keywords.values():
                category_features = [document.count(keyword) for keyword in keywords]
                features.extend(category_features)
            feature_matrix.append(features)
        return np.array(feature_matrix)

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
CORS(app)

# Joblib loading
model_pipeline_path = 'cookie_classifier_model_RF.joblib'
pipeline, tokenizer, le = joblib.load(model_pipeline_path)

# Define thresholds for each category's prediction
# Values have been selected based on experiments and evaluation
thresholds = {
    'advertisement': 0.477678,
    'analytics': 0.942612,
    'functional': 0.6995015,
    'necessary': 0.945611,
    'performance': 0.62717175
}

# Path to the CSV database
cookie_db_path = 'cookieDB.csv'
cookie_db = pd.read_csv(cookie_db_path) if os.path.exists(cookie_db_path) else pd.DataFrame(columns=['Category', 'Cookie-ID'])

# Uses defined thresholds to make accurate prediction
def predict_with_thresholds(name, pipeline=pipeline, le=le, thresholds=thresholds):
    # Convert name to a list if it's not already, to avoid the 'replace' issue
    if not isinstance(name, list):
        name = [name]
    
    prediction_proba = pipeline.predict_proba(name)[0]
    prediction = np.argmax(prediction_proba)
    predicted_category = le.inverse_transform([prediction])[0]
    
    if prediction_proba[prediction] < thresholds.get(predicted_category, 1):
        return 'Others'
    return predicted_category

# Retries prediction if failed due to any errors
def retry_prediction(name, max_attempts=3, initial_delay=0.5, backoff_factor=2):
    delay = initial_delay
    for attempt in range(max_attempts):
        try:
            # Directly use the pipeline's predict_proba and adjust based on thresholds
            category = predict_with_thresholds(name)
            return category
        except Exception as e:
            logging.error(f"Attempt {attempt + 1} - Error predicting category for '{name}': {str(e)}")
            if attempt < max_attempts - 1:
                sleep(delay)
                delay *= backoff_factor
    return 'Prediction failed after retries'

# predict_batch used as an endpoint
@app.route('/predict_batch', methods=['POST'])
def predict_batch():
    data = request.get_json()
    cookie_names = data.get('cookie_names', [])
    
    categories = {}
    
    for name in cookie_names:
        # Look up the cookie in the database
        db_entry = cookie_db[cookie_db['Cookie-ID'] == name]
        if not db_entry.empty:
            categories[name] = db_entry['Category'].iloc[0]
        else:
            # Use retry mechanism for prediction
            category = retry_prediction(name)
            categories[name] = category

    return jsonify({'categories': categories})

# Starts Flask app on port 5000
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
