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

# Custom tokenizer class
class CustomTokenizer:
    def __init__(self):
        # Initialize the Porter Stemmer for stemming words
        self.stemmer = PorterStemmer()
        # Set up a list of stop words from NLTK for the English language
        self.stop_words = set(stopwords.words('english'))

    def __call__(self, document):
        # Converting the document to lowercase and replace underscores with ''
        document = document.lower().replace('_', '')
        # Tokenize the document into words
        tokens = word_tokenize(document)
        # Stem and filter tokens that are alphanumeric and not in the stop words list
        enhanced_tokens = [self.stemmer.stem(word) for word in tokens if word.isalnum() and word not in self.stop_words]
        return enhanced_tokens

class CustomFeatureExtractor(BaseEstimator, TransformerMixin):
    def __init__(self, tokenizer, category_keywords):
        # Initialize a TF-IDF vectorizer with a custom tokenizer and specific n-gram range
        self.tfidf_vectorizer = TfidfVectorizer(tokenizer=tokenizer, ngram_range=(1, 3))
        # Store category keywords provided during initialization
        self.category_keywords = category_keywords

    def fit(self, X, y=None):
        # Fit the TF-IDF vectorizer to the data
        self.tfidf_vectorizer.fit(X)
        return self 

    def transform(self, X, y=None):
        # Transform the data to TF-IDF features
        tfidf_features = self.tfidf_vectorizer.transform(X)
        
        # Generate custom features based on category keywords
        custom_features = self.generate_keyword_features(X)
        
        # Combine TF-IDF and custom features into a single feature matrix
        combined_features = hstack([tfidf_features, csr_matrix(custom_features)])
        return combined_features

    def generate_keyword_features(self, X):
        feature_matrix = []
        for document in X:
            features = []
            document = document.lower()
            for keywords in self.category_keywords.values():
                # Count occurrences of each keyword in the document
                category_features = [document.count(keyword) for keyword in keywords]
                features.extend(category_features)
            feature_matrix.append(features)
        return np.array(feature_matrix)

# Function to parse a file containing keywords for different categories
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
# Add r in front of '' for actual copied path
model_file_path = r'cookie_classifier_model_RF.joblib'
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

    # Encoding the Categories
    le = LabelEncoder()
    y_encoded = le.fit_transform(df['Category'])
        
    category_keywords = parse_keywords_file(keywords_file_path)
    
    # Split the dataset
    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)
    tokenizer = CustomTokenizer() 
    custom_feature_extractor = CustomFeatureExtractor(tokenizer=CustomTokenizer(), category_keywords=category_keywords)

    # Base estimators
    estimators = [
        ('rf', RandomForestClassifier(n_estimators=448, max_depth=9, class_weight='balanced')),
        ('svm', SVC(C=10, probability=True, random_state=42)),
        ('catboost', CatBoostClassifier(verbose=0, random_state=42)),
        ('mnb', MultinomialNB())  # Keep MultinomialNB as it doesn't have the specified parameters
    ]
    
    # Stacking classifier with Logistic Regression as the final estimator
    stacking_classifier = StackingClassifier(
        estimators=estimators,
        final_estimator=LogisticRegression()
    )

    # Pipeline with custom extractor and the stacking classifier
    pipeline = Pipeline([
        ('feature_extractor', custom_feature_extractor),
        ('classifier', stacking_classifier)
    ])

    # Train the model
    pipeline.fit(X_train, y_train)

    # Predict and evaluate
    y_pred = pipeline.predict(X_test)

    # Calculate accuracy and F1-score
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average='weighted')
    print(f'Accuracy: {accuracy:.4f}')
    print(f'F1-Score: {f1:.4f}')
    print(classification_report(y_test, y_pred, zero_division=0))

    # Save the pipeline, tokenizer, and label encoder
    joblib.dump((pipeline, tokenizer, le), model_file_path)

#Threshold is implemented to prevent false positives
thresholds = {
    'advertisement': 0.477678,
    'analytics': 0.942612,
    'functional': 0.6995015,
    'necessary': 0.900194,
    'performance': 0.62717175
}

# Prediction category and probability function 
def predict_category_and_probability(cookie_id, model=pipeline, label_encoder=le, thresholds=thresholds):
    # Predict the category for the given cookie ID
    prediction = model.predict([cookie_id])
    predicted_category = label_encoder.inverse_transform(prediction)[0]
    
    # Predict the probabilities for each category
    probabilities = model.predict_proba([cookie_id])
    
    # Get the probability for the predicted category
    predicted_probability = probabilities[0][prediction[0]]
    
    # Check if the predicted probability is below the specific threshold for that category
    category_threshold = thresholds.get(predicted_category, 0)  # Default to 0 if category not in thresholds
    if predicted_probability < category_threshold:
        return 'Others', predicted_probability
    else:
        return predicted_category, predicted_probability


############# FOLLOWING CODE IS USED TO PREDICT AN ENTIRE TEST DATA THAT IS IN CSV #############
############################## CAN BE COMMENTED OUT IF NOT NEDDED ##############################

# Load the dataset where you want to make predictions
input_data_file_path = r'cleaned_output_file.csv'  # Update this path to the new dataset CSV file
output_data_file_path = r'cleaned_output_filev6.csv'  # Path to save the output

# Read the new dataset
new_df = pd.read_csv(input_data_file_path)

# Check if the second column exists and has a proper header; adjust '1' as needed based on your CSV structure
cookie_ids = new_df.iloc[:, 1]  # This assumes the second column contains the cookie IDs

# Predict categories and probabilities for each cookie ID
results = [predict_category_and_probability(cookie_id) for cookie_id in cookie_ids]

# Extract categories and probabilities into separate lists
predicted_categories, predicted_probabilities = zip(*results)

# Add the predictions as new columns in the DataFrame
new_df['Predicted Category'] = predicted_categories
new_df['Predicted Probability'] = predicted_probabilities

# Save the updated DataFrame to a new CSV file
new_df.to_csv(output_data_file_path, index=False)

print(f'Updated dataset saved to {output_data_file_path}')