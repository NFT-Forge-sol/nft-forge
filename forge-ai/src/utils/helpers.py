import os
from pathlib import Path
import yaml
import logging
from typing import Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_config(config_path: str = "config/config.yaml") -> Dict[str, Any]:
    """Load configuration from yaml file."""
    try:
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
        return config
    except Exception as e:
        logger.error(f"Error loading config: {str(e)}")
        raise

def setup_directories(config: Dict[str, Any]):
    """Create necessary directories."""
    directories = [
        config["data"]["raw_dir"],
        config["data"]["processed_dir"],
        config["training"]["output_dir"],
        config["inference"]["output_dir"]
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)

def setup_logging(log_dir: str = "logs"):
    """Setup logging configuration."""
    log_dir = Path(log_dir)
    log_dir.mkdir(parents=True, exist_ok=True)
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_dir / "app.log"),
            logging.StreamHandler()
        ]
    )

def get_device_info() -> Dict[str, Any]:
    """Get information about available hardware."""
    import torch
    
    return {
        "cuda_available": torch.cuda.is_available(),
        "cuda_device_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
        "cuda_device_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "cuda_capability": torch.cuda.get_device_capability(0) if torch.cuda.is_available() else None
    }