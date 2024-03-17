from flask import Flask, request, make_response, render_template
import base64
from cryptography.fernet import Fernet
import textwrap

app = Flask(__name__)

# Function to generate a new encryption key
def generate_encryption_key():
    return Fernet.generate_key()

# Route for setting a cookie with "my_cookie_value"
@app.route('/set_cookie')
def set_cookie():
    cookie_name = 'my_cookie'
    cookie_value = 'my_cookie_value'

    # Encrypt and store the cookie
    response = encrypt_and_store_cookie(cookie_name, cookie_value)

    return response

# Route for setting a cookie with a different value
@app.route('/set_modified_cookie')
def set_modified_cookie():
    cookie_name = 'my_cookie'
    cookie_value = 'modified_value'

    # Encrypt and store the cookie
    response = encrypt_and_store_cookie(cookie_name, cookie_value)

    return response

# Encrypting and storing cookies
def encrypt_and_store_cookie(cookie_name, cookie_value):
    # Generate a new encryption key for the cookie
    encryption_key = generate_encryption_key()

    # Generate a Fernet encryption object using the key
    cipher_suite = Fernet(encryption_key)

    # Encrypt the cookie value
    encrypted_cookie_value = cipher_suite.encrypt(cookie_value.encode())

    # Base64 encode the encrypted value
    encoded_cookie_value = base64.urlsafe_b64encode(encrypted_cookie_value).decode()

    # Store the encoded cookie value and the encryption key in cookies
    response = make_response('Cookie has been set.')
    response.set_cookie(cookie_name, encoded_cookie_value)
    response.set_cookie(f"{cookie_name}_key", encryption_key.decode())
    return response

# Route for retrieving a cookie
@app.route('/get_cookie')
def get_cookie():
    cookie_name = 'my_cookie'

    # Retrieve and decrypt the cookie
    decrypted_cookie_value = retrieve_and_decrypt_cookie(cookie_name)

    if decrypted_cookie_value:
        # Wrap the decrypted value to prevent it from exceeding the screen width
        wrapped_decrypted_value = textwrap.fill(decrypted_cookie_value, width=80)

        # Get the encoded value from the request's cookies
        encoded_value = request.cookies.get(cookie_name)

        return render_template('cookie.html', decrypted_value=wrapped_decrypted_value, encoded_value=encoded_value)
    else:
        return "Cookie retrieval failed or invalid cookie."

# Retrieving and decrypting cookies
def retrieve_and_decrypt_cookie(cookie_name):
    # Retrieve the encoded cookie value and its encryption key
    encoded_cookie_value = request.cookies.get(cookie_name)
    encryption_key = request.cookies.get(f"{cookie_name}_key")

    if encoded_cookie_value and encryption_key:
        # Base64 decode the encoded value
        encrypted_cookie_value = base64.urlsafe_b64decode(encoded_cookie_value)

        # Generate a Fernet encryption object using the key
        cipher_suite = Fernet(encryption_key.encode())

        # Decrypt the encrypted value
        decrypted_cookie_value = cipher_suite.decrypt(encrypted_cookie_value).decode()
        return decrypted_cookie_value

    else:
        return None

# Root route
@app.route('/')
def root():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
