// netlify/functions/get-trending-video.js

/**
 * YouTube API가 반환하는 HTML 엔티티 특수문자들을 디코딩합니다.
 */
function decodeHtmlEntities(str) {
    if (!str) return '';
    return str
        .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
        .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'");
}

/* [추가]: YouTube API 호출이 실패(할당량 초과 등)했을 때 안전하게 가동할 백업 데이터 */
const FALLBACK_VIDEOS = [
    {
        videoId: "T8YELp67XgI",
        title: "NewJeans (뉴진스) 'How Sweet' Official MV",
        channelTitle: "HYBE LABELS",
        description: "NewJeans 'How Sweet' Official Music Video",
        thumbnail: "https://i.ytimg.com/vi/T8YELp67XgI/hqdefault.jpg"
    },
    {
        videoId: "2Kff07XM63M",
        title: "AESPA (에스파) 'Supernova' Official MV",
        channelTitle: "SMTOWN",
        description: "aespa 'Supernova' Official Music Video",
        thumbnail: "https://i.ytimg.com/vi/2Kff07XM63M/hqdefault.jpg"
    },
    {
        videoId: "kxsYjS8O7s4",
        title: "IVE (아이브) 'HEYA' Official MV",
        channelTitle: "STARSHIP",
        description: "IVE 'HEYA' Official Music Video",
        thumbnail: "https://i.ytimg.com/vi/kxsYjS8O7s4/hqdefault.jpg"
    },
    {
        videoId: "hVAc1v70ZUI",
        title: "ILLIT (아일릿) 'Magnetic' Official MV",
        channelTitle: "HYBE LABELS",
        description: "ILLIT 'Magnetic' Official Music Video",
        thumbnail: "https://i.ytimg.com/vi/hVAc1v70ZUI/hqdefault.jpg"
    },
    {
        videoId: "Qh9K769mly8",
        title: "BABYMONSTER (베이비몬스터) 'SHEESH' Official MV",
        channelTitle: "YG Entertainment",
        description: "BABYMONSTER 'SHEESH' Official Music Video",
        thumbnail: "https://i.ytimg.com/vi/Qh9K769mly8/hqdefault.jpg"
    }
];

exports.handler = async function (event, context) {
    const apiKey = process.env.YOUTUBE_API_KEY;

    // API Key가 없어도 에러를 터뜨리지 않고 백업 데이터를 반환하여 로컬 개발 환경 편의성 극대화
    if (!apiKey) {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(FALLBACK_VIDEOS),
        };
    }

    try {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        const publishedAfter = date.toISOString();

        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=kpop+official+mv&type=video&order=viewCount&publishedAfter=${publishedAfter}&videoEmbeddable=true&key=${apiKey}`;

        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`YouTube API Error: ${errorText}`);
        }

        const data = await response.json();
        const items = data.items || [];

        if (!items.length) {
            throw new Error('최근 인기 뮤직비디오를 찾을 수 없습니다.');
        }

        const videos = items.map(video => ({
            videoId: video.id?.videoId,
            title: decodeHtmlEntities(video.snippet?.title),
            channelTitle: decodeHtmlEntities(video.snippet?.channelTitle),
            description: decodeHtmlEntities(video.snippet?.description),
            thumbnail: video.snippet?.thumbnails?.high?.url,
        }));

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(videos),
        };
    } catch (error) {
        console.warn('[YouTube API Error] 백업용 K-pop 인기 비디오 목록을 대체 반환합니다.', error.message);

        // 어떤 에러가 나더라도 무조건 안정적인 200 상태코드와 백업 데이터를 반환하여 사이트 마비 방지
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(FALLBACK_VIDEOS),
        };
    }
};