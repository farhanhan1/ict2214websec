from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os
from sklearn.base import BaseEstimator, TransformerMixin
from nltk.tokenize import word_tokenize
import numpy as np
from scipy.sparse import hstack, csr_matrix
import logging
from time import sleep

class CustomTokenizer:
    def __init__(self):
        self.stemmer = PorterStemmer()
        self.stop_words = set(stopwords.words('english'))

    def __call__(self, document):
        document = document.replace('_', '')
        tokens = word_tokenize(document)
        enhanced_tokens = [self.stemmer.stem(word) for word in tokens if word.lower() not in self.stop_words and word.isalnum()]
        return enhanced_tokens

class CustomFeatureExtractor(BaseEstimator, TransformerMixin):
    def __init__(self, tokenizer, category_keywords):
        self.tfidf_vectorizer = TfidfVectorizer(tokenizer=tokenizer)
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

# Set up basic configuration for logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
CORS(app)

# Load the complete pipeline, tokenizer, and label encoder from the Joblib file
model_pipeline_path = 'cookie_classifier_model_RF.joblib'
pipeline, tokenizer, le = joblib.load(model_pipeline_path)

# Check if the CSV database exists and load it
cookie_db_path = 'cookieDB.csv'
cookie_db = pd.read_csv(cookie_db_path) if os.path.exists(cookie_db_path) else pd.DataFrame(columns=['Category', 'Cookie-ID'])

def retry_prediction(name, max_attempts=3, initial_delay=0.5, backoff_factor=2):
    """
    Retries the prediction with exponential backoff.

    :param name: The name to predict.
    :param max_attempts: Maximum number of retry attempts.
    :param initial_delay: Initial delay between attempts in seconds.
    :param backoff_factor: Factor by which the delay is progressively increased.
    :return: The prediction result or a failure message.
    """
    delay = initial_delay
    for attempt in range(max_attempts):
        try:
            prediction = pipeline.predict([name])
            return prediction
        except RuntimeError as e:
            logging.error(f"Attempt {attempt + 1} - Error predicting category for '{name}': {str(e)}")
            if attempt < max_attempts - 1:  # Don't sleep after the last attempt
                sleep(delay)
                delay *= backoff_factor
    return None


@app.route('/predict_batch', methods=['POST'])
def predict_batch():
    data = request.get_json()
    cookie_names = data.get('cookie_names', [])
    
    categories = {}
    
    for name in cookie_names:
        # Try to find the cookie name in the database
        db_entry = cookie_db[cookie_db['Cookie-ID'] == name]
        if not db_entry.empty:
            categories[name] = db_entry['Category'].iloc[0]
        else:
            # Attempt prediction with retry mechanism
            prediction = retry_prediction(name)
            if prediction is not None:
                # Transform the prediction back to original labels if necessary
                category = le.inverse_transform(prediction)[0] if le else prediction[0]
                categories[name] = category
            else:
                categories[name] = "Prediction failed after retries"

    return jsonify({'categories': categories})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)