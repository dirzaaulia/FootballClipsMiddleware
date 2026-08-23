const axios = require('axios');

exports.handler = async function (event, context) {
    // 1. Pastikan limit & offset di-parse menjadi Angka (Number/Integer)
    const limitParam = event.queryStringParameters && event.queryStringParameters.limit
        ? parseInt(event.queryStringParameters.limit, 10)
        : 20;

    const offsetParam = event.queryStringParameters && event.queryStringParameters.offset
        ? parseInt(event.queryStringParameters.offset, 10)
        : 0;

    // API Key RapidAPI milikmu
    const API_KEY = process.env.RAPIDAPI_KEY || '40067061-7935-4022-b2f4-320d7f0260a8';

    try {
        // 2. Tembak API pusat dengan parameter dan header yang valid
        const response = await axios.get('https://soccer.highlightly.net/highlights', {
            headers: {
                'x-rapidapi-key': API_KEY,
                'x-rapidapi-host': 'soccer.highlightly.net',
                'Accept': 'application/json'
            },
            params: {
                limit: limitParam,
                offset: offsetParam
            }
        });

        const rawData = response.data;

        // 3. Filter data: Hanya ambil item yang type-nya "VERIFIED"
        let verifiedHighlights = [];
        if (rawData && Array.isArray(rawData.data)) {
            verifiedHighlights = rawData.data.filter(item => item.type === 'VERIFIED');
        }

        // 4. Susun response JSON bersih untuk Android
        const cleanResponse = {
            status: "success",
            totalVerified: verifiedHighlights.length,
            pagination: rawData.pagination || {},
            data: verifiedHighlights
        };

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(cleanResponse)
        };

    } catch (error) {
        console.error('RapidAPI Error Details:', error.response ? error.response.data : error.message);

        // Kirim pesan error yang lebih detail agar gampang di-debug
        return {
            statusCode: error.response ? error.response.status : 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                status: "error",
                message: "Gagal mengambil data dari API pusat",
                statusCode: error.response ? error.response.status : 500,
                apiErrorDetails: error.response ? error.response.data : error.message
            })
        };
    }
};