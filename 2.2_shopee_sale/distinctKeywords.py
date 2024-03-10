import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from nltk.stem import PorterStemmer
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import nltk

nltk.download('punkt')
nltk.download('stopwords')


class CustomTokenizer:
    """
    Custom tokenizer for text pre-processing.
    """
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
    """
    Analyzes cookie data for distinctive keywords per category and outputs them to a text file.
    """
    try:
        df = pd.read_csv(data_path)
        df['Cookie-ID'] = df['Cookie-ID'].fillna('missing')
    except FileNotFoundError:
        print(f"Error: File not found at {data_path}")
        return {}

    vectorizer = CountVectorizer(tokenizer=CustomTokenizer(), lowercase=True)
    X = vectorizer.fit_transform(df['Cookie-ID'])
    words = vectorizer.get_feature_names_out()

    word_freq_by_cat = {category: {} for category in categories}
    for category in categories:
        mask = df['Category'] == category
        category_counts = np.asarray(X[mask].sum(axis=0)).ravel()
        word_freq_by_cat[category] = dict(zip(words, category_counts))

    distinctive_keywords_by_cat = {}
    for category, word_freq in word_freq_by_cat.items():
        other_cat_freqs = [word_freq_by_cat[other_cat].get(word, 0) for word in word_freq for other_cat in categories if other_cat != category]
        median_freq = np.median(other_cat_freqs)
        keywords = [word for word, freq in word_freq.items() if freq > median_freq]
        distinctive_keywords_by_cat[category] = keywords

    # Output to text file
    output_path = 'distinctive_keywords.txt'
    with open(output_path, 'w') as file:
        for category, keywords in distinctive_keywords_by_cat.items():
            file.write(f"{category}: {', '.join(keywords)}\n")

    return distinctive_keywords_by_cat

# Example usage
data_path = 'updated_final.csv'
categories = ['advertisement', 'analytics', 'functional', 'necessary', 'performance']
distinctive_keywords = analyze_cookie_data(data_path, categories)
