import argparse
import yaml
from model.inference import NFTGenerator
from pathlib import Path

def parse_args():
    parser = argparse.ArgumentParser(description="Generate NFT-style images")
    parser.add_argument(
        "--prompt",
        type=str,
        help="Prompt for image generation"
    )
    parser.add_argument(
        "--batch-file",
        type=str,
        help="Path to file containing prompts for batch generation"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="data/generated",
        help="Output directory for generated images"
    )
    parser.add_argument(
        "--num-images",
        type=int,
        default=1,
        help="Number of images to generate per prompt"
    )
    return parser.parse_args()

def main():
    args = parse_args()
    generator = NFTGenerator()
    
    if args.prompt:
        # Single prompt generation
        images = generator.generate_image(
            prompt=args.prompt,
            num_images=args.num_images
        )
        
        # Save images
        output_dir = Path(args.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        for idx, image in enumerate(images):
            image.save(output_dir / f"generated_{idx}.png")
            
    elif args.batch_file:
        # Batch generation from file
        with open(args.batch_file, 'r') as f:
            prompts = [line.strip() for line in f if line.strip()]
            
        generator.batch_generate(
            prompts=prompts,
            output_dir=args.output_dir,
            batch_config={"num_images": args.num_images}
        )
    
    else:
        print("Please provide either a prompt or a batch file")

if __name__ == "__main__":
    main()