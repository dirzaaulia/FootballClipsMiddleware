const axios = require('axios');

exports.handler = async function (event, context) {
    // Ambil query parameter dari request Android jika ada (misal: ?limit=20&offset=0)
    const limit = event.queryStringParameters.limit || '20';
    const offset = event.queryStringParameters.offset || '0';

    // API Key kamu dari RapidAPI (Disimpan dengan aman di serverless)
    const API_KEY = process.env.RAPIDAPI_KEY || '40067061-7935-4022-b2f4-320d7f0260a8';

    try {
        // 1. Tembak API Highlightly
        const response = await axios.get('https://soccer.highlightly.net/highlights', {
            headers: {
                'x-rapidapi-key': API_KEY,
                'x-rapidapi-host': 'soccer.highlightly.net'
            },
            params: {
                limit: limit,
                offset: offset
            }
        });

        const rawData = response.data;

        // 2. Filter data: Hanya ambil item yang type-nya "VERIFIED"
        let verifiedHighlights = [];
        if (rawData && Array.isArray(rawData.data)) {
            verifiedHighlights = rawData.data.filter(item => item.type === 'VERIFIED');
        }

        // 3. Susun ulang response JSON untuk dikirim ke Android
        const cleanResponse = {
            status: "success",
            totalVerified: verifiedHighlights.length,
            pagination: rawData.pagination || {},
            data: verifiedHighlights // Sudah bersih, HANYA VERIFIED
        };

        // 4. Return respon ke Android dengan status 200 OK & Header CORS
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' // Biar bisa diakses dari mana saja
            },
            body: JSON.stringify(cleanResponse)
        };

    } catch (error) {
        console.error('Error fetching data:', error.message);

        return {
            statusCode: error.response ? error.response.status : 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                status: "error",
                message: "Gagal mengambil data dari API pusat",
                error: error.message
            })
        };
    }
};