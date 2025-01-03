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

def generate_position_template():
    """Generate a standardized camera and position configuration template."""
    config_prompt = """Create the camera and position configuration for an NFT collection.
    Return ONLY a JSON object with the configuration details like this:
    {
        "camera_config": "front-facing portrait view, framed from shoulders up, head taking 60% of frame height, square 1:1 aspect ratio",
        "position_config": "centered subject, straight standing pose, shoulders visible, clean background behind subject"
    }"""

    try:
        config_response = openai_client.chat.completions.create(
            model="grok-2-1212",
            messages=[
                {"role": "system", "content": "You are a camera and position configuration specialist."},
                {"role": "user", "content": config_prompt}
            ],
            response_format={ "type": "json_object" }
        )

        config = json.loads(config_response.choices[0].message.content)
        return f"{config['camera_config']}. {config['position_config']}"
    except Exception as e:
        app.logger.error(f"Error generating position template: {str(e)}")
        # Fallback to default template if generation fails
        return "front-facing portrait view, framed from shoulders up, head taking 60% of frame height, square 1:1 aspect ratio. centered subject, straight standing pose, shoulders visible, clean background behind subject"

@app.route('/api/generate-nft/metadata', methods=['POST'])
def generate_nft_metadata():
    try:
        data = request.get_json()
        prompt = data.get('prompt')
        total_number = data.get('number', 10)
        
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400

        # Generate position template first
        position_template = generate_position_template()
        
        # Get the first batch with position template (no trait types yet)
        first_batch_response = generate_batch(prompt, 1, position_template)
        if not first_batch_response or not isinstance(first_batch_response, list):
            raise ValueError("Failed to generate initial batch")

        # Extract trait types from first NFT to use for all subsequent batches
        first_nft = first_batch_response[0]
        if 'attributes' not in first_nft:
            raise ValueError("First NFT missing attributes")
            
        trait_types = first_nft['attributes']

        # Generate remaining NFTs with the same trait types
        remaining = total_number - 1
        all_nfts = first_batch_response

        while remaining > 0:
            batch_size = min(10, remaining)
            batch_result = generate_batch(prompt, batch_size, position_template, trait_types)
            if batch_result and isinstance(batch_result, list):
                all_nfts.extend(batch_result)
            remaining -= batch_size

        return jsonify(all_nfts), 200

    except Exception as e:
        app.logger.error(f"Error generating NFT metadata: {str(e)}")
        return jsonify({'error': str(e)}), 500

def generate_batch(prompt, batch_size, position_template, trait_types=None):
    """
    Generate a batch of NFTs with consistent trait types.
    If trait_types is provided, use those exact types. If not, generate new ones for the first batch.
    """
    style_template = "Create in a modern cartoon style with bold lines, vibrant colors, and a playful aesthetic similar to popular NFT collections. The art should be clean, distinctive, and have a digital art feel with crisp edges and solid colors."
    
    if trait_types:
        system_prompt = f"""You are an NFT metadata generator. Generate unique metadata for each NFT in a collection.
        
        POSITIONING TEMPLATE (USE THIS EXACT TEXT AT THE START OF EVERY PROMPT):
        "{position_template}"
        
        STYLE REQUIREMENTS:
        {style_template}
        
        CRITICAL REQUIREMENTS:
        1. You MUST use EXACTLY these trait types in this order for ALL NFTs:
        {json.dumps([{"trait_type": t["trait_type"]} for t in trait_types], indent=2)}
        
        2. Every generation prompt MUST start with the positioning template, followed by the style description
        3. The generation prompt MUST explicitly mention ALL trait values
        4. Use consistent style across all prompts
        
        RETURN FORMAT (USE EXACTLY THIS STRUCTURE):
        {{
            "description": "Unique description",
            "prompt": "{position_template}. {style_template}. [Detailed prompt including all traits]",
            "attributes": {json.dumps(trait_types)}
        }}

        DO NOT INCLUDE: name, image_prompt, or any other fields."""
    else:
        system_prompt = f"""You are an NFT metadata generator. Generate unique metadata for each NFT in a collection.
        
        POSITIONING TEMPLATE (USE THIS EXACT TEXT AT THE START OF EVERY PROMPT):
        "{position_template}"
        
        STYLE REQUIREMENTS:
        {style_template}
        
        CRITICAL REQUIREMENTS:
        1. Generate between 3-6 relevant trait types for the collection theme
        2. Every generation prompt MUST start with the positioning template, followed by the style description
        3. The generation prompt MUST explicitly mention ALL trait values
        4. Use consistent style across all prompts

        RETURN FORMAT (USE EXACTLY THIS STRUCTURE):
        {{
            "description": "Unique description",
            "prompt": "{position_template}. {style_template}. [Detailed prompt including all traits]",
            "attributes": [
                {{"trait_type": "Type1", "value": "Value1"}},
                // ... more traits as needed
            ]
        }}

        DO NOT INCLUDE: name, image_prompt, or any other fields."""

    user_prompt = f"""Create {batch_size} NFT{'s' if batch_size > 1 else ''} based on this theme: {prompt}
    
    IMPORTANT: Return ONLY description, prompt, and attributes fields. DO NOT include name, image, or any other fields."""

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
        
        # Extract NFTs array
        if isinstance(batch_data, dict):
            batch_nfts = batch_data.get('nfts', [batch_data])
        else:
            batch_nfts = batch_data

        if not isinstance(batch_nfts, list):
            raise ValueError("Invalid response format from Grok")

        # Clean up any extra fields and validate trait types
        for nft in batch_nfts:
            # Remove unwanted fields
            allowed_fields = {'description', 'prompt', 'attributes'}
            for key in list(nft.keys()):
                if key not in allowed_fields:
                    del nft[key]
                    
            # Convert image_prompt to prompt if it exists
            if 'image_prompt' in nft:
                nft['prompt'] = nft.pop('image_prompt')

            # Validate trait types if they were provided
            if trait_types and 'attributes' in nft:
                if len(nft['attributes']) != len(trait_types):
                    raise ValueError(f"Incorrect number of traits. Expected {len(trait_types)}, got {len(nft['attributes'])}")
                for i, (expected, actual) in enumerate(zip(trait_types, nft['attributes'])):
                    if expected['trait_type'] != actual['trait_type']:
                        nft['attributes'][i]['trait_type'] = expected['trait_type']

            # Ensure position template and style template are added to prompt
            if 'prompt' in nft:
                if not nft['prompt'].startswith(position_template):
                    nft['prompt'] = f"{position_template}. {style_template}. {nft['prompt']}"
                elif not style_template in nft['prompt']:
                    # If position template exists but style template doesn't, insert style template after position template
                    position_end = len(position_template)
                    nft['prompt'] = f"{nft['prompt'][:position_end]}. {style_template}{nft['prompt'][position_end:]}"

        return batch_nfts

    except Exception as e:
        app.logger.error(f"Error in generate_batch: {str(e)}")
        app.logger.error(f"Response content: {response.choices[0].message.content if 'response' in locals() else 'No response'}")
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