from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import nltk
from nltk.stem import PorterStemmer
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import os
import pandas as pd

nltk.download('punkt')
nltk.download('stopwords')

app = Flask(__name__)
CORS(app)

class CustomTokenizer:
    def __init__(self):
        self.stemmer = PorterStemmer()
        self.stop_words = set(stopwords.words('english'))

    def __call__(self, document):
        document = document.replace('_', '')
        tokens = word_tokenize(document)
        enhanced_tokens = [self.stemmer.stem(word) for word in tokens if word.lower() not in self.stop_words and word.isalnum()]
        return enhanced_tokens

# Load ML model and vectorizer
model_file_path = 'cookie_classifier_model_RF.joblib'
model, vectorizer = joblib.load(model_file_path)

# Load CSV database (ensure 'cookieDB.csv' is in the same directory as this script)
cookie_db_path = 'cookieDB.csv'
cookie_db = pd.read_csv(cookie_db_path) if os.path.exists(cookie_db_path) else pd.DataFrame()

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    cookie_name = data.get('cookie_name')
    vectorized_cookie_name = vectorizer.transform([cookie_name])
    prediction = model.predict(vectorized_cookie_name)
    category = prediction[0]  # Assuming the model returns a single category
    return jsonify({'category': category})

@app.route('/predict_batch', methods=['POST'])
def predict_batch():
    data = request.get_json()
    cookie_names = data.get('cookie_names', [])

    if not cookie_names:
        return jsonify({'error': 'No cookie names provided', 'categories': {}}), 400

    categories = {}
    try:
        # Check in the CSV database first
        for name in cookie_names:
            category = cookie_db[cookie_db['Cookie-ID'] == name]['Category'].values
            categories[name] = category[0] if len(category) > 0 else None
        
        # Prepare the list of names that were not found in the CSV
        names_to_predict = [name for name in cookie_names if not categories[name]]

        # Predict with joblib only if there are names to predict
        if names_to_predict:
            vectorized_cookie_names = vectorizer.transform(names_to_predict)
            predictions = model.predict(vectorized_cookie_names)
            categories.update({name: pred for name, pred in zip(names_to_predict, predictions)})
        
        return jsonify({'categories': categories})
    except Exception as e:
        return jsonify({'error': str(e), 'categories': {}}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)