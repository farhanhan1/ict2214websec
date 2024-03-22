# Imported libraries for usage
import os
import nltk
import joblib
import numpy as np
import pandas as pd
from sklearn.svm import SVC
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from sklearn.pipeline import Pipeline
from catboost import CatBoostClassifier
from nltk.tokenize import word_tokenize
from scipy.sparse import hstack, csr_matrix
from sklearn.naive_bayes import MultinomialNB
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import StackingClassifier, RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, f1_score

# Download necessary NLTK data
nltk.download('punkt')
nltk.download('stopwords')

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


def parse_keywords_file(filepath):
    category_keywords = {}
    with open(filepath, 'r') as file:
        for line in file:
            # Split the line into category and keywords part
            category, keywords_str = line.split(':')
            # Split the keywords string into a list, strip whitespace, and remove duplicates
            keywords = list(set([keyword.strip() for keyword in keywords_str.split(',')]))
            category_keywords[category.strip()] = keywords
    return category_keywords

# Define the file paths
model_file_path = r'cookie_classifier_model_RF_MNBonly.joblib'
data_file_path = r'cookieDB.csv'
keywords_file_path = r'distinctKeywords.txt'

if os.path.exists(model_file_path):
    # Load the saved model, vectorizer, and label encoder if they exist
    pipeline, vectorizer, le = joblib.load(model_file_path)
else:
    # Load your dataset
    df = pd.read_csv(data_file_path)

    df['Cookie-ID'] = df['Cookie-ID'].fillna('missing')
    X = df['Cookie-ID']

    le = LabelEncoder()
    y_encoded = le.fit_transform(df['Category'])
        
    category_keywords = parse_keywords_file(keywords_file_path)
    
    # Split the dataset
    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)
    tokenizer = CustomTokenizer() 
    custom_feature_extractor = CustomFeatureExtractor(tokenizer=CustomTokenizer(), category_keywords=category_keywords)

    # Pipeline with TF-IDF and the stacking classifier
    pipeline = Pipeline([
        ('feature_extractor', custom_feature_extractor),
        ('classifier', MultinomialNB())
    ])

    # Train the model
    pipeline.fit(X_train, y_train)

    # Predict and evaluate
    y_pred = pipeline.predict(X_test)

    # Calculate accuracy and F1-score
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average='weighted') # Use 'binary' if you have a binary classification problem

    print(f'Accuracy: {accuracy:.4f}')
    print(f'F1-Score: {f1:.4f}')
    print(classification_report(y_test, y_pred, zero_division=0))

    # Save the pipeline, tokenizer, and label encoder
    joblib.dump((pipeline, tokenizer, le), model_file_path)

# Function to predict the category of a new cookie ID
def predict_category(cookie_id, model=pipeline, label_encoder=le):
    prediction = model.predict([cookie_id])
    # Use the label encoder to transform predictions back to original labels
    return label_encoder.inverse_transform(prediction)[0]

# Example usage
example_cookie_id = 'dc_gtm'
predicted_category = predict_category(example_cookie_id)
print(f'The predicted category for the given cookie ID is: {predicted_category}')