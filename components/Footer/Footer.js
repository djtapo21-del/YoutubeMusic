/* ============================================
   Footer Component (Template 분리 방식)
   ============================================ */

let footerTemplate = null;

/**
 * Footer.html로부터 정적 템플릿을 한 번만 비동기 로드하고 메모리에 캐싱합니다.
 */
async function loadFooterTemplate() {
  if (footerTemplate) return footerTemplate;

  try {
    const response = await fetch('components/Footer/Footer.html');
    if (!response.ok) {
      throw new Error('Footer template 파일을 로드하는 데 실패했습니다.');
    }

    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    footerTemplate = doc.getElementById('footer-template');
    return footerTemplate;
  } catch (error) {
    console.error('[loadFooterTemplate Error]', error);
    throw error;
  }
}

/**
 * 대상을 부모 컨테이너에 안전하게 조립(렌더링)합니다.
 * @param {HTMLElement} container - 푸터가 삽입될 구역 (#footer-section)
 */
export async function renderFooter(container) {
  if (!container) return;

  try {
    const template = await loadFooterTemplate();
    const clone = template.content.cloneNode(true);

    container.innerHTML = ''; // 기존 마크업이 있다면 초기화
    container.appendChild(clone);
  } catch (error) {
    console.error('[renderFooter Error]', error);
  }
}