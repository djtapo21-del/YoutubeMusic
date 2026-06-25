/* ============================================
   API Module — YouTube Data API
   ============================================ */

/**
 * 유튜브 인기 음악 데이터를 가져옵니다. (Spotify 대체)
 */
export async function getLatestReleases() {
  try {
    const response = await fetch('/.netlify/functions/get-youtube-music');
    if (!response.ok) throw new Error('유튜브 음악 목록 로드 실패');
    return await response.json();
  } catch (error) {
    console.error('[getLatestReleases Error]', error);
    throw error;
  }
}

export async function getTrendingVideo() {
  try {
    const response = await fetch('/.netlify/functions/get-trending-video');
    if (!response.ok) throw new Error('트렌딩 비디오 로드 실패');
    return await response.json();
  } catch (error) {
    console.error('[getTrendingVideo Error]', error);
    throw error;
  }
}