/* ============================================
   App Entry Point (YouTube API Mode)
   ============================================ */

console.log("YouTube Music 앱이 시작되었습니다!");

import { renderHeader } from '../components/Header/Header.js';
import { renderFooter } from '../components/Footer/Footer.js';
import { renderHeroBanner } from '../components/HeroBanner/HeroBanner.js';
import { renderAlbumList } from '../components/AlbumCard/AlbumCard.js';
import { getLatestReleases, getTrendingVideo } from './api.js';

let isLibraryLoaded = false;
let globalTracks = []; // 전체 20곡 캐싱용

async function initApp() {
  const headerContainer = document.getElementById('header-section');
  const footerContainer = document.getElementById('footer-section');
  const bannerContainer = document.getElementById('hero-banner-section');
  const contentContainer = document.getElementById('content-section');

  try {
    await Promise.all([
      renderHeader(headerContainer),
      renderFooter(footerContainer)
    ]);

    setupTabNavigation();

    // 유튜브 비디오 배너와 유튜브 인기 음악 20곡을 가져옵니다.
    const [videoData, musicData] = await Promise.all([
      getTrendingVideo(),
      getLatestReleases()
    ]);

    globalTracks = musicData; // 라이브러리 화면을 위해 데이터 저장

    if (videoData && videoData.length > 0) {
      await renderHeroBanner(bannerContainer, videoData);
    }

    // 홈 화면에는 1~6위 곡을 포맷팅하여 전달
    const homeTracks = globalTracks.slice(0, 6).map(track => ({
      name: track.title,
      artists: [{ name: track.artist }],
      album: { images: [{ url: track.thumbnail }] },
      external_urls: { spotify: track.url } // 변수명은 유지하되 실제론 유튜브 URL이 들어감
    }));

    await renderAlbumList(contentContainer, homeTracks);

    const homeTitle = contentContainer.querySelector('.album-list__title');
    if (homeTitle) homeTitle.textContent = "국내 인기 급상승 음악";

  } catch (error) {
    console.error('[initApp Error]', error);
    if (bannerContainer) bannerContainer.innerHTML = '';
    showError(contentContainer, '데이터 로드 실패');
  }
}

function setupTabNavigation() {
  const navLinks = document.querySelectorAll('.header__nav-link');
  const homeView = document.getElementById('home-view');
  const libraryView = document.getElementById('library-view');

  navLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();

      const targetId = link.getAttribute('data-target');

      if (targetId === 'search-view') {
        alert('검색 기능은 개발 진행 예정입니다.');
        return;
      }

      navLinks.forEach(nav => nav.classList.remove('header__nav-link--active'));
      link.classList.add('header__nav-link--active');

      if (homeView) homeView.classList.add('is-hidden');
      if (libraryView) libraryView.classList.add('is-hidden');

      if (targetId === 'home-view' && homeView) {
        homeView.classList.remove('is-hidden');
      } else if (targetId === 'library-view' && libraryView) {
        libraryView.classList.remove('is-hidden');

        if (!isLibraryLoaded) {
          loadLibraryData();
        }
      }
    });
  });
}

function loadLibraryData() {
  const libraryContainer = document.getElementById('library-content-section');
  try {
    // 라이브러리 화면에는 중복을 피하기 위해 7~16위 곡(10곡)을 전달
    const libraryTracks = globalTracks.slice(6, 16).map(track => ({
      name: track.title,
      artists: [{ name: track.artist }],
      album: { images: [{ url: track.thumbnail }] },
      external_urls: { spotify: track.url }
    }));

    renderAlbumList(libraryContainer, libraryTracks);

    const libraryTitle = libraryContainer.querySelector('.album-list__title');
    if (libraryTitle) libraryTitle.textContent = "내 보관함 추천 곡";

    isLibraryLoaded = true;
  } catch (error) {
    showError(libraryContainer, '보관함을 불러오지 못했습니다.');
  }
}

function showError(container, message) {
  if (!container) return;
  container.innerHTML = `
    <div class="error" role="alert">
      <p class="error__message">오류가 발생했습니다.</p>
      <p class="error__sub-message">${message}</p>
      <button class="error__retry-btn" onclick="location.reload()">다시 시도</button>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', initApp);