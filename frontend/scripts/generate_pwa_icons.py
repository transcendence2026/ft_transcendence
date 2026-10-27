#!/usr/bin/env python3
"""
Script de utilidad para ft_transcendence (TasteSync)
---------------------------------------------------
Genera los iconos oficiales requeridos por la especificación PWA (Progressive Web App)
a partir de la imagen corporativa base 'burger.png'.

Tamaños generados en public/:
- pwa-192x192.png: Utilizado en pantallas móviles y menús de aplicaciones.
- pwa-512x512.png: Utilizado en pantallas de bienvenida (splash screen) y accesos de escritorio.

Ejecutar desde frontend:
python3 scripts/generate_pwa_icons.py

"""

import sys
from pathlib import Path
import shutil

def main():
    # Localiza la raíz del frontend respecto a la ubicación del script
    root_dir = Path(__file__).resolve().parent.parent
    source_img = root_dir / "public" / "images" / "burger.png"
    public_dir = root_dir / "public"

    if not source_img.exists():
        print(f"Error: No se encuentra la imagen base en: {source_img}", file=sys.stderr)
        sys.exit(1)

    icon_192 = public_dir / "pwa-192x192.png"
    icon_512 = public_dir / "pwa-512x512.png"

    try:
        from PIL import Image
        img = Image.open(source_img)
        img.resize((192, 192), Image.Resampling.LANCZOS).save(icon_192)
        img.resize((512, 512), Image.Resampling.LANCZOS).save(icon_512)
        print("Iconos PWA redimensionados correctamente con Pillow (192x192 y 512x512).")
    except ImportError:
        # Fallback si en el entorno no está instalada la librería Pillow
        shutil.copy(source_img, icon_192)
        shutil.copy(source_img, icon_512)
        print("Aviso: Pillow no está instalado. Se ha copiado burger.png directamente como fallback.")

    print(f"Archivos listos en: {public_dir}")

if __name__ == "__main__":
    main()