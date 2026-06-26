/* ============================================
   API Module — Consolidated YouTube Data
   ============================================ */

/**
 * 유튜브 국내 인기 음악 목록을 가져옵니다.
 */
export const getLatestReleases = async () => {
  try {
    const response = await fetch('/.netlify/functions/get-youtube-data?type=music');
    if (!response.ok) throw new Error('인기 음악 데이터 요청 실패');
    return await response.json();
  } catch (error) {
    console.error('[getLatestReleases Error]', error);
    throw error;
  }
};

/**
 * 배너용 최근 트렌딩 비디오 목록을 가져옵니다.
 */
export const getTrendingVideo = async () => {
  try {
    const response = await fetch('/.netlify/functions/get-youtube-data?type=trending');
    if (!response.ok) throw new Error('트렌딩 비디오 데이터 요청 실패');
    return await response.json();
  } catch (error) {
    console.error('[getTrendingVideo Error]', error);
    throw error;
  }
};