from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import requests
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={
    r"/translate": {
        "origins": ["*"],  # Be more specific in production
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
# Llama 3 API endpoint and headers
LLAMA_API_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
API_KEY = os.getenv("LLAMA_API_KEY")  # Use environment variable for API key

@app.route('/api/translate', methods=['OPTIONS', 'POST'])
def translate_text():
    if request.method == 'OPTIONS':
        # Handle preflight (OPTIONS) request by returning CORS headers
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return response

    if request.method == 'POST':
        # Handle the POST request for translation
        data = request.json
        transcript = data.get('transcript', '')
        target_language = data.get('targetLanguage', 'en')

        # Construct the prompt for the translation
        prompt = f"Please translate the following text into {target_language} and output ONLY the translated text:\n{transcript}.\nDo NOT include any notes, suggestions or anything else. Just output the translated text ONLY"

        try:
            # Make API call to Llama 3 (via Groq)
            response = requests.post(
                LLAMA_API_ENDPOINT,
                headers={
                    "Authorization": f"Bearer {API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama3-8b-8192",
                    "messages": [
                        {"role": "system", "content": "You are a professional translator."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7
                }
            )
            
            # Parse the response from the translation API
            response_data = response.json()
            
            if 'choices' not in response_data:
                return jsonify({
                    "error": f"Unexpected API response: {json.dumps(response_data)}"
                }), 500
            
            # Extract the translation
            translation = response_data['choices'][0]['message']['content'].strip()
            
            # Create response with CORS headers
            response = make_response(jsonify({"translation": translation}))
            response.headers.add("Access-Control-Allow-Origin", "*")
            return response
        
        except Exception as e:
            # Return an error response with CORS headers
            response = make_response(jsonify({"error": str(e)}), 500)
            response.headers.add("Access-Control-Allow-Origin", "*")
            return response

# Wrap the Flask app with Vercel for serverless deployment
# (Only if using Vercel, this may be needed)
# app = Vercel(app)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
