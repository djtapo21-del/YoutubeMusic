/* ==========================================================================
   Integrated HeroBanner & Playlist Controller
   ========================================================================== */

let heroBannerDoc = null;

async function loadHeroBannerDoc() {
  if (heroBannerDoc) return heroBannerDoc;
  const response = await fetch('./components/HeroBanner/HeroBanner.html');
  const text = await response.text();
  heroBannerDoc = new DOMParser().parseFromString(text, 'text/html');
  return heroBannerDoc;
}

function formatViewCount(views) {
  if (!views) return '조회수 120만회';
  const count = parseInt(views, 10);
  if (isNaN(count)) return views;
  if (count >= 100000000) {
    return `조회수 ${(count / 100000000).toFixed(1)}억회`;
  }
  if (count >= 10000) {
    return `조회수 ${(count / 1000).toFixed(0) / 10}만회`;
  }
  return `조회수 ${count.toLocaleString()}회`;
}

export async function renderHeroBannerSkeleton(container) {
  const doc = await loadHeroBannerDoc();
  const playerTemplate = doc.getElementById('hero-banner-template');
  const cardTemplate = doc.getElementById('playlist-card-template');

  const playerClone = playerTemplate.content.cloneNode(true);

  playerClone.querySelector('.hero-banner').classList.add('is-loading');
  playerClone.querySelector('.playlist').classList.add('is-loading');

  const gridContainer = playerClone.querySelector('#playlist-grid');

  for (let i = 0; i < 10; i++) {
    const cardClone = cardTemplate.content.cloneNode(true);
    gridContainer.appendChild(cardClone);
  }

  container.innerHTML = '';
  container.appendChild(playerClone);
}

export async function renderHeroBanner(container, videos, startIndex = 0) {
  if (!container || !videos?.length) return;

  try {
    const doc = await loadHeroBannerDoc();
    const playerTemplate = doc.getElementById('hero-banner-template');
    const cardTemplate = doc.getElementById('playlist-card-template');

    const playerClone = playerTemplate.content.cloneNode(true);
    const video = videos[startIndex];

    const iframe = playerClone.querySelector('.hero-banner__video');
    const title = playerClone.querySelector('.hero-banner__title');
    const channel = playerClone.querySelector('.hero-banner__channel');
    const rank = playerClone.querySelector('.hero-banner__rank');

    title.textContent = video.title || '알 수 없음';

    const formattedViews = formatViewCount(video.viewCount);
    channel.textContent = `${video.channelTitle.replace(" - Topic", "")} • ${formattedViews}`;
    rank.textContent = `현재 ${startIndex + 1}위`;

    iframe.src = `https://www.youtube.com/embed/${video.videoId}?autoplay=1&mute=1&controls=1&loop=1&playlist=${video.videoId}&modestbranding=1&rel=0`;

    const gridContainer = playerClone.querySelector('#playlist-grid');
    const prevBtn = playerClone.querySelector('.playlist__nav-btn--prev');
    const nextBtn = playerClone.querySelector('.playlist__nav-btn--next');

    videos.forEach((item, index) => {
      const cardClone = cardTemplate.content.cloneNode(true);
      const img = cardClone.querySelector('.playlist-card__image');
      const cardTitle = cardClone.querySelector('.playlist-card__title');
      const cardArtist = cardClone.querySelector('.playlist-card__artist');

      img.src = item.thumbnail;
      img.alt = item.title;
      cardTitle.textContent = item.title.split(' - ')[1] || item.title;
      cardArtist.textContent = item.channelTitle.replace(" - Topic", "");

      const cardElement = cardClone.querySelector('.playlist-card');
      if (cardElement) {
        if (index === startIndex) {
          cardElement.classList.add('is-active');
        }

        cardElement.addEventListener('click', () => {
          renderHeroBanner(container, videos, index);
          container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }

      gridContainer.appendChild(cardClone);
    });

    // 🚨 이전(Left) 화살표 클릭 핸들러 (왼쪽으로 카드 2개 간격만큼 이동)
    if (prevBtn && gridContainer) {
      prevBtn.addEventListener('click', () => {
        const firstCard = gridContainer.querySelector('.playlist-card');
        if (firstCard) {
          const cardWidth = firstCard.offsetWidth;
          const gap = parseInt(getComputedStyle(gridContainer).gap) || 16;
          const scrollAmount = (cardWidth + gap) * 2;
          gridContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
      });
    }

    // 다음(Right) 화살표 클릭 핸들러
    if (nextBtn && gridContainer) {
      nextBtn.addEventListener('click', () => {
        const firstCard = gridContainer.querySelector('.playlist-card');
        if (firstCard) {
          const cardWidth = firstCard.offsetWidth;
          const gap = parseInt(getComputedStyle(gridContainer).gap) || 16;
          const scrollAmount = (cardWidth + gap) * 2;

          if (gridContainer.scrollLeft + gridContainer.clientWidth >= gridContainer.scrollWidth - 10) {
            gridContainer.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            gridContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
          }
        }
      });
    }

    container.innerHTML = '';
    container.appendChild(playerClone);

  } catch (error) {
    console.error('[renderHeroBanner Error]', error);
  }
}