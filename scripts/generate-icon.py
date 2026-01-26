#!/usr/bin/env python3
"""Generate BradOS app icon using OpenAI's GPT Image 1.5 API."""

import base64
import os
from datetime import datetime
from openai import OpenAI

# Initialize client (uses OPENAI_API_KEY env var)
client = OpenAI()

PROMPT = """iOS app icon, geometric network of 4 connected nodes arranged in diamond pattern,
abstract representation of integrated wellness system, vibrant gradient coral (#FF6B6B) to
teal (#14B8A6) FILLING THE ENTIRE CANVAS EDGE TO EDGE, modern glassmorphism effect with
light reflections, minimalist tech aesthetic, no text, no border, no margin, no padding,
background gradient must extend to all edges with no white space, 1024x1024"""

def generate_icon(prompt: str = PROMPT, num_images: int = 4) -> list[str]:
    """Generate app icon images and save them to disk.

    Args:
        prompt: The image generation prompt
        num_images: Number of variations to generate (1-10)

    Returns:
        List of saved file paths
    """
    print(f"Generating {num_images} icon variations...")
    print(f"Prompt: {prompt[:100]}...")

    result = client.images.generate(
        model="gpt-image-1.5",
        prompt=prompt,
        n=num_images,
        size="1024x1024",
        quality="high",
        output_format="png",
    )

    # Save directly to Xcode asset catalog
    xcode_icon_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "ios/BradOS/BradOS/Assets.xcassets/AppIcon.appiconset/AppIcon.png"
    )

    # Also save variants to build/icons for reference
    output_dir = os.path.join(os.path.dirname(__file__), "..", "build", "icons")
    os.makedirs(output_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    saved_files = []

    for i, image_data in enumerate(result.data):
        image_bytes = base64.b64decode(image_data.b64_json)

        # First one goes directly to Xcode
        if i == 0:
            with open(xcode_icon_path, "wb") as f:
                f.write(image_bytes)
            print(f"Saved to Xcode: {xcode_icon_path}")

        # All go to build/icons for reference
        filename = f"brados-icon-{timestamp}-{i + 1}.png"
        filepath = os.path.join(output_dir, filename)

        with open(filepath, "wb") as f:
            f.write(image_bytes)

        saved_files.append(filepath)
        print(f"Saved: {filepath}")

    return saved_files


if __name__ == "__main__":
    files = generate_icon()
    print(f"\nGenerated {len(files)} icons. First one installed to Xcode asset catalog.")
