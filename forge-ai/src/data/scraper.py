import os
import time
import requests
from pathlib import Path
from typing import List, Dict
import logging
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
from io import BytesIO
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
import random
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NFTScraper:
    def __init__(self, save_dir: str = "data/raw"):
        self.save_dir = Path(save_dir)
        self.save_dir.mkdir(parents=True, exist_ok=True)
        
        # Setup Chrome options
        chrome_options = Options()
        chrome_options.add_argument('--headless')  # Run in headless mode
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        # Initialize the browser
        self.driver = webdriver.Chrome(options=chrome_options)
        
        # Common headers for requests
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

    def __del__(self):
        """Clean up browser instance"""
        if hasattr(self, 'driver'):
            self.driver.quit()

    def download_image(self, url: str, filename: str) -> bool:
        """Download an image from URL and save it."""
        try:
            # Add random delay to avoid rate limiting
            time.sleep(random.uniform(1, 3))
            
            response = requests.get(url, headers=self.headers, timeout=10)
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
        """Scrape NFTs from OpenSea without API."""
        assets = []
        page = 1
        
        try:
            while len(assets) < limit:
                url = f"https://opensea.io/collection/{collection_slug}?search[sortBy]=LISTING_DATE&search[sortAscending]=false&search[page]={page}"
                self.driver.get(url)
                
                # Wait for the assets to load
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "[role='gridcell']"))
                )
                
                # Let the page fully load
                time.sleep(2)
                
                # Parse the page
                soup = BeautifulSoup(self.driver.page_source, 'html.parser')
                items = soup.find_all("article", {"role": "gridcell"})
                
                if not items:
                    break
                
                for item in items:
                    if len(assets) >= limit:
                        break
                        
                    try:
                        # Extract image URL
                        img_element = item.find("img")
                        if img_element and 'src' in img_element.attrs:
                            image_url = img_element['src']
                            
                            # Extract name and other metadata
                            name_element = item.find("div", {"class": lambda x: x and "AssetCardFooter" in x})
                            name = name_element.get_text() if name_element else "Unknown"
                            
                            assets.append({
                                "name": name,
                                "image_url": image_url,
                                "platform": "opensea"
                            })
                            
                    except Exception as e:
                        logger.error(f"Error parsing item: {str(e)}")
                        continue
                
                page += 1
                time.sleep(random.uniform(2, 4))  # Random delay between pages
                
        except Exception as e:
            logger.error(f"Error scraping OpenSea: {str(e)}")
            
        return assets

    def scrape_magiceden_collection(self, collection_symbol: str, limit: int = 100) -> List[Dict]:
        """Scrape NFTs from Magic Eden without API."""
        nfts = []
        
        try:
            url = f"https://magiceden.io/marketplace/{collection_symbol}"
            self.driver.get(url)
            
            # Wait for the NFTs to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-bs-toggle='modal']"))
            )
            
            # Let the page fully load
            time.sleep(2)
            
            while len(nfts) < limit:
                # Scroll down to load more items
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(2)
                
                # Parse the page
                soup = BeautifulSoup(self.driver.page_source, 'html.parser')
                items = soup.find_all("div", {"data-bs-toggle": "modal"})
                
                for item in items:
                    if len(nfts) >= limit:
                        break
                        
                    try:
                        # Extract image URL
                        img_element = item.find("img")
                        if img_element and 'src' in img_element.attrs:
                            image_url = img_element['src']
                            
                            # Extract name
                            name_element = item.find("span", {"class": "text-white"})
                            name = name_element.get_text() if name_element else "Unknown"
                            
                            nfts.append({
                                "name": name,
                                "image_url": image_url,
                                "platform": "magiceden"
                            })
                            
                    except Exception as e:
                        logger.error(f"Error parsing item: {str(e)}")
                        continue
                
                if len(items) == 0:
                    break
                    
                time.sleep(random.uniform(2, 4))  # Random delay between scrolls
                
        except Exception as e:
            logger.error(f"Error scraping Magic Eden: {str(e)}")
            
        return nfts

    def download_collection_images(self, collection_data: List[Dict]) -> None:
        """Download images from a collection's NFTs."""
        with ThreadPoolExecutor(max_workers=3) as executor:  # Reduced workers to avoid rate limiting
            for idx, item in enumerate(collection_data):
                image_url = item.get("image_url")
                platform = item.get("platform", "unknown")
                filename = f"{platform}_{idx}.png"
                
                if image_url:
                    executor.submit(self.download_image, image_url, filename)

def main():
    scraper = NFTScraper()
    
    # Example usage
    opensea_collections = ["doodles-official", "boredapeyachtclub"]
    magiceden_collections = ["okay_bears", "degods"]
    
    for collection in opensea_collections:
        logger.info(f"Scraping OpenSea collection: {collection}")
        assets = scraper.scrape_opensea_collection(collection)
        scraper.download_collection_images(assets)
        
        # Save metadata
        with open(f"data/raw/opensea_{collection}_metadata.json", 'w') as f:
            json.dump(assets, f)
        
    for collection in magiceden_collections:
        logger.info(f"Scraping Magic Eden collection: {collection}")
        nfts = scraper.scrape_magiceden_collection(collection)
        scraper.download_collection_images(nfts)
        
        # Save metadata
        with open(f"data/raw/magiceden_{collection}_metadata.json", 'w') as f:
            json.dump(nfts, f)

if __name__ == "__main__":
    main()
