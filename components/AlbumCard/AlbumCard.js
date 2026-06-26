/* ============================================
   AlbumCard Component (단일 목적 최적화 버전)
   ============================================ */

let albumTemplatesDoc = null;

async function loadAlbumTemplates() {
  if (albumTemplatesDoc) return albumTemplatesDoc;
  const response = await fetch('./components/AlbumCard/AlbumCard.html');
  const text = await response.text();
  albumTemplatesDoc = new DOMParser().parseFromString(text, 'text/html');
  return albumTemplatesDoc;
}

// [스켈레톤 렌더링]
export async function renderAlbumSkeleton(container, count = 6) {
  const doc = await loadAlbumTemplates();
  const listTemplate = doc.getElementById('album-list-template');
  const cardTemplate = doc.getElementById('album-card-template');

  const listClone = listTemplate.content.cloneNode(true);

  const listSection = listClone.querySelector('.album-list');
  if (listSection) {
    listSection.classList.add('is-loading');
  }

  const gridContainer = listClone.querySelector('#album-grid');

  for (let i = 0; i < count; i++) {
    const cardClone = cardTemplate.content.cloneNode(true);
    const cardElement = cardClone.querySelector('.album-card');

    cardElement.classList.add('is-loading');
    gridContainer.appendChild(cardClone);
  }

  container.innerHTML = '';
  container.appendChild(listClone);
}

// [실제 데이터 렌더링] - 인자값 매개변수를 완전히 걷어냈습니다.
export async function renderAlbumList(container, tracks) {
  if (!container || !tracks?.length) return;
  try {
    const doc = await loadAlbumTemplates();
    const listTemplate = doc.getElementById('album-list-template');
    const cardTemplate = doc.getElementById('album-card-template');

    const listClone = listTemplate.content.cloneNode(true);
    const gridContainer = listClone.querySelector('#album-grid');

    tracks.forEach(track => {
      const cardClone = cardTemplate.content.cloneNode(true);
      const img = cardClone.querySelector('.album-card__image');
      const title = cardClone.querySelector('.album-card__title');
      const artist = cardClone.querySelector('.album-card__artist');

      const albumInfo = track.album || {};
      img.src = albumInfo.images?.[0]?.url || '';
      img.alt = track.name;
      title.textContent = track.name;
      artist.textContent = track.artists?.map(a => a.name).join(', ') || '알 수 없음';

      const cardElement = cardClone.querySelector('.album-card');
      if (cardElement) {
        const key = track.external_urls?.spotify || track.id;
        cardElement.setAttribute('data-key', key);
        cardElement.addEventListener('click', () => {
          if (key && key.startsWith('http')) window.open(key, '_blank', 'noopener,noreferrer');
        });
      }

      gridContainer.appendChild(cardClone);
    });

    container.innerHTML = '';
    container.appendChild(listClone);
  } catch (error) {
    console.error(error);
  }
}