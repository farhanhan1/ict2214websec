import pandas as pd

# Load the dataset
df = pd.read_csv('updated_final.csv')

# Keywords and their corresponding categories
keywords_categories = {
    # "csrf": "necessary",
    # "login": "necessary",
    # "session": "necessary",
    # "sess": "necessary",
    # "tracking": "advertisement",
    # "track": "advertisement",
    # "cart": "necessary",
    # "visit": "advertisement",
    # "social": "advertisement"
    # "gid": "analytics",
    # "cf_clearance": "necessary",
    # "visid_incap": "necessary",
    "_gcl": "analytics",
    "_ga": "analytics",
    "_opt_": "analytics",
    "__utm": "analytics",
}


# Function to reassign categories based on keywords
def reassign_categories(row):
    if isinstance(row['Cookie-ID'], str):  # Check if the value is a string
        for keyword, category in keywords_categories.items():
            if keyword in row['Cookie-ID'].lower() and row['Category'] == "others":
                return category
    return row['Category']

# Apply the reassignment function to each row
df['Category'] = df.apply(reassign_categories, axis=1)

# Save the updated DataFrame to a new CSV file
df.to_csv('updated_final.csv', index=False)

print("Updated cookie categories based on keywords.")
