import os
from pathlib import Path
from PIL import Image
import json
import logging
from typing import List, Dict
import numpy as np
from tqdm import tqdm

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NFTPreprocessor:
    def __init__(self, config: dict):
        self.config = config
        self.raw_dir = Path(config["data"]["raw_dir"])
        self.processed_dir = Path(config["data"]["processed_dir"])
        self.processed_dir.mkdir(parents=True, exist_ok=True)
        
    def process_images(self):
        """Process all images in raw directory."""
        logger.info("Processing images...")
        
        # Get all image files
        image_files = list(self.raw_dir.glob("*.png"))
        metadata = []
        
        for img_path in tqdm(image_files, desc="Processing images"):
            try:
                # Load image
                image = Image.open(img_path).convert('RGB')
                
                # Process image
                processed_image = self._process_single_image(image)
                
                # Save processed image
                output_path = self.processed_dir / img_path.name
                processed_image.save(output_path)
                
                # Collect metadata
                metadata.append({
                    "original_path": str(img_path),
                    "processed_path": str(output_path),
                    "size": processed_image.size
                })
                
            except Exception as e:
                logger.error(f"Error processing {img_path}: {str(e)}")
                
        # Save metadata
        self._save_metadata(metadata)
        
    def _process_single_image(self, image: Image.Image) -> Image.Image:
        """Process a single image."""
        # Resize
        target_size = self.config["data"]["image_size"]
        
        # Calculate aspect ratio
        aspect_ratio = image.width / image.height
        
        if aspect_ratio > 1:
            new_width = target_size
            new_height = int(target_size / aspect_ratio)
        else:
            new_height = target_size
            new_width = int(target_size * aspect_ratio)
            
        image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Center crop if needed
        if new_width != target_size or new_height != target_size:
            left = (new_width - target_size) // 2
            top = (new_height - target_size) // 2
            right = left + target_size
            bottom = top + target_size
            image = image.crop((left, top, right, bottom))
        
        return image
    
    def _save_metadata(self, metadata: List[Dict]):
        """Save processing metadata."""
        metadata_path = self.processed_dir / "metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

def main():
    import yaml
    
    # Load config
    with open("config/config.yaml", 'r') as f:
        config = yaml.safe_load(f)
    
    # Initialize preprocessor
    preprocessor = NFTPreprocessor(config)
    
    # Process images
    preprocessor.process_images()

if __name__ == "__main__":
    main()