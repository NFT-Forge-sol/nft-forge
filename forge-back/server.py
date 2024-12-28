from flask import Flask, request, send_file, jsonify  
from openai import OpenAI
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId
import requests
import base64
import os
import io
from datetime import datetime

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

MONGO_URI = f"mongodb+srv://{os.getenv('MONGO_DB_USER')}:{os.getenv('MONGO_DB_PASSWORD')}@forgeaicluster.6uxm8.mongodb.net/?retryWrites=true&w=majority&appName=ForgeAiCluster"
client = MongoClient(MONGO_URI)
db = client['forgeai-database']
candy_machines = db['forge-marketplace']

XAI_API_KEY = os.getenv("XAI_API_KEY") 
BASE_URL = os.getenv("BASE_URL")
PINATA_API_KEY = os.getenv("PINATA_API_KEY")
PINATA_API_SECRET = os.getenv("PINATA_API_SECRET")

openai_client = OpenAI(
    api_key=XAI_API_KEY,
    base_url=BASE_URL,
)

# Candy Machine Routes
@app.route('/api/candy-machines', methods=['POST'])
def create_candy_machine():
    try:
        data = request.json
        data['createdAt'] = datetime.now()
        data['updatedAt'] = datetime.now()
        data['itemsMinted'] = 0
        data['status'] = 'active'
        
        result = candy_machines.insert_one(data)
        
        candy_machine = candy_machines.find_one({'_id': result.inserted_id})
        candy_machine['_id'] = str(candy_machine['_id'])
        
        return jsonify(candy_machine), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/candy-machines', methods=['GET'])
def get_all_candy_machines():
    try:
        all_machines = list(candy_machines.find({'status': 'active'}).sort('createdAt', -1))
        for machine in all_machines:
            machine['_id'] = str(machine['_id'])
        return jsonify(all_machines), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/candy-machines/<candy_machine_id>', methods=['GET'])
def get_candy_machine(candy_machine_id):
    try:
        machine = candy_machines.find_one({'candyMachineId': candy_machine_id})
        if machine:
            machine['_id'] = str(machine['_id'])
            return jsonify(machine), 200
        return jsonify({'error': 'Candy machine not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/candy-machines/<candy_machine_id>', methods=['PUT'])
def update_candy_machine(candy_machine_id):
    try:
        data = request.json
        data['updatedAt'] = datetime.utcnow()
        
        result = candy_machines.find_one_and_update(
            {'candyMachineId': candy_machine_id},
            {'$set': data},
            return_document=True
        )
        
        if result:
            result['_id'] = str(result['_id'])
            return jsonify(result), 200
        return jsonify({'error': 'Candy machine not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/candy-machines/<candy_machine_id>/mint', methods=['POST'])
def increment_minted_count(candy_machine_id):
    try:
        result = candy_machines.find_one_and_update(
            {'candyMachineId': candy_machine_id},
            {
                '$inc': {'itemsMinted': 1},
                '$set': {'updatedAt': datetime.utcnow()}
            },
            return_document=True
        )
        
        if result:
            result['_id'] = str(result['_id'])
            return jsonify(result), 200
        return jsonify({'error': 'Candy machine not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/candy-machines/creator/<creator_address>', methods=['GET'])
def get_creator_candy_machines(creator_address):
    try:
        machines = list(candy_machines.find({
            'creatorAddress': creator_address,
            'status': 'active'
        }).sort('createdAt', -1))
        
        for machine in machines:
            machine['_id'] = str(machine['_id'])
        return jsonify(machines), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/candy-machines/<candy_machine_id>/status', methods=['PUT'])
def update_candy_machine_status(candy_machine_id):
    try:
        status = request.json.get('status')
        if status not in ['active', 'paused', 'ended']:
            return jsonify({'error': 'Invalid status'}), 400
            
        result = candy_machines.find_one_and_update(
            {'candyMachineId': candy_machine_id},
            {
                '$set': {
                    'status': status,
                    'updatedAt': datetime.utcnow()
                }
            },
            return_document=True
        )
        
        if result:
            result['_id'] = str(result['_id'])
            return jsonify(result), 200
        return jsonify({'error': 'Candy machine not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-image', methods=['POST'])
def generate_image():
    prompt = request.json.get('prompt')
    if not prompt:
        return "Prompt missing", 400
    
    try:
        response = openai_client.images.generate(
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
        print(str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/list-models', methods=['GET'])
def list_models():
    try:
        response = openai_client.models.list()
        models_list = [model.id for model in response.data]
        return jsonify({"models": models_list}), 200
    except Exception as e:
        app.logger.error(f"Error while getting models : {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)