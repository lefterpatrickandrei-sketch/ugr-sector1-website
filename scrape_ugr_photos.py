import os
import urllib.request
import re
from urllib.parse import urljoin
from PIL import Image

def get_page_html(url):
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return ""

def main():
    base_url = "https://www.ugr.ro/"
    pages = [
        "", 
        "despre-noi", 
        "despre-noi/istoric", 
        "evenimente", 
        "stiri", 
        "stiri/saptamana-geodeziei-romanesti-editia-a-saptea-start-inscrieri",
        "contact"
    ]
    
    img_urls = set()
    
    # 1. Scrape specified pages for images
    for page in pages:
        full_url = urljoin(base_url, page)
        print(f"Scraping {full_url}...")
        html = get_page_html(full_url)
        if not html:
            continue
            
        # Find all img src attributes
        srcs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html)
        for src in srcs:
            if "logo" in src.lower() or "icon" in src.lower():
                continue
            abs_url = urljoin(full_url, src)
            img_urls.add(abs_url)
            
        # Background styles or anchor links
        bg_urls = re.findall(r'url\(["\']?([^"\')]+)["\']?\)', html)
        for bg in bg_urls:
            if "logo" in bg.lower() or "icon" in bg.lower():
                continue
            abs_url = urljoin(full_url, bg)
            img_urls.add(abs_url)
            
    print(f"Found {len(img_urls)} unique image URLs to inspect.")
    
    # Ensure folder exists
    out_dir = "ugr-images"
    os.makedirs(out_dir, exist_ok=True)
    
    downloaded_count = 0
    
    # 2. Download and filter
    for url in img_urls:
        filename = os.path.basename(url.split('?')[0])
        if not filename or not (filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))):
            continue
            
        local_path = os.path.join(out_dir, filename)
        
        try:
            print(f"Downloading {url}...")
            req = urllib.request.Request(
                url, 
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                content = response.read()
                
            temp_path = local_path + ".tmp"
            with open(temp_path, "wb") as f:
                f.write(content)
                
            with Image.open(temp_path) as img:
                width, height = img.size
                
            if width >= 800:
                os.replace(temp_path, local_path)
                print(f"  Saved: {filename} ({width}x{height})")
                downloaded_count += 1
            else:
                os.remove(temp_path)
                print(f"  Skipped (too small): {filename} ({width}x{height})")
        except Exception as e:
            if os.path.exists(local_path + ".tmp"):
                os.remove(local_path + ".tmp")
            print(f"  Failed {url}: {e}")
            
    print(f"Done! Downloaded {downloaded_count} high-res images.")

if __name__ == "__main__":
    main()
