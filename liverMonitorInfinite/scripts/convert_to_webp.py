import os
import glob
from PIL import Image
import json
from tqdm import tqdm

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    liveries_dir = os.path.join(base_dir, 'public', 'liveries')
    json_path = os.path.join(base_dir, 'src', 'components', 'ImageAirplane.json')
    
    # 1. Converter imagens
    png_files = glob.glob(os.path.join(liveries_dir, '*.png'))
    print(f"Encontradas {len(png_files)} imagens PNG para converter.")
    
    converted_count = 0
    for png_path in tqdm(png_files, desc="Convertendo para WEBP"):
        webp_path = os.path.splitext(png_path)[0] + '.webp'
        
        try:
            with Image.open(png_path) as img:
                # O formato webp suporta RGBA nativamente
                img.save(webp_path, 'WEBP', quality=85)
            
            # Remove o original PNG
            os.remove(png_path)
            converted_count += 1
        except Exception as e:
            print(f"Erro ao converter {png_path}: {e}")
            
    print(f"\n{converted_count} imagens convertidas com sucesso!")
    
    # 2. Atualizar o JSON
    print("Atualizando ImageAirplane.json...")
    with open(json_path, 'r', encoding='utf-8') as f:
        liveries_data = json.load(f)
        
    for item in liveries_data:
        if 'image' in item and item['image'].endswith('.png'):
            item['image'] = item['image'].replace('.png', '.webp')
            
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(liveries_data, f, indent=4, ensure_ascii=False)
        
    print("Concluído!")

if __name__ == "__main__":
    main()
