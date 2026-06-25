/* ============================================
   HeroBanner Component (Template 분리 방식 - 다중 영상 제어)
   ============================================ */

let heroBannerTemplate = null;
let currentVideos = [];
let currentIndex = 0;
let activeContainer = null;

/**
 * HeroBanner.html로부터 정적 템플릿을 한 번만 비동기 로드하고 메모리에 캐싱합니다.
 */
async function loadHeroBannerTemplate() {
  if (heroBannerTemplate) return heroBannerTemplate;

  try {
    const response = await fetch('components/HeroBanner/HeroBanner.html');
    if (!response.ok) {
      throw new Error('HeroBanner template 파일을 로드하는 데 실패했습니다.');
    }

    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    heroBannerTemplate = doc.getElementById('hero-banner-template');
    return heroBannerTemplate;
  } catch (error) {
    console.error('[loadHeroBannerTemplate Error]', error);
    throw error;
  }
}

/**
 * 유튜브 데이터(배열)를 기반으로 뮤직비디오 배너를 렌더링하고 상태를 제어합니다.
 * @param {HTMLElement} container - 배너가 삽입될 구역 (#hero-banner-section)
 * @param {Array} videos - YouTube video 객체 배열
 * @param {number} startIndex - 렌더링할 타겟 인덱스
 */
export async function renderHeroBanner(container, videos, startIndex = 0) {
  if (!container || !videos?.length) return;

  // 상태값 캐싱
  currentVideos = videos;
  currentIndex = startIndex;
  activeContainer = container;

  try {
    const template = await loadHeroBannerTemplate();
    const clone = template.content.cloneNode(true);

    const video = currentVideos[currentIndex];

    // 데이터가 주입될 DOM 요소 탐색
    const iframe = clone.querySelector('.hero-banner__video');
    const title = clone.querySelector('.hero-banner__title');
    const channel = clone.querySelector('.hero-banner__channel');
    const rank = clone.querySelector('.hero-banner__rank');
    const nextBtn = clone.querySelector('.hero-banner__next-btn');

    // 안전한 데이터 바인딩
    title.textContent = video.title || '알 수 없음';
    channel.textContent = video.channelTitle || '알 수 없음';

    // 순위 바인딩 (예: "1 / 5 위")
    rank.textContent = `${currentIndex + 1} / ${currentVideos.length} 위`;

    // 자동재생(autoplay=1) 및 음소거(mute=1)를 활성화하여 접속 즉시 실행되도록 복구합니다.
    const videoId = video.videoId;
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&loop=1&playlist=${videoId}&modestbranding=1&rel=0`;

    // 다음 버튼 클릭 시 인덱스를 증가시켜 재렌더링 수행
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const nextIndex = (currentIndex + 1) % currentVideos.length;
        renderHeroBanner(activeContainer, currentVideos, nextIndex);
      });
    }

    container.innerHTML = ''; // 기존 마크업 초기화
    container.appendChild(clone);
  } catch (error) {
    console.error('[renderHeroBanner Error]', error);
  }
}