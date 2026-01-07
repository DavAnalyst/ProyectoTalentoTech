from openai import OpenAI
import base64
import os
import requests
from PIL import Image, ImageFilter
import numpy as np
from dotenv import load_dotenv

# Cargar variables de entorno desde archivo .env
load_dotenv("backend/config/.env")

# Configurar OpenAI client solo si se proporciona la API key
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key) if api_key else None

def create_floor_mask(base_image_path):
    """Crear una máscara para identificar el área del piso"""
    base_img = Image.open(base_image_path)
    width, height = base_img.size
    
    # Crear máscara simple para el área del piso (mitad inferior de la imagen)
    mask = Image.new('L', (width, height), 0)
    
    # El piso típicamente ocupa la parte inferior de la imagen
    floor_height = int(height * 0.4)  # 40% inferior es el piso
    
    # Crear gradiente para el piso
    for y in range(height - floor_height, height):
        for x in range(width):
            # Gradiente más suave en los bordes
            alpha = min(255, int(255 * (y - (height - floor_height)) / floor_height))
            mask.putpixel((x, y), alpha)
    
    return mask

def composite_floor_texture(base_image_path, texture_path, output_path):
    """Componer la textura del piso con la imagen base"""
    try:
        # Abrir imágenes
        base_img = Image.open(base_image_path).convert('RGBA')
        texture_img = Image.open(texture_path).convert('RGBA')
        
        # Redimensionar textura al tamaño de la imagen base
        texture_img = texture_img.resize(base_img.size, Image.Resampling.LANCZOS)
        
        # Crear máscara para el área del piso
        floor_mask = create_floor_mask(base_image_path)
        
        # Aplicar perspectiva al piso (simular que está en el suelo)
        width, height = base_img.size
        
        # Crear imagen de piso con perspectiva
        floor_img = texture_img.copy()
        
        # Aplicar la textura solo en el área del piso usando la máscara
        result = Image.composite(floor_img, base_img, floor_mask)
        
        # Guardar resultado
        result = result.convert('RGB')
        result.save(output_path, 'PNG')
        
    except Exception as e:
        raise Exception(f"Error componiendo imagen: {str(e)}")

def generate_image(prompt, output_path, base_image_path=None):
    if not client:
        raise Exception("OpenAI API key no configurada. Por favor configura la variable OPENAI_API_KEY")
    
    try:
        result = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            response_format="url"  # Usar URL en lugar de base64
        )

        if not result.data or not result.data[0].url:
            raise Exception("No se recibió imagen de OpenAI")
            
        image_url = result.data[0].url
        
        # Descargar la imagen desde la URL
        response = requests.get(image_url)
        if response.status_code != 200:
            raise Exception(f"Error descargando imagen: {response.status_code}")

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Guardar textura temporal
        temp_texture_path = output_path.replace('.png', '_temp.png')
        with open(temp_texture_path, "wb") as f:
            f.write(response.content)
        
        # Si hay imagen base, componer con ella
        if base_image_path and os.path.exists(base_image_path):
            composite_floor_texture(base_image_path, temp_texture_path, output_path)
            # Limpiar archivo temporal
            os.remove(temp_texture_path)
        else:
            # Si no hay imagen base, usar solo la textura
            os.rename(temp_texture_path, output_path)
            
    except Exception as e:
        raise Exception(f"Error generando imagen: {str(e)}")

    return output_path
