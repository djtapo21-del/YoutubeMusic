/* ============================================
   AlbumCard Component — Clean & Verified
   ============================================ */

let albumTemplatesDoc = null;

/**
 * AlbumCard.html로부터 템플릿 문서 객체를 한 번만 비동기 로드하고 메모리에 캐싱합니다.
 */
async function loadAlbumTemplates() {
  if (albumTemplatesDoc) return albumTemplatesDoc;

  try {
    // 상대 경로로 변경하여 어느 환경에서든 파일을 안전하게 찾도록 수정
    const response = await fetch('components/AlbumCard/AlbumCard.html');
    if (!response.ok) {
      throw new Error('AlbumCard template 파일을 로드하는 데 실패했습니다.');
    }

    const text = await response.text();
    const parser = new DOMParser();
    albumTemplatesDoc = parser.parseFromString(text, 'text/html');
    return albumTemplatesDoc;
  } catch (error) {
    console.error('[loadAlbumTemplates Error]', error);
    throw error;
  }
}

/**
 * 스포티파이 데이터를 기반으로 최신 인기곡 목록 전체를 안전하게 조립(렌더링)합니다.
 * @param {HTMLElement} container - 목록이 삽입될 구역 (#content-section)
 * @param {Array} tracks - Spotify tracks.items 배열 (개별 곡 배열)
 */
export async function renderAlbumList(container, tracks) {
  if (!container || !tracks?.length) return;

  try {
    const doc = await loadAlbumTemplates();
    const listTemplate = doc.getElementById('album-list-template');
    const cardTemplate = doc.getElementById('album-card-template');

    if (!listTemplate || !cardTemplate) {
      throw new Error('필요한 템플릿(List 또는 Card)을 로드하지 못했습니다.');
    }

    const listClone = listTemplate.content.cloneNode(true);
    // getElementById 대신 querySelector를 사용하여 DocumentFragment 내 탐색 호환성 극대화
    const gridContainer = listClone.querySelector('#album-grid');

    if (!gridContainer) {
      throw new Error('앨범 그리드 컨테이너(#album-grid)를 찾을 수 없습니다.');
    }

    // 개별 트랙(곡) 데이터를 바인딩합니다.
    tracks.forEach(track => {
      const cardClone = cardTemplate.content.cloneNode(true);

      const img = cardClone.querySelector('.album-card__image');
      const title = cardClone.querySelector('.album-card__title');
      const artist = cardClone.querySelector('.album-card__artist');

      const albumInfo = track.album || {};
      img.src = albumInfo.images?.[0]?.url || 'assets/icons/icon-music.svg';
      img.alt = track.name;

      title.textContent = track.name;
      artist.textContent = track.artists?.map(a => a.name).join(', ') || '알 수 없음';

      const cardElement = cardClone.querySelector('.album-card');
      if (cardElement) {
        const key = track.external_urls?.spotify || track.id;
        cardElement.setAttribute('data-key', key);
        cardElement.setAttribute('tabindex', '0');
        cardElement.setAttribute('role', 'button');

        const openTrack = () => {
          if (key && key.startsWith('http')) {
            window.open(key, '_blank', 'noopener,noreferrer');
          }
        };

        cardElement.addEventListener('click', openTrack);
        cardElement.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openTrack();
          }
        });
      }

      gridContainer.appendChild(cardClone);
    });

    container.innerHTML = '';
    container.appendChild(listClone);

  } catch (error) {
    console.error('[renderAlbumList Error]', error);
  }
}