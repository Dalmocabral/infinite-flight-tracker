import requests
import json
import os
import concurrent.futures

os.makedirs('public/data', exist_ok=True)
print("Fetching TRACON list from GitHub...")
r = requests.get('https://api.github.com/repos/vatsimnetwork/simaware-tracon-project/contents/Boundaries')
files = r.json()

features = []

def fetch_file(f):
    if f['name'].endswith('.geojson'):
        res = requests.get(f['download_url'])
        if res.status_code == 200:
            return res.json()
    return None

print(f"Downloading {len(files)} files...")
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
    results = list(executor.map(fetch_file, files))

for res in results:
    if res:
        features.append(res)

print(f"Combined {len(features)} TRACONs.")
with open('public/data/Tracons.geojson', 'w', encoding='utf-8') as out:
    json.dump({'type': 'FeatureCollection', 'features': features}, out)

print("Done!")
