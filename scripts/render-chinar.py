"""Rebuild the original chinar silhouette (Pillow is only needed to rebuild it)."""
from pathlib import Path
from PIL import Image, ImageDraw

points = [(12,1),(14,7),(17,5),(16,11),(22,8),(21,13),(24,14),(16,19),(13,18),(13,23),(11,23),(11,18),(8,19),(0,14),(3,13),(2,8),(8,11),(7,5),(10,7)]
image = Image.new("RGBA", (384,384))
ImageDraw.Draw(image).polygon([(x*16,y*16) for x,y in points], fill=(255,255,255,255))
image.resize((96,96), Image.Resampling.LANCZOS).save(Path(__file__).resolve().parents[1]/"assets/season-icons/chinar.png")
