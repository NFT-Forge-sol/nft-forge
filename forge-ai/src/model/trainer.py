import os
import torch
from pathlib import Path
from typing import List, Optional
import logging
from diffusers import (
    StableDiffusionPipeline,
    DDPMScheduler,
    UNet2DConditionModel,
    AutoencoderKL
)
from transformers import CLIPTextModel, CLIPTokenizer
from accelerate import Accelerator
from torch.utils.data import Dataset, DataLoader
import json
from PIL import Image
import numpy as np
from tqdm.auto import tqdm

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NFTDataset(Dataset):
    def __init__(
        self,
        image_dir: str,
        metadata_file: str,
        tokenizer,
        size: int = 512,
        center_crop: bool = True
    ):
        self.image_dir = Path(image_dir)
        self.size = size
        self.center_crop = center_crop
        self.tokenizer = tokenizer

        # Load metadata
        with open(metadata_file, 'r') as f:
            self.metadata = json.load(f)

    def __len__(self):
        return len(self.metadata)

    def __getitem__(self, idx):
        item = self.metadata[idx]
        image_path = self.image_dir / f"{item['platform']}_{idx}.png"
        
        # Load and preprocess image
        image = Image.open(image_path).convert('RGB')
        if self.center_crop:
            crop = min(image.size)
            image = image.crop(
                ((image.size[0] - crop) // 2,
                 (image.size[1] - crop) // 2,
                 (image.size[0] + crop) // 2,
                 (image.size[1] + crop) // 2)
            )
        image = image.resize((self.size, self.size))
        image = np.array(image) / 127.5 - 1.0
        
        # Create prompt
        prompt = f"A high quality NFT art of {item['name']}"
        
        # Tokenize prompt
        tokenized = self.tokenizer(
            prompt,
            padding="max_length",
            max_length=self.tokenizer.model_max_length,
            truncation=True,
            return_tensors="pt"
        )
        
        return {
            "pixel_values": torch.from_numpy(image).permute(2, 0, 1).float(),
            "input_ids": tokenized.input_ids[0]
        }

class LoRATrainer:
    def __init__(self, config: dict):
        self.config = config
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.accelerator = Accelerator()
        
        # Load models
        self.load_models()
        
        # Setup directories
        self.setup_directories()

    def load_models(self):
        """Load and prepare all required models."""
        logger.info("Loading models...")
        
        # Load base models
        self.pipeline = StableDiffusionPipeline.from_pretrained(
            self.config["model"]["base_model"],
            torch_dtype=torch.float16 if self.config["model"]["precision"] == "fp16" else torch.float32
        )
        
        # Prepare individual components
        self.vae = self.pipeline.vae
        self.unet = self.pipeline.unet
        self.text_encoder = self.pipeline.text_encoder
        self.tokenizer = self.pipeline.tokenizer
        self.noise_scheduler = DDPMScheduler.from_config(self.pipeline.scheduler.config)

    def setup_directories(self):
        """Create necessary directories."""
        self.output_dir = Path(self.config["training"]["output_dir"])
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def prepare_dataset(self, image_dir: str, metadata_file: str) -> DataLoader:
        """Prepare dataset and dataloader."""
        dataset = NFTDataset(
            image_dir=image_dir,
            metadata_file=metadata_file,
            tokenizer=self.tokenizer,
            size=self.config["data"]["image_size"]
        )
        
        dataloader = DataLoader(
            dataset,
            batch_size=self.config["training"]["batch_size"],
            shuffle=True,
            num_workers=self.config["training"]["num_workers"]
        )
        
        return dataloader

    def train(self, train_dataloader: DataLoader):
        """Train the model using LoRA."""
        logger.info("Starting training...")
        
        # Prepare optimizer
        optimizer = torch.optim.AdamW(
            self.unet.parameters(),
            lr=self.config["training"]["learning_rate"]
        )
        
        # Prepare for distributed training
        self.unet, optimizer, train_dataloader = self.accelerator.prepare(
            self.unet, optimizer, train_dataloader
        )
        
        # Training loop
        global_step = 0
        for epoch in range(self.config["training"]["num_epochs"]):
            progress_bar = tqdm(total=len(train_dataloader), disable=not self.accelerator.is_local_main_process)
            progress_bar.set_description(f"Epoch {epoch}")
            
            for batch in train_dataloader:
                # Get input tensors
                pixel_values = batch["pixel_values"].to(self.device)
                input_ids = batch["input_ids"].to(self.device)
                
                # Generate noise
                noise = torch.randn_like(pixel_values)
                timesteps = torch.randint(
                    0, self.noise_scheduler.config.num_train_timesteps, 
                    (pixel_values.shape[0],), device=self.device
                )
                noisy_images = self.noise_scheduler.add_noise(pixel_values, noise, timesteps)
                
                # Get text embeddings
                encoder_hidden_states = self.text_encoder(input_ids)[0]
                
                # Predict noise
                noise_pred = self.unet(
                    noisy_images, timesteps, encoder_hidden_states
                ).sample
                
                # Calculate loss
                loss = torch.nn.functional.mse_loss(noise_pred, noise)
                
                # Backward pass
                self.accelerator.backward(loss)
                optimizer.step()
                optimizer.zero_grad()
                
                # Update progress
                progress_bar.update(1)
                global_step += 1
                
                # Save checkpoint
                if global_step % self.config["training"]["save_steps"] == 0:
                    self.save_checkpoint(f"checkpoint-{global_step}")
            
            progress_bar.close()
            
            # Save epoch checkpoint
            self.save_checkpoint(f"checkpoint-epoch-{epoch}")
        
        logger.info("Training completed!")

    def save_checkpoint(self, checkpoint_name: str):
        """Save model checkpoint."""
        if self.accelerator.is_local_main_process:
            checkpoint_dir = self.output_dir / checkpoint_name
            checkpoint_dir.mkdir(parents=True, exist_ok=True)
            
            # Save UNet with LoRA weights
            self.accelerator.unwrap_model(self.unet).save_pretrained(checkpoint_dir)
            logger.info(f"Saved checkpoint: {checkpoint_dir}")

def main():
    # Load configuration
    with open("config/config.yaml", 'r') as f:
        config = yaml.safe_load(f)
    
    # Initialize trainer
    trainer = LoRATrainer(config)
    
    # Prepare dataset
    train_dataloader = trainer.prepare_dataset(
        image_dir="data/processed",
        metadata_file="data/processed/metadata.json"
    )
    
    # Start training
    trainer.train(train_dataloader)

if __name__ == "__main__":
    main()