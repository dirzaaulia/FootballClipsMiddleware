const axios = require('axios');

exports.handler = async function (event, context) {
    const queryParams = event.queryStringParameters || {};
    const currentYear = new Date().getFullYear();

    const apiParams = {};
    apiParams.season = queryParams.season ? parseInt(queryParams.season, 10) : currentYear;

    if (queryParams.limit) apiParams.limit = parseInt(queryParams.limit, 10);
    if (queryParams.offset) apiParams.offset = parseInt(queryParams.offset, 10);
    if (queryParams.leagueId) apiParams.leagueId = queryParams.leagueId;
    if (queryParams.country) apiParams.country = queryParams.country;

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
                'Access-Control-Allow-Origin': '*',
                // 🔥 EDGE CACHE CONTROL:
                // - Cache di browser/app user selama 3 menit (180s)
                // - Cache di Netlify CDN selama 5 menit (300s)
                // - Tampilkan data stale sebentar sambil revalidate di background
                'Cache-Control': 'public, max-age=900, s-maxage=3600, stale-while-revalidate=600'
            },
            body: JSON.stringify(cleanResponse)
        };

    } catch (error) {
        return {
            statusCode: error.response ? error.response.status : 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache' // Jika error, jangan di-cache
            },
            body: JSON.stringify({
                status: "error",
                message: "Gagal mengambil data dari API pusat",
                apiErrorDetails: error.response ? error.response.data : error.message
            })
        };
    }
};