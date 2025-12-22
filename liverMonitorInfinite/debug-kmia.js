import axios from 'axios';

const API_KEY = 'd475ce058e86a1accad6201e331f3c89';
const BASE_URL = 'https://api.core.openaip.net/api/airspaces';

const testSearch = async () => {
    try {
        console.log('--- Debug KMIA (Miami) ---');
        // KMIA: 25.795865, -80.287046
        const response = await axios.get(BASE_URL, {
            params: {
                apiKey: API_KEY,
                pos: '25.795865,-80.287046', 
                dist: 10000, 
                limit: 50 
            }
        });
        
        console.log('Results Found:', response.data.totalItems || response.data.items?.length);
        
        if (response.data.items) {
            response.data.items.forEach(item => {
                console.log(`- [${item.geometry.type}] ${item.name} (Cat: ${item.format || '?'})`);
            });
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
};

testSearch();
