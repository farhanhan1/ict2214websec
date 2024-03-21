# Imported libraries for usage
import nltk
import pandas as pd
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from nltk.tokenize import word_tokenize
from sklearn.feature_extraction.text import CountVectorizer, TfidfTransformer

nltk.download('punkt')
nltk.download('stopwords')

class CustomTokenizer:
    
    # Custom tokenizer for text pre-processing.
    def __init__(self, use_stemming=True):
        self.stemmer = PorterStemmer() if use_stemming else None
        self.stop_words = set(stopwords.words('english'))

    def __call__(self, document):
        document = document.replace('_', '')
        tokens = word_tokenize(document)
        tokens = [word.lower() for word in tokens]
        tokens = [word for word in tokens if word not in self.stop_words and word.isalnum()]
        if self.stemmer:
            tokens = [self.stemmer.stem(word) for word in tokens]
        return tokens


def analyze_cookie_data(data_path, categories):

    # Analyzes cookie data for distinctive keywords per category and outputs them to a text file.
    try:
        df = pd.read_csv(data_path)
        df['Cookie-ID'] = df['Cookie-ID'].fillna('missing')
    except FileNotFoundError:
        print(f"Error: File not found at {data_path}")
        return {}

    # Modified the vectorizer to include unigrams, bigrams and trigrams
    vectorizer = CountVectorizer(tokenizer=CustomTokenizer(), ngram_range=(1, 3), lowercase=True)
    X = vectorizer.fit_transform(df['Cookie-ID'])
    tfidf_transformer = TfidfTransformer()
    X_tfidf = tfidf_transformer.fit_transform(X)
    
    # Get feature names, which now include n-grams
    features = vectorizer.get_feature_names_out()
    
    # Calculate tf-idf scores rather than raw frequencies
    # Using tf-idf instead of raw frequencies has proven to be more accurate
    scores = X_tfidf.toarray().sum(axis=0)
    word_scores = dict(zip(features, scores))

    # Determine the most distinctive n-grams for each category
    distinctive_keywords_by_cat = {}
    for category in categories:
        cat_scores = {}
        for feature, score in word_scores.items():
            # Considering n-grams with a positive score
            if score > 0:  
                cat_scores[feature] = score
                
        # Sort the n-grams for the current category based on their score
        sorted_cat_scores = sorted(cat_scores.items(), key=lambda item: item[1], reverse=True)
        distinctive_keywords_by_cat[category] = [ngram for ngram, score in sorted_cat_scores]

    # Output to text file
    # Add r in front of '' for actual copied path
    output_path = r'distinctKeywords.txt'
    with open(output_path, 'w') as file:
        for category, keywords in distinctive_keywords_by_cat.items():
            file.write(f"{category}: {', '.join(keywords)}\n")

    return distinctive_keywords_by_cat

# Analyze the distinctKeywords for the sanitized dataset
data_path = r'cookieDB.csv'
categories = ['advertisement', 'analytics', 'functional', 'necessary', 'performance']
distinctive_keywords = analyze_cookie_data(data_path, categories)
