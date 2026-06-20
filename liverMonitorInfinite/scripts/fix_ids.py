import os
import json
import requests
from fuzzywuzzy import fuzz
from fuzzywuzzy import process

def fetch_if_liveries():
    url = "https://api.infiniteflight.com/public/v2/aircraft/liveries?apikey=36d1c8xdt1zvxn9cqqs9pxr7dty8rhm4"
    print("Buscando lista oficial de liveries da API do Infinite Flight...")
    r = requests.get(url)
    r.raise_for_status()
    return r.json()['result']

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(base_dir, 'src', 'components', 'ImageAirplane.json')
    
    with open(json_path, 'r', encoding='utf-8') as f:
        local_liveries = json.load(f)
        
    api_liveries = fetch_if_liveries()
    
    api_strings = {}
    for item in api_liveries:
        combined = f"{item['aircraftName']} {item['liveryName']}"
        api_strings[combined] = item['id']
        
    api_choices = list(api_strings.keys())
    fixed_count = 0
    
    print(f"Comparando {len(local_liveries)} liveries locais com {len(api_liveries)} da API oficial...")
    
    for local in local_liveries:
        local_combined = f"{local.get('modelo', '')} {local.get('LiveryName', '')}".strip()
        best_match, score = process.extractOne(local_combined, api_choices)
        
        # Limiar flexível porque os nomes dos aviões variam (ex: 777-300ER vs Boeing 777-300ER)
        if score > 70: 
            real_id = api_strings[best_match]
            if local['id'] != real_id:
                local['id'] = real_id
                fixed_count += 1
        else:
            print(f"[!] Aviso: Correspondência fraca para '{local_combined}' (Melhor: '{best_match}' - Score: {score})")
            
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(local_liveries, f, indent=4, ensure_ascii=False)
        
    print(f"\nFinalizado! {fixed_count} IDs foram corrigidos com o UUID oficial do Infinite Flight.")

if __name__ == "__main__":
    main()
