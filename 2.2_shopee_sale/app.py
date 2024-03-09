from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import nltk
from nltk.stem import PorterStemmer
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords

nltk.download('punkt')
nltk.download('stopwords')

app = Flask(__name__)
CORS(app)

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

# Load your machine learning model
model_file_path = 'cookie_classifier_model_RF.joblib'
model, vectorizer = joblib.load(model_file_path)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    cookie_name = data.get('cookie_name')
    vectorized_cookie_name = vectorizer.transform([cookie_name])
    prediction = model.predict(vectorized_cookie_name)
    category = prediction[0]  # Assuming the model returns a single category
    return jsonify({'category': category})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)