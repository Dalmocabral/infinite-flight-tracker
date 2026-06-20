import os
import sys
import json
import requests
from bs4 import BeautifulSoup
import uuid
from tqdm import tqdm  # Importando biblioteca de barra de progresso

# Importar o nosso script criado anteriormente
from livery_automator import download_image, process_livery

def load_existing_liveries(json_path):
    if not os.path.exists(json_path):
        return []
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def is_livery_processed(existing_data, modelo, livery_name):
    # Verifica se já temos essa combinação salva no JSON
    for entry in existing_data:
        if entry.get("modelo") == modelo and entry.get("LiveryName") == livery_name:
            return True
    return False

def save_json(json_path, data):
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

def main():
    test_mode = "--test" in sys.argv
    print(f"Modo Teste: {'Ativado' if test_mode else 'Desativado'}")

    url = "https://www.helpathand.nl/janpolet/infinite-flight-aircraft-liveries/"
    print(f"Acessando {url} ...")
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Encontrar todas as linhas da tabela
    rows = soup.find_all('tr', class_=lambda x: x and x.startswith('row-'))
    total_rows = len(rows)
    print(f"Encontrados {total_rows} aviões listados na tabela!")
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_dir = os.path.join(base_dir, 'public')
    liveries_dir = os.path.join(public_dir, 'liveries')
    background_path = os.path.join(public_dir, 'background_liveinfinite.png')
    json_path = os.path.join(base_dir, 'src', 'components', 'ImageAirplane.json')
    
    existing_data = load_existing_liveries(json_path)
    
    processed_count = 0
    skipped_count = 0
    error_count = 0

    # Usando tqdm para criar uma barra de progresso visual
    with tqdm(total=total_rows, desc="Progresso Geral", unit="avião") as pbar:
        for row in rows:
            try:
                # Extrair as colunas
                cols = row.find_all('td')
                if len(cols) < 9:
                    pbar.update(1)
                    continue
                    
                modelo = cols[2].get_text(strip=True)
                livery_name = cols[3].get_text(strip=True)
                
                # Algumas liveries tem detalhes extras na coluna 5
                extra_details = cols[4].get_text(strip=True)
                if extra_details:
                    livery_name = f"{livery_name} ({extra_details})"
                
                a_tag = cols[8].find('a')
                if not a_tag or not a_tag.get('href'):
                    pbar.update(1)
                    continue
                    
                image_url = a_tag['href']
                
                if is_livery_processed(existing_data, modelo, livery_name):
                    skipped_count += 1
                    pbar.update(1)
                    continue
                    
                # Atualizar a descrição da barra de progresso para mostrar o que está processando
                pbar.set_description(f"Processando: {modelo[:10]} - {livery_name[:15]}")
                
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
                
                # 4. Adicionar ao JSON na memória
                relative_image_path = f"/liveries/{filename}"
                existing_data.append({
                    "id": str(uuid.uuid4()),
                    "LiveryName": livery_name,
                    "modelo": modelo,
                    "image": relative_image_path
                })
                
                # Salva o JSON a cada novo avião processado
                save_json(json_path, existing_data)
                processed_count += 1
                
                pbar.update(1)
                
                if test_mode and processed_count >= 5:
                    print("\n[MODO TESTE] Processou 5 aeronaves e parou.")
                    break
                    
            except Exception as e:
                error_count += 1
                pbar.update(1)

    print("\n--- RESUMO FINAL ---")
    print(f"Aviões Processados e Adicionados: {processed_count}")
    print(f"Aviões Pulados (já existiam): {skipped_count}")
    print(f"Erros: {error_count}")

if __name__ == "__main__":
    main()
