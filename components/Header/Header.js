/* ============================================
   Header Component (Template 분리 방식)
   ============================================ */

let headerTemplate = null;

/**
 * Header.html로부터 정적 템플릿을 한 번만 비동기 로드하고 메모리에 캐싱합니다.
 */
async function loadHeaderTemplate() {
  if (headerTemplate) return headerTemplate;

  try {
    const response = await fetch('components/Header/Header.html');
    if (!response.ok) {
      throw new Error('Header template 파일을 로드하는 데 실패했습니다.');
    }

    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    headerTemplate = doc.getElementById('header-template');
    return headerTemplate;
  } catch (error) {
    console.error('[loadHeaderTemplate Error]', error);
    throw error;
  }
}

/**
 * 대상을 부모 컨테이너에 안전하게 조립(렌더링)합니다.
 * @param {HTMLElement} container - 헤더가 삽입될 구역 (#header-section)
 */
export async function renderHeader(container) {
  if (!container) return;

  try {
    const template = await loadHeaderTemplate();
    const clone = template.content.cloneNode(true);

    container.innerHTML = ''; // 기존 마크업이 있다면 초기화
    container.appendChild(clone);
  } catch (error) {
    console.error('[renderHeader Error]', error);
  }
}