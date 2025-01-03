from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId
import requests
import base64
import os
import io
from datetime import datetime
import json
import time

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

# Simple rate limiter class
class RateLimiter:
    def __init__(self, calls_per_second=1):
        self.calls_per_second = calls_per_second
        self.last_call = 0

    def acquire(self):
        now = time.time()
        time_passed = now - self.last_call
        if time_passed < 1/self.calls_per_second:
            time.sleep(1/self.calls_per_second - time_passed)
        self.last_call = time.time()

rate_limiter = RateLimiter(calls_per_second=1)

@app.route('/api/candy-machines', methods=['POST'])
def create_candy_machine():
    try:
        data = request.get_json()
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

@app.route('/api/generate-nft/metadata', methods=['POST'])
def generate_nft_metadata():
    try:
        data = request.get_json()
        prompt = data.get('prompt')
        total_number = data.get('number', 10)
        
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400

        # Get the first batch to establish trait types
        first_batch_response = generate_batch(prompt, 1, None)
        if not first_batch_response or not isinstance(first_batch_response, list):
            raise ValueError("Failed to generate initial batch")

        first_nft = first_batch_response[0]
        trait_types = []
        
        if "attributes" in first_nft:
            trait_types = [trait["trait_type"] for trait in first_nft["attributes"]]
        elif "trait_types" in first_nft:
            trait_types = first_nft["trait_types"]
        elif "metadata" in first_nft and "attributes" in first_nft["metadata"]:
            trait_types = [trait["trait_type"] for trait in first_nft["metadata"]["attributes"]]
        
        if not trait_types:
            raise ValueError("Could not find trait types in response")

        system_prompt = f"""You are an NFT metadata generator. Generate unique metadata for each NFT in a collection.
        CRITICAL REQUIREMENTS:
        1. You MUST use EXACTLY these trait types for ALL NFTs: {', '.join(trait_types)}
        2. The generation prompt MUST explicitly mention ALL trait values
        3. Use a consistent perspective and style across all prompts
        
        Each NFT must have:
        1. A unique description
        2. A detailed generation prompt that incorporates ALL trait values
        3. Metadata with EXACTLY the trait types listed above
        
        Example of good alignment between traits and prompt:
        {
            "description": "A noble knight with golden armor",
            "prompt": "Generate an image of a knight wearing golden armor (Armor: Gold), wielding a longsword (Weapon: Longsword), with a red plume on the helmet (Helmet: Red Plume), standing in a castle courtyard (Background: Castle)",
            "metadata": {
                "trait_types": [
                    {"trait_type": "Armor", "value": "Gold"},
                    {"trait_type": "Weapon", "value": "Longsword"},
                    {"trait_type": "Helmet", "value": "Red Plume"},
                    {"trait_type": "Background", "value": "Castle"}
                ]
            }
        }"""

        remaining = total_number - 1
        all_nfts = first_batch_response

        while remaining > 0:
            batch_size = min(10, remaining)
            batch_result = generate_batch(prompt, batch_size, system_prompt)
            if batch_result and isinstance(batch_result, list):
                all_nfts.extend(batch_result)
            remaining -= batch_size

        return jsonify(all_nfts), 200

    except Exception as e:
        app.logger.error(f"Error generating NFT metadata: {str(e)}")
        return jsonify({'error': str(e)}), 500

def generate_batch(prompt, batch_size, system_prompt=None):
    if system_prompt is None:
        system_prompt = """You are an NFT metadata generator creating high-end digital art in a specific style.
        The artwork should follow these stylistic guidelines:
        - Modern digital art style similar to popular NFT collections
        - Bold, vibrant colors with psychedelic or rainbow gradients where appropriate
        - Clean, cartoon-like linework with a professional finish
        - Potential for accessories like crowns, sunglasses, or other status symbols
        - Flat color backgrounds or simple gradient backgrounds
        
        CRITICAL REQUIREMENTS:
        1. First, determine 4-6 relevant trait types based on the collection theme
        2. Use these SAME trait types consistently across ALL NFTs
        3. CRUCIAL: Each generation prompt must include:
           - Specific art style reference (e.g., "digital cartoon art style with clean linework")
           - Color palette description (e.g., "vibrant psychedelic colors", "rainbow gradient pattern")
           - Detailed description of each trait and its visual implementation
           - Background style specification
        4. Use a consistent perspective and style across all prompts
        
        Example prompt structure:
        "Create a digital cartoon artwork in the style of modern NFT collections, featuring [subject] with [specific trait details]. 
        Use vibrant colors with [color palette description]. The character should have [detailed trait descriptions]. 
        Set against a [background description]. Maintain clean linework and bold colors throughout."
        
        Remember: Each prompt should be detailed enough to consistently reproduce the intended artistic style."""

    user_prompt = f"""Create a collection of {batch_size} NFTs based on this theme: {prompt}
    
    REQUIREMENTS:
    1. Use the EXACT trait types specified
    2. CRUCIAL: The generation prompt must explicitly mention EVERY trait value
    3. Use consistent perspective and style in all prompts
    4. Follow the rarity distribution guidelines strictly
    5. DO NOT include any rarity indicators in the metadata
    6. Ensure Legendary and Mythic traits feel truly special and unique
     
    Format each NFT exactly like this:
    {{
        "description": "Unique description",
        "prompt": "Detailed prompt that MUST include ALL trait values explicitly",
        "metadata": {{
            "trait_types": [
                {{"trait_type": "Type1", "value": "Value1"}},
                {{"trait_type": "Type2", "value": "Value2"}},
                ... (same traits for all NFTs)
            ]
        }}
    }}"""

    try:
        rate_limiter.acquire()
        
        response = openai_client.chat.completions.create(
            model="grok-2-1212",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={ "type": "json_object" }
        )

        batch_data = response.choices[0].message.content
        
        if isinstance(batch_data, str):
            batch_data = json.loads(batch_data)
        
        if isinstance(batch_data, dict):
            batch_nfts = batch_data.get('nfts', batch_data)
        else:
            batch_nfts = batch_data

        if not isinstance(batch_nfts, list):
            raise ValueError("Invalid response format from Grok")

        return batch_nfts

    except Exception as e:
        app.logger.error(f"Error in generate_batch: {str(e)}")
        return None

@app.route('/api/candy-machines/<candy_machine_id>/collection', methods=['POST'])
def set_collection_nft(candy_machine_id):
    try:
        data = request.get_json()
        collection_uri = data.get('collectionUri')
        
        if not collection_uri:
            return jsonify({'error': 'Collection URI is required'}), 400

        result = candy_machines.find_one_and_update(
            {'candyMachineId': candy_machine_id},
            {
                '$set': {
                    'collectionUri': collection_uri,
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
        app.logger.error(f"Error setting collection NFT: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/candy-machines/<candy_machine_id>/nfts', methods=['POST'])
def set_nfts_uri(candy_machine_id):
    try:
        data = request.get_json()
        nft_uris = data.get('nftUris', [])
        
        if not nft_uris:
            return jsonify({'error': 'NFT URIs array is required'}), 400

        result = candy_machines.find_one_and_update(
            {'candyMachineId': candy_machine_id},
            {
                '$set': {
                    'nftUris': nft_uris,
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
        app.logger.error(f"Error setting NFT URIs: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)