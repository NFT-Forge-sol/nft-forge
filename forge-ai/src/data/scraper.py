import os
import requests
import time
from pathlib import Path
from typing import List, Dict, Optional
import logging
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
from io import BytesIO

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NFTScraper:
    def __init__(self, save_dir: str = "data/raw"):
        self.save_dir = Path(save_dir)
        self.save_dir.mkdir(parents=True, exist_ok=True)
        
        # API Keys (to be moved to environment variables)
        self.opensea_api_key = os.getenv("OPENSEA_API_KEY")
        self.magiceden_api_key = os.getenv("MAGICEDEN_API_KEY")
        
        # API endpoints
        self.opensea_api = "https://api.opensea.io/api/v1"
        self.magiceden_api = "https://api-mainnet.magiceden.dev/v2"
        
        # Headers
        self.opensea_headers = {
            "Accept": "application/json",
            "X-API-KEY": self.opensea_api_key
        }
        
        self.magiceden_headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {self.magiceden_api_key}"
        }

    def download_image(self, url: str, filename: str) -> bool:
        """Download an image from URL and save it."""
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            # Verify it's an image
            img = Image.open(BytesIO(response.content))
            
            # Save the image
            save_path = self.save_dir / filename
            img.save(save_path)
            return True
            
        except Exception as e:
            logger.error(f"Error downloading {url}: {str(e)}")
            return False

    def scrape_opensea_collection(self, collection_slug: str, limit: int = 100) -> List[Dict]:
        """Scrape NFTs from an OpenSea collection."""
        assets = []
        offset = 0
        
        while len(assets) < limit:
            try:
                url = f"{self.opensea_api}/assets"
                params = {
                    "collection": collection_slug,
                    "limit": min(50, limit - len(assets)),
                    "offset": offset
                }
                
                response = requests.get(
                    url,
                    headers=self.opensea_headers,
                    params=params
                )
                response.raise_for_status()
                
                data = response.json()
                if not data.get("assets"):
                    break
                    
                assets.extend(data["assets"])
                offset += len(data["assets"])
                time.sleep(1)  # Rate limiting
                
            except Exception as e:
                logger.error(f"Error scraping OpenSea: {str(e)}")
                break
                
        return assets

    def scrape_magiceden_collection(self, collection_symbol: str, limit: int = 100) -> List[Dict]:
        """Scrape NFTs from a Magic Eden collection."""
        nfts = []
        offset = 0
        
        while len(nfts) < limit:
            try:
                url = f"{self.magiceden_api}/collections/{collection_symbol}/listings"
                params = {
                    "limit": min(20, limit - len(nfts)),
                    "offset": offset
                }
                
                response = requests.get(
                    url,
                    headers=self.magiceden_headers,
                    params=params
                )
                response.raise_for_status()
                
                data = response.json()
                if not data:
                    break
                    
                nfts.extend(data)
                offset += len(data)
                time.sleep(1)  # Rate limiting
                
            except Exception as e:
                logger.error(f"Error scraping Magic Eden: {str(e)}")
                break
                
        return nfts

    def download_collection_images(self, collection_data: List[Dict], 
                                 platform: str = "opensea") -> None:
        """Download images from a collection's NFTs."""
        with ThreadPoolExecutor(max_workers=5) as executor:
            for item in collection_data:
                if platform == "opensea":
                    image_url = item.get("image_url")
                    token_id = item.get("token_id")
                    filename = f"opensea_{token_id}.png"
                else:
                    image_url = item.get("image")
                    token_id = item.get("tokenMint")
                    filename = f"magiceden_{token_id}.png"
                
                if image_url:
                    executor.submit(self.download_image, image_url, filename)

def main():
    scraper = NFTScraper()
    
    # Example usage
    # Note: Replace with actual collection slugs/symbols
    opensea_collections = ["doodles-official", "boredapeyachtclub"]
    magiceden_collections = ["okay_bears", "degods"]
    
    for collection in opensea_collections:
        logger.info(f"Scraping OpenSea collection: {collection}")
        assets = scraper.scrape_opensea_collection(collection)
        scraper.download_collection_images(assets, "opensea")
        
    for collection in magiceden_collections:
        logger.info(f"Scraping Magic Eden collection: {collection}")
        nfts = scraper.scrape_magiceden_collection(collection)
        scraper.download_collection_images(nfts, "magiceden")

if __name__ == "__main__":
    main()
