import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, 'src', 'components', 'ImageAirplane.json');
const publicDir = path.resolve(__dirname, 'public', 'liveries');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Ler o JSON
const rawData = fs.readFileSync(jsonPath);
const liveries = JSON.parse(rawData);

async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode === 200) {
        res.pipe(fs.createWriteStream(filename))
          .on('error', reject)
          .once('close', () => resolve(filename));
      } else {
        res.resume();
        reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function migrateImages() {
  let updatedCount = 0;
  for (const livery of liveries) {
    if (livery.image && livery.image.startsWith('http')) {
      const extension = path.extname(new URL(livery.image).pathname) || '.png';
      // Limpar nome do arquivo para não dar problema no windows
      const safeLiveryName = (livery.LiveryName || 'unknown').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const safeModelName = (livery.modelo || 'unknown').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${safeModelName}_${safeLiveryName}${extension}`;
      const localPath = path.join(publicDir, filename);

      console.log(`Baixando: ${livery.LiveryName} - ${livery.image}`);
      try {
        await downloadImage(livery.image, localPath);
        livery.image = `/liveries/${filename}`;
        updatedCount++;
      } catch (e) {
        console.error(`Erro ao baixar ${livery.image}:`, e.message);
      }
    }
  }

  if (updatedCount > 0) {
    fs.writeFileSync(jsonPath, JSON.stringify(liveries, null, 4));
    console.log(`\n✅ Sucesso! ${updatedCount} imagens baixadas e atualizadas no JSON.`);
  } else {
    console.log(`\nNenhuma imagem precisou ser baixada (todas já são locais).`);
  }
}

migrateImages();
