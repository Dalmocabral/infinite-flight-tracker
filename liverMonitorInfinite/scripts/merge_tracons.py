import os
import glob
import json

features = []
for f in glob.glob('public/data/simaware-tracons/Boundaries/**/*.json', recursive=True):
    with open(f, encoding='utf-8') as file:
        try:
            data = json.load(file)
            facility_id = os.path.basename(os.path.dirname(f))
            file_name = os.path.splitext(os.path.basename(f))[0]
            
            # Usually it's just a geojson Feature or FeatureCollection
            if data.get('type') == 'FeatureCollection':
                for feature in data.get('features', []):
                    if not feature.get('properties'):
                        feature['properties'] = {}
                    feature['properties']['id'] = file_name
                    feature['properties']['facility'] = facility_id
                    features.append(feature)
            elif data.get('type') == 'Feature':
                if not data.get('properties'):
                    data['properties'] = {}
                data['properties']['id'] = file_name
                data['properties']['facility'] = facility_id
                features.append(data)
            else:
                # If it's just geometry
                features.append({
                    'type': 'Feature',
                    'geometry': data.get('geometry', data),
                    'properties': {
                        'id': file_name,
                        'facility': facility_id
                    }
                })
        except Exception as e:
            print(f"Error parsing {f}: {e}")

with open('public/data/Tracons.geojson', 'w', encoding='utf-8') as out:
    json.dump({'type': 'FeatureCollection', 'features': features}, out)

print(f"Merged {len(features)} TRACONs with precise file-based IDs")
