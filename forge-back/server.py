from flask import Flask, request, send_file, jsonify  
from openai import OpenAI
from flask_cors import CORS
from dotenv import load_dotenv
import requests
import base64
import os
import io

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})


XAI_API_KEY = os.getenv("XAI_API_KEY") 
BASE_URL = os.getenv("BASE_URL")
PINATA_API_KEY = os.getenv("PINATA_API_KEY")
PINATA_API_SECRET = os.getenv("PINATA_API_SECRET")

client = OpenAI(
    api_key=XAI_API_KEY,
    base_url=BASE_URL,
)

@app.route('/api/generate-image', methods=['POST'])
def generate_image():
    prompt = request.json.get('prompt')
    if not prompt:
        return "Prompt missing", 400
    
    try:
        response = client.images.generate(
            model="grok-2-vision-1212",
            prompt=prompt,
            n=1,  
            size="256x256"
        )

        image_data = response.data[0].b64_json  

        image_bytes = base64.b64decode(image_data)
    
        image_stream = io.BytesIO(image_bytes)
        
        return send_file(image_stream, mimetype='image/png')

    except Exception as e:
        app.logger.error(f"Error while generating the image: {str(e)}")
        return f"An error was thrown: {str(e)}", 500
    
@app.route('/api/upload-to-pinata', methods=['POST'])
def upload_to_pinata():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    
    url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
    headers = {
        "pinata_api_key": PINATA_API_KEY,
        "pinata_secret_api_key": PINATA_API_SECRET,
    }
    files = {
        'file': (file.filename, file.stream, file.mimetype),
    }
    
    try:
        response = requests.post(url, headers=headers, files=files)
        response.raise_for_status()
        pinata_response = response.json()
        return jsonify(pinata_response), 200
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/list-models', methods=['GET'])
def list_models():
    try:
        response = client.models.list()
        models_list = [model.id for model in response.data]
        return jsonify({"models": models_list}), 200
    except Exception as e:
        app.logger.error(f"Error while getting models : {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)