import axios from 'axios';

const url = 'https://raw.githubusercontent.com/vatsimnetwork/vatspy-data-project/refs/heads/master/Boundaries.geojson';

async function check() {
    try {
        console.log("Fetching GeoJSON...");
        const response = await axios.get(url);
        const features = response.data.features;
        
        const ids = features.map(f => f.properties.id);
        
        console.log("Total features:", ids.length);
        
        const eddf = ids.filter(id => id.includes('EDDF'));
        const othh = ids.filter(id => id.includes('OTHH'));
        const edgg = ids.filter(id => id.includes('EDGG')); // Frankfurt FIR
        
        console.log("EDDF matches:", eddf);
        console.log("OTHH matches:", othh);
        console.log("EDGG (Frankfurt FIR) matches:", edgg);
        
        const edStart = ids.filter(id => id.startsWith('ED'));
        console.log("Starts with ED (samples):", edStart.slice(0, 10));

    } catch (e) {
        console.error(e);
    }
}

check();
