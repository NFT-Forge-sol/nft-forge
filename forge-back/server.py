from flask import Flask, request, send_file, jsonify  
from openai import OpenAI
from flask_cors import CORS
import base64
import io

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})


XAI_API_KEY = "xai-RgX1qIuyNvg0Alqx1HE7OZQgkeeDGc0LPRLAoRY31uz2e0S3MjHSvyLUFiNnSiYn0MwFkU6ABBRuCEpM"
BASE_URL = "https://api.x.ai/v1" 

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