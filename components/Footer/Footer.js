/* ============================================
   Footer Component (Template 분리 방식)
   ============================================ */

let footerTemplate = null;

async function loadFooterTemplate() {
  if (footerTemplate) return footerTemplate;

  try {
    const response = await fetch('components/Footer/Footer.html');
    if (!response.ok) {
      throw new Error('Footer template 파일을 로드하는 데 실패했습니다.');
    }

    const text = await response.text();
    footerTemplate = new DOMParser().parseFromString(text, 'text/html').getElementById('footer-template');

    return footerTemplate;
  } catch (error) {
    console.error('[loadFooterTemplate Error]', error);
    throw error;
  }
}

export async function renderFooter(container) {
  if (!container) return;

  try {
    const template = await loadFooterTemplate();
    const clone = template.content.cloneNode(true);

    container.innerHTML = '';
    container.appendChild(clone);
  } catch (error) {
    console.error('[renderFooter Error]', error);
  }
}