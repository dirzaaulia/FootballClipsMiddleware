const axios = require('axios');

exports.handler = async function (event, context) {
    const queryParams = event.queryStringParameters || {};
    const currentYear = new Date().getFullYear();

    // Parameter normalisasi
    const season = queryParams.season ? parseInt(queryParams.season, 10) : currentYear;
    const limit = queryParams.limit ? Math.min(parseInt(queryParams.limit, 10), 40) : 40;
    const offset = queryParams.offset ? parseInt(queryParams.offset, 10) : 0;

    const apiParams = { season, limit, offset };
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

                // 🔥 FIX UTAMA UNTUK NETLIFY EDGE CACHE:
                // 1. Netlify-CDN-Cache-Control: Memaksa CDN Netlify menyimpan respon ini.
                // 2. durable: Menyebarkan data cache ini ke seluruh region Netlify CDN secara global.
                // 3. s-maxage=3600: Menahan cache di Netlify CDN selama 1 Jam (3600 detik).
                // 4. stale-while-revalidate=600: Membalas instan data lama sambil membarui di background.
                'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=3600, stale-while-revalidate=600',

                // Cache lokal di HP/Client App selama 15 menit
                'Cache-Control': 'public, max-age=900, stale-while-revalidate=300',

                // Abaikan perbedaan User-Agent/headers dari HP agar Cache Key selalu sama
                'Netlify-Vary': 'query'
            },
            body: JSON.stringify(cleanResponse)
        };

    } catch (error) {
        return {
            statusCode: error.response ? error.response.status : 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store' // Jangan simpan cache jika terjadi error
            },
            body: JSON.stringify({
                status: "error",
                message: "Gagal mengambil data dari API pusat",
                apiErrorDetails: error.response ? error.response.data : error.message
            })
        };
    }
};