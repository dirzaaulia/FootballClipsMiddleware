const axios = require('axios');

exports.handler = async function (event, context) {
    const queryParams = event.queryStringParameters || {};
    const currentYear = new Date().getFullYear(); // Otomatis dapat tahun berjalan (2026)

    // Buat query params untuk API pusat
    const apiParams = {};

    // 1. Parameter Wajib Utama: Season (Mengambil tahun berjalan agar dapat data banyak dari berbagai liga)
    apiParams.season = queryParams.season ? parseInt(queryParams.season, 10) : currentYear;

    // 2. Parameter Opsional (jika dikirim dari Android)
    if (queryParams.limit) apiParams.limit = parseInt(queryParams.limit, 10);
    if (queryParams.offset) apiParams.offset = parseInt(queryParams.offset, 10);
    if (queryParams.leagueId) apiParams.leagueId = queryParams.leagueId;
    if (queryParams.country) apiParams.country = queryParams.country;
    if (queryParams.search) apiParams.search = queryParams.search;

    // Key RapidAPI
    const API_KEY = process.env.RAPIDAPI_KEY || '40067061-7935-4022-b2f4-320d7f0260a8';

    try {
        const response = await axios.get('https://soccer.highlightly.net/highlights', {
            headers: {
                'x-rapidapi-key': API_KEY,
                'x-rapidapi-host': 'soccer.highlightly.net',
                'Accept': 'application/json'
            },
            params: apiParams
        });

        const rawData = response.data;

        // Filter data: Hanya ambil item yang type-nya "VERIFIED"
        let verifiedHighlights = [];
        if (rawData && Array.isArray(rawData.data)) {
            verifiedHighlights = rawData.data.filter(item => item.type === 'VERIFIED');
        }

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