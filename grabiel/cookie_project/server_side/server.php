<?php
function encryptCookieValue($value, $key) {
    $method = 'AES-256-CBC';
    $ivLength = openssl_cipher_iv_length($method);
    $iv = openssl_random_pseudo_bytes($ivLength);

    $encryptedValue = openssl_encrypt($value, $method, $key, 0, $iv);
    // Concatenate IV with encrypted data and encode to transmit it via cookie
    $encryptedValueWithIv = base64_encode($iv . $encryptedValue);

    return $encryptedValueWithIv;
}

function decryptCookieValue($encryptedValueWithIv, $key) {
    $method = 'AES-256-CBC';
    $ivLength = openssl_cipher_iv_length($method);

    // Decode the concatenated data and extract the IV and encrypted data
    $combined = base64_decode($encryptedValueWithIv);
    $iv = substr($combined, 0, $ivLength);
    $encryptedValue = substr($combined, $ivLength);

    $decryptedValue = openssl_decrypt($encryptedValue, $method, $key, 0, $iv);

    return $decryptedValue;
}

// Your secret key should be exactly 32 bytes long for AES-256-CBC
$secret = 'your-secret-passphrase';
$key = hash('sha256', $secret, true); // Derive a key using SHA-256

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Handle setting the cookie
    $cookieName = 'my_cookie';
    $data = json_decode(file_get_contents('php://input'), true);
    $cookieValue = $data['value']; // This should match the JSON property sent from JS

    // Pass the derived key to the encryption function
    $encryptedValue = encryptCookieValue($cookieValue, $key);
    $expiration = time() + 7 * 24 * 60 * 60; // 7 days

    setcookie($cookieName, $encryptedValue, $expiration, '/');
    echo 'Cookie set successfully.';
    // Return the encrypted value for debugging purposes
    echo ' Encrypted cookie value: ' . $encryptedValue;
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Handle retrieving the cookie
    $cookieName = 'my_cookie';

    if (isset($_COOKIE[$cookieName])) {
        // Pass the derived key to the decryption function
        $decryptedValue = decryptCookieValue($_COOKIE[$cookieName], $key);
        echo 'Retrieved cookie value: ' . $decryptedValue;
    } else {
        echo 'Cookie not found.';
    }
}
?>