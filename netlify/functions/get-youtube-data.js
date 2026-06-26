// netlify/functions/get-youtube-data.js

const decodeHtmlEntities = (str) => {
    if (!str) return '';
    return str
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'");
};

// 백업용 인기 뮤직비디오 10선에 실제 어울리는 조회수(viewCount) 시뮬레이션 매핑
const FALLBACK_VIDEOS = [
    { id: "T8YELp67XgI", title: "How Sweet", artist: "NewJeans", channel: "HYBE LABELS", desc: "NewJeans 'How Sweet' Official MV", views: "34800000" },
    { id: "2Kff07XM63M", title: "Supernova", artist: "aespa", channel: "SMTOWN", desc: "aespa 'Supernova' Official MV", views: "45100000" },
    { id: "kxsYjS8O7s4", title: "HEYA", artist: "IVE", channel: "STARSHIP", desc: "IVE 'HEYA' Official MV", views: "28900000" },
    { id: "hVAc1v70ZUI", title: "Magnetic", artist: "ILLIT", channel: "HYBE LABELS", desc: "ILLIT 'Magnetic' Official MV", views: "82300000" },
    { id: "Qh9K769mly8", title: "SHEESH", artist: "BABYMONSTER", channel: "YG Entertainment", desc: "BABYMONSTER 'SHEESH' Official MV", views: "142000000" },
    { id: "phuiiNCxRMg", title: "Spot!", artist: "ZICO (feat. JENNIE)", channel: "KOZ Entertainment", desc: "ZICO 'Spot!' Official MV", views: "51200000" },
    { id: "8v_tXwN3E9E", title: "Bubble", artist: "STAYC", channel: "High Up", desc: "STAYC 'Bubble' Official MV", views: "12300000" },
    { id: "dZSosFzYt28", title: "Love Lee", artist: "AKMU", channel: "YG Entertainment", desc: "AKMU 'Love Lee' Official MV", views: "36700000" },
    { id: "A-2GqG_tIe0", title: "ETA", artist: "NewJeans", channel: "HYBE LABELS", desc: "NewJeans 'ETA' Official MV", views: "67800000" },
    { id: "Ovi9ugA2A7k", title: "I AM", artist: "IVE", channel: "STARSHIP", desc: "IVE 'I AM' Official MV", views: "98200000" }
];

const FALLBACK_MUSIC_LIST = [
    ...FALLBACK_VIDEOS,
    { id: "d9IxdwEFk1c", title: "Spicy", artist: "aespa", channel: "SMTOWN", views: "112000000" },
    { id: "YwQnsW4z87U", title: "Queencard", artist: "(G)I-DLE", channel: "Cube Entertainment", views: "290000000" }
];

exports.handler = async (event) => {
    const type = event.queryStringParameters.type || 'music';
    const apiKey = process.env.YOUTUBE_API_KEY;

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };

    const returnFallback = (reason) => {
        console.warn(`[YouTube API Fallback Active] Reason: ${reason}`);

        if (type === 'trending') {
            const mappedTrending = FALLBACK_VIDEOS.map(v => ({
                videoId: v.id,
                title: `${v.artist} - ${v.title} Official MV`,
                channelTitle: v.channel,
                description: v.desc,
                thumbnail: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
                viewCount: v.views // 백업 조회수 전달
            }));
            return { statusCode: 200, headers, body: JSON.stringify(mappedTrending) };
        } else {
            const mappedMusic = FALLBACK_MUSIC_LIST.map(v => ({
                id: v.id,
                title: v.title,
                artist: v.artist,
                thumbnail: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
                url: `https://music.youtube.com/watch?v=${v.id}`,
                viewCount: v.views
            }));
            return { statusCode: 200, headers, body: JSON.stringify(mappedMusic) };
        }
    };

    if (!apiKey) {
        return returnFallback("No API Key configured.");
    }

    try {
        if (type === 'trending') {
            const date = new Date();
            date.setDate(date.getDate() - 30);
            const publishedAfter = date.toISOString();

            // 1단계: 검색 API로 10개의 뮤비 비디오 리스트 우선 확보
            const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=kpop+official+mv&type=video&order=viewCount&publishedAfter=${publishedAfter}&videoEmbeddable=true&key=${apiKey}`;
            const searchRes = await fetch(searchUrl);
            if (!searchRes.ok) throw new Error(`Search API returned ${searchRes.status}`);

            const searchData = await searchRes.json();
            const items = searchData.items || [];
            if (!items.length) throw new Error('No search results');

            const videoIds = items.map(item => item.id?.videoId).filter(Boolean).join(',');

            // 2단계: 확보된 비디오 ID들을 이용해 실시간 조회수(statistics) 조회 (쿼리 절약형 결합 설계)
            const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`;
            const statsRes = await fetch(statsUrl);
            const statsData = statsRes.ok ? await statsRes.json() : { items: [] };

            // 비디오 ID별 조회수 매핑용 맵 생성
            const statsMap = {};
            (statsData.items || []).forEach(v => {
                statsMap[v.id] = v.statistics?.viewCount || '0';
            });

            const videos = items.map(video => {
                const vId = video.id?.videoId;
                return {
                    videoId: vId,
                    title: decodeHtmlEntities(video.snippet?.title),
                    channelTitle: decodeHtmlEntities(video.snippet?.channelTitle),
                    description: decodeHtmlEntities(video.snippet?.description),
                    thumbnail: video.snippet?.thumbnails?.high?.url || `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
                    viewCount: statsMap[vId] || '1200000' // 실시간 조회수 매핑
                };
            });

            return { statusCode: 200, headers, body: JSON.stringify(videos) };

        } else {
            // 차트 영역 데이터 렌더링시에도 조회수(statistics) 포함 요청
            const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=KR&videoCategoryId=10&maxResults=20&key=${apiKey}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Videos API returned ${response.status}`);

            const data = await response.json();
            const items = data.items || [];
            if (!items.length) throw new Error('No chart items');

            const tracks = items.map(video => {
                const snippet = video.snippet || {};
                const rawTitle = decodeHtmlEntities(snippet.title || 'Unknown Title');
                const channelName = decodeHtmlEntities(snippet.channelTitle || 'Unknown Artist');

                let cleanTitle = rawTitle.replace(/\[.*?\]|\(.*?\)|official|mv|video|audio/gi, '').trim();
                cleanTitle = cleanTitle.replace(/\s*-\s*$/, '').trim();
                const cleanArtist = channelName.replace(/ - Topic/gi, '').trim();

                const thumbnails = snippet.thumbnails || {};
                const thumbUrl = thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || '';

                return {
                    id: video.id || 'unknown',
                    title: cleanTitle,
                    artist: cleanArtist,
                    thumbnail: thumbUrl,
                    url: `https://music.youtube.com/watch?v=${video.id || ''}`,
                    viewCount: video.statistics?.viewCount || '0'
                };
            });

            return { statusCode: 200, headers, body: JSON.stringify(tracks) };
        }
    } catch (error) {
        return returnFallback(error.message);
    }
};