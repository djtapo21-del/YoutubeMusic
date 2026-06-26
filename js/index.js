/* ============================================
   App Entry Point (Clean & Consolidated)
   ============================================ */

import { renderHeader } from '../components/Header/Header.js';
import { renderFooter } from '../components/Footer/Footer.js';
import { renderHeroBanner, renderHeroBannerSkeleton } from '../components/HeroBanner/HeroBanner.js';
import { renderAlbumList, renderAlbumSkeleton } from '../components/AlbumCard/AlbumCard.js';
import { getLatestReleases, getTrendingVideo } from './api.js';

let isLibraryLoaded = false;
let globalTracks = [];

async function initApp() {
  const headerContainer = document.getElementById('header-section');
  const footerContainer = document.getElementById('footer-section');
  const bannerContainer = document.getElementById('hero-banner-section');
  const contentContainer = document.getElementById('content-section');

  try {
    // 1. 헤더와 통합 배너(플레이어 + TOP 10 리스트) 뼈대를 동시 즉시 렌더링
    await Promise.all([
      renderHeader(headerContainer),
      renderHeroBannerSkeleton(bannerContainer),
      renderAlbumSkeleton(contentContainer, 6)
    ]);

    setupTabNavigation();
    renderFooter(footerContainer);

    // 2. 비동기 데이터 로딩
    const [videoData, musicData] = await Promise.all([
      getTrendingVideo(),
      getLatestReleases()
    ]);

    globalTracks = musicData;

    // 3. 통합 배너 및 플레이리스트 렌더링 (클릭 상호작용은 HeroBanner.js 내부에서 자체 완결됨)
    if (videoData && videoData.length > 0) {
      await renderHeroBanner(bannerContainer, videoData, 0);
    }

    // 4. 하단 앨범 리스트 데이터 처리
    const homeTracks = globalTracks.slice(0, 6).map(track => ({
      name: track.title,
      artists: [{ name: track.artist }],
      album: { images: [{ url: track.thumbnail }] },
      external_urls: { spotify: track.url }
    }));

    await renderAlbumList(contentContainer, homeTracks);

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
    const libraryTracks = globalTracks.slice(6, 16).map(track => ({
      name: track.title,
      artists: [{ name: track.artist }],
      album: { images: [{ url: track.thumbnail }] },
      external_urls: { spotify: track.url }
    }));

    renderAlbumList(libraryContainer, libraryTracks);
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