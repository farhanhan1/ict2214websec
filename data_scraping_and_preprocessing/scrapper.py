# Import necessary libraries
import requests
from bs4 import BeautifulSoup
import csv

# Define the base URL for the cookie search website with placeholders for category and page number
base_url = "https://cookiesearch.org/cookies/?cookie-cat={}&sort=asc&pg={}"

# Define the six categories of cookies
categories = ['necessary', 'analytics', 'advertisement', 'functional', 'performance', 'others']

# Open the CSV file for writing, creating it if it doesn't exist
with open('cookie_data.csv', 'a', newline='', encoding='utf-8') as csvfile:
    csv_writer = csv.writer(csvfile)
    
    # Write the header to the CSV file if it is empty
    if csvfile.tell() == 0:
        csv_writer.writerow(['Category', 'Cookie-ID'])

    # Iterate over each category
    for category in categories:
        # Get the initial page for the category
        response = requests.get(base_url.format(category, 1))
        soup = BeautifulSoup(response.text, 'html.parser')
        pagination = soup.find('div', id='pagination')
        last_page = int(pagination.find_all('a')[-2].text)

        # Iterate over each page for the category
        for page_num in range(1, last_page + 1):
            url = base_url.format(category, page_num)
            response = requests.get(url)
            soup = BeautifulSoup(response.text, 'html.parser')
            # Extract links to individual cookies on the page
            cookie_links = soup.select('#results-outer a')

            # Iterate over each cookie link and extract category and ID
            for link in cookie_links:
                cookie_cat = link['href'].split('&')[0].split('=')[1]
                cookie_id = link['href'].split('&')[2].split('=')[1]
                # Write the category and ID to the CSV file
                csv_writer.writerow([cookie_cat, cookie_id])
