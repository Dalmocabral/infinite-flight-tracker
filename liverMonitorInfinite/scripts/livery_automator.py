import os
import sys
import json
import uuid
import requests
from io import BytesIO
from PIL import Image
from rembg import remove

def download_image(url):
    print(f"Baixando imagem da URL: {url}")
    response = requests.get(url)
    response.raise_for_status()
    return Image.open(BytesIO(response.content))

def process_livery(airplane_image, background_path):
    print("Removendo fundo com IA (rembg)...")
    # Remover o fundo da imagem do avião
    transparent_airplane = remove(airplane_image)

    print(f"Carregando fundo: {background_path}")
    background = Image.open(background_path).convert("RGBA")
    
    # Redimensionar o avião se for maior que o fundo (opcional, ajustando margens)
    bg_width, bg_height = background.size
    air_width, air_height = transparent_airplane.size
    
    # Calcular a posição para colar o avião no centro do fundo
    x = (bg_width - air_width) // 2
    y = (bg_height - air_height) // 2
    
    print("Sobrepondo o avião no fundo estrelado...")
    # Colar o avião por cima do fundo usando a própria transparência como máscara
    background.paste(transparent_airplane, (x, y), transparent_airplane)
    
    return background

def update_json(json_path, livery_name, modelo, image_path):
    print(f"Atualizando arquivo JSON: {json_path}")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Gerar um UUID automático (se não tivermos pego da API do IF)
    # Num futuro, podemos integrar diretamente com a API do IF aqui.
    new_entry = {
        "id": str(uuid.uuid4()),
        "LiveryName": livery_name,
        "modelo": modelo,
        "image": image_path
    }
    
    data.append(new_entry)
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    print("JSON atualizado com sucesso!")

def main():
    if len(sys.argv) < 4:
        print("Uso: python livery_automator.py <URL_DA_IMAGEM> <NOME_DA_LIVERY> <MODELO>")
        print('Exemplo: python livery_automator.py "https://site.com/aviao.jpg" "Azul Conecta" "Cessna 208"')
        sys.exit(1)
        
    image_url = sys.argv[1]
    livery_name = sys.argv[2]
    modelo = sys.argv[3]
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_dir = os.path.join(base_dir, 'public')
    liveries_dir = os.path.join(public_dir, 'liveries')
    
    background_path = os.path.join(public_dir, 'background_liveinfinite.png')
    json_path = os.path.join(base_dir, 'src', 'components', 'ImageAirplane.json')
    
    if not os.path.exists(background_path):
        print(f"ERRO: Fundo não encontrado em {background_path}")
        sys.exit(1)

    try:
        # 1. Baixar a imagem
        airplane_image = download_image(image_url)
        
        # 2. Processar a imagem
        final_image = process_livery(airplane_image, background_path)
        
        # 3. Salvar o resultado
        safe_model = "".join([c for c in modelo if c.isalnum()]).lower()
        safe_livery = "".join([c for c in livery_name if c.isalnum()]).lower()
        filename = f"{safe_model}_{safe_livery}.png"
        
        output_path = os.path.join(liveries_dir, filename)
        final_image.save(output_path, format="PNG")
        print(f"Imagem salva com sucesso em: {output_path}")
        
        # 4. Atualizar o JSON
        relative_image_path = f"/liveries/{filename}"
        update_json(json_path, livery_name, modelo, relative_image_path)
        
        print("\n✅ PROCESSO CONCLUÍDO COM SUCESSO!")
        
    except Exception as e:
        print(f"Ocorreu um erro: {e}")

if __name__ == "__main__":
    main()
