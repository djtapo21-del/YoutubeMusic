// netlify/functions/get-youtube-music.js
const https = require('https');

// HTML 특수문자 디코딩
function decodeHtmlEntities(str) {
    if (!str) return '';
    return str.replace(/&#(\d+);/g, function (match, dec) { return String.fromCharCode(parseInt(dec, 10)); })
        .replace(/&#x([0-9a-f]+);/gi, function (match, hex) { return String.fromCharCode(parseInt(hex, 16)); })
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

// 백업용 K-pop 데이터
const FALLBACK_TRACKS = [
    { id: "T8YELp67XgI", title: "How Sweet", artist: "NewJeans", thumbnail: "https://i.ytimg.com/vi/T8YELp67XgI/hqdefault.jpg", url: "https://music.youtube.com/watch?v=T8YELp67XgI" },
    { id: "2Kff07XM63M", title: "Supernova", artist: "aespa", thumbnail: "https://i.ytimg.com/vi/2Kff07XM63M/hqdefault.jpg", url: "https://music.youtube.com/watch?v=2Kff07XM63M" },
    { id: "kxsYjS8O7s4", title: "HEYA", artist: "IVE", thumbnail: "https://i.ytimg.com/vi/kxsYjS8O7s4/hqdefault.jpg", url: "https://music.youtube.com/watch?v=kxsYjS8O7s4" },
    { id: "hVAc1v70ZUI", title: "Magnetic", artist: "ILLIT", thumbnail: "https://i.ytimg.com/vi/hVAc1v70ZUI/hqdefault.jpg", url: "https://music.youtube.com/watch?v=hVAc1v70ZUI" },
    { id: "Qh9K769mly8", title: "SHEESH", artist: "BABYMONSTER", thumbnail: "https://i.ytimg.com/vi/Qh9K769mly8/hqdefault.jpg", url: "https://music.youtube.com/watch?v=Qh9K769mly8" },
    { id: "phuiiNCxRMg", title: "Spot!", artist: "ZICO (feat. JENNIE)", thumbnail: "https://i.ytimg.com/vi/phuiiNCxRMg/hqdefault.jpg", url: "https://music.youtube.com/watch?v=phuiiNCxRMg" },
    { id: "8v_tXwN3E9E", title: "Bubble", artist: "STAYC", thumbnail: "https://i.ytimg.com/vi/8v_tXwN3E9E/hqdefault.jpg", url: "https://music.youtube.com/watch?v=8v_tXwN3E9E" },
    { id: "dZSosFzYt28", title: "Love Lee", artist: "AKMU", thumbnail: "https://i.ytimg.com/vi/dZSosFzYt28/hqdefault.jpg", url: "https://music.youtube.com/watch?v=dZSosFzYt28" },
    { id: "A-2GqG_tIe0", title: "ETA", artist: "NewJeans", thumbnail: "https://i.ytimg.com/vi/A-2GqG_tIe0/hqdefault.jpg", url: "https://music.youtube.com/watch?v=A-2GqG_tIe0" },
    { id: "Ovi9ugA2A7k", title: "I AM", artist: "IVE", thumbnail: "https://i.ytimg.com/vi/Ovi9ugA2A7k/hqdefault.jpg", url: "https://music.youtube.com/watch?v=Ovi9ugA2A7k" },
    { id: "d9IxdwEFk1c", title: "Spicy", artist: "aespa", thumbnail: "https://i.ytimg.com/vi/d9IxdwEFk1c/hqdefault.jpg", url: "https://music.youtube.com/watch?v=d9IxdwEFk1c" },
    { id: "YwQnsW4z87U", title: "Queencard", artist: "(G)I-DLE", thumbnail: "https://i.ytimg.com/vi/YwQnsW4z87U/hqdefault.jpg", url: "https://music.youtube.com/watch?v=YwQnsW4z87U" },
    { id: "pyf8cbAwCGU", title: "UNFORGIVEN", artist: "LE SSERAFIM", thumbnail: "https://i.ytimg.com/vi/pyf8cbAwCGU/hqdefault.jpg", url: "https://music.youtube.com/watch?v=pyf8cbAwCGU" },
    { id: "pSUydWEqKwE", title: "Ditto", artist: "NewJeans", thumbnail: "https://i.ytimg.com/vi/pSUydWEqKwE/hqdefault.jpg", url: "https://music.youtube.com/watch?v=pSUydWEqKwE" },
    { id: "H8B4y71bE24", title: "Hype Boy", artist: "NewJeans", thumbnail: "https://i.ytimg.com/vi/H8B4y71bE24/hqdefault.jpg", url: "https://music.youtube.com/watch?v=H8B4y71bE24" },
    { id: "F0B7HDiY-10", title: "Kitsch", artist: "IVE", thumbnail: "https://i.ytimg.com/vi/F0B7HDiY-10/hqdefault.jpg", url: "https://music.youtube.com/watch?v=F0B7HDiY-10" }
];

// fetch 모듈 대체용 HTTPS 통신
function fetchJson(url) {
    return new Promise(function (resolve, reject) {
        https.get(url, function (res) {
            let body = '';
            res.on('data', function (chunk) { body += chunk; });
            res.on('end', function () {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try { resolve(JSON.parse(body)); }
                    catch (e) { reject(new Error('JSON Parsing Failed')); }
                } else {
                    reject(new Error('HTTP Error: ' + res.statusCode));
                }
            });
        }).on('error', reject);
    });
}

exports.handler = async function (event, context) {
    // 에러 발생 시 무조건 백업 데이터 반환 (200 상태코드 보장)
    function returnFallback(reason) {
        console.log("[Fallback Triggered] " + reason);
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(FALLBACK_TRACKS)
        };
    }

    try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) return returnFallback("No API Key");

        const url = "https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=KR&videoCategoryId=10&maxResults=20&key=" + apiKey;
        const data = await fetchJson(url);

        if (!data || !data.items || data.items.length === 0) {
            return returnFallback("No YouTube Data Found");
        }

        // ES6+ 문법(?. 등)을 배제한 안전한 데이터 매핑
        const tracks = data.items.map(function (video) {
            const snippet = video.snippet || {};
            const rawTitle = decodeHtmlEntities(snippet.title || 'Unknown Title');
            const channelName = decodeHtmlEntities(snippet.channelTitle || 'Unknown Artist');

            let cleanTitle = rawTitle.replace(/\[.*?\]|\(.*?\)|official|mv|video|audio/gi, '').trim();
            cleanTitle = cleanTitle.replace(/\s*-\s*$/, '').trim();
            let cleanArtist = channelName.replace(/ - Topic/gi, '').trim();

            const thumbnails = snippet.thumbnails || {};
            let thumbUrl = '';
            if (thumbnails.high && thumbnails.high.url) thumbUrl = thumbnails.high.url;
            else if (thumbnails.medium && thumbnails.medium.url) thumbUrl = thumbnails.medium.url;
            else if (thumbnails.default && thumbnails.default.url) thumbUrl = thumbnails.default.url;

            return {
                id: video.id || 'unknown',
                title: cleanTitle,
                artist: cleanArtist,
                thumbnail: thumbUrl,
                url: "https://music.youtube.com/watch?v=" + (video.id || '')
            };
        });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(tracks)
        };

    } catch (error) {
        // 모든 에러를 캐치해서 백업 데이터를 반환하므로 500 에러는 발생하지 않습니다.
        return returnFallback(error.message);
    }
};