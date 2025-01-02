import torch
from pathlib import Path
import logging
from diffusers import (
    StableDiffusionPipeline,
    DPMSolverMultistepScheduler,
    AutoencoderKL,
    UNet2DConditionModel
)
from transformers import CLIPTextModel, CLIPTokenizer
from typing import List, Optional, Union, Dict
import json
from PIL import Image
import numpy as np
from tqdm.auto import tqdm
import yaml

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NFTGenerator:
    def __init__(self, config_path: str = "config/config.yaml"):
        """Initialize the NFT generator with configuration."""
        self.load_config(config_path)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.setup_pipeline()

    def load_config(self, config_path: str):
        """Load configuration from yaml file."""
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)

    def setup_pipeline(self):
        """Setup the Stable Diffusion pipeline with fine-tuned model."""
        logger.info("Setting up generation pipeline...")
        
        # Load base pipeline
        self.pipeline = StableDiffusionPipeline.from_pretrained(
            self.config["model"]["base_model"],
            torch_dtype=torch.float16 if self.config["model"]["precision"] == "fp16" else torch.float32
        )
        
        # Load fine-tuned UNet if available
        if self.config["inference"]["checkpoint_path"]:
            logger.info(f"Loading fine-tuned model from {self.config['inference']['checkpoint_path']}")
            unet = UNet2DConditionModel.from_pretrained(
                self.config["inference"]["checkpoint_path"],
                torch_dtype=torch.float16 if self.config["model"]["precision"] == "fp16" else torch.float32
            )
            self.pipeline.unet = unet
        
        # Use DPMSolver++ scheduler for better quality
        self.pipeline.scheduler = DPMSolverMultistepScheduler.from_config(
            self.pipeline.scheduler.config
        )
        
        # Enable memory optimization
        self.pipeline.enable_attention_slicing()
        if torch.cuda.is_available():
            self.pipeline = self.pipeline.to("cuda")
            if self.config["inference"].get("enable_xformers", False):
                self.pipeline.enable_xformers_memory_efficient_attention()

    def generate_image(
        self,
        prompt: str,
        negative_prompt: str = None,
        num_images: int = 1,
        guidance_scale: float = 7.5,
        num_inference_steps: int = 50,
        seed: Optional[int] = None
    ) -> List[Image.Image]:
        """Generate NFT images based on prompt."""
        if seed is not None:
            generator = torch.Generator(device=self.device).manual_seed(seed)
        else:
            generator = None
            
        # Add NFT-specific styling to prompt
        enhanced_prompt = self.enhance_prompt(prompt)
        enhanced_negative_prompt = self.enhance_negative_prompt(negative_prompt)
        
        logger.info(f"Generating image(s) with prompt: {enhanced_prompt}")
        
        with torch.autocast("cuda" if torch.cuda.is_available() else "cpu"):
            images = self.pipeline(
                prompt=enhanced_prompt,
                negative_prompt=enhanced_negative_prompt,
                num_images_per_prompt=num_images,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                generator=generator
            ).images
            
        return images

    def enhance_prompt(self, prompt: str) -> str:
        """Enhance prompt with NFT-specific styling."""
        nft_style_prefix = "high quality NFT art piece, digital art, "
        nft_style_suffix = ", trending on artstation, detailed, vibrant colors, professional, collectible"
        
        return f"{nft_style_prefix}{prompt}{nft_style_suffix}"

    def enhance_negative_prompt(self, negative_prompt: Optional[str] = None) -> str:
        """Add NFT-specific negative prompting."""
        base_negative = "blurry, low quality, low resolution, pixelated, watermark, signature, poorly drawn, "
        if negative_prompt:
            return f"{base_negative}, {negative_prompt}"
        return base_negative

    def batch_generate(
        self,
        prompts: List[str],
        output_dir: str,
        batch_config: Optional[Dict] = None
    ) -> List[Dict]:
        """Generate multiple NFTs with different prompts."""
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        if batch_config is None:
            batch_config = self.config["inference"]["batch_defaults"]
        
        results = []
        for idx, prompt in enumerate(tqdm(prompts, desc="Generating NFTs")):
            try:
                images = self.generate_image(
                    prompt=prompt,
                    num_images=batch_config.get("num_images", 1),
                    guidance_scale=batch_config.get("guidance_scale", 7.5),
                    num_inference_steps=batch_config.get("num_inference_steps", 50)
                )
                
                # Save images and metadata
                image_paths = []
                for img_idx, image in enumerate(images):
                    image_path = output_dir / f"{idx}_{img_idx}.png"
                    image.save(image_path)
                    image_paths.append(str(image_path))
                
                results.append({
                    "prompt": prompt,
                    "images": image_paths,
                    "status": "success"
                })
                
            except Exception as e:
                logger.error(f"Error generating NFT for prompt '{prompt}': {str(e)}")
                results.append({
                    "prompt": prompt,
                    "error": str(e),
                    "status": "failed"
                })
        
        # Save generation metadata
        with open(output_dir / "generation_metadata.json", 'w') as f:
            json.dump(results, f, indent=2)
        
        return results

def main():
    # Example usage
    generator = NFTGenerator()
    
    # Single image generation
    images = generator.generate_image(
        prompt="a futuristic cyber punk monkey with neon lights",
        num_images=1
    )
    images[0].save("example_nft.png")
    
    # Batch generation
    prompts = [
        "a cosmic space whale with nebula patterns",
        "a golden mechanical dragon with steampunk elements",
        "a crystalline phoenix rising from digital flames"
    ]
    
    results = generator.batch_generate(
        prompts=prompts,
        output_dir="data/generated",
        batch_config={
            "num_images": 2,
            "guidance_scale": 7.5,
            "num_inference_steps": 50
        }
    )

if __name__ == "__main__":
    main()