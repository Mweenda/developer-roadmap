export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[char]);

export function deepEqual(left, right) {
  if (Object.is(left, right)) return true;
  if (typeof left !== typeof right || left === null || right === null) return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    return left.every((value, index) => deepEqual(value, right[index]));
  }
  if (typeof left !== 'object') return false;
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].every((key) => deepEqual(left[key], right[key]));
}

export function renderBlocks(blocks = []) {
  return blocks.map((block) => {
    if (block.type === 'p') return `<p>${escapeHtml(block.text)}</p>`;
    if (block.type === 'h') return `<h3>${escapeHtml(block.text)}</h3>`;
    if (block.type === 'ul') return `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
    if (block.type === 'note') return `<aside class="callout">${escapeHtml(block.text)}</aside>`;
    if (block.type === 'code') {
      return `<section class="snippet"><div class="snippet-head"><span>${escapeHtml(block.language)}</span><button type="button">Copy</button></div><pre><code>${escapeHtml(block.code)}</code></pre></section>`;
    }
    return '';
  }).join('');
}

export function bindCopies(root) {
  root.querySelectorAll('.snippet').forEach((snippet) => {
    const button = snippet.querySelector('button');
    const code = snippet.querySelector('code')?.textContent ?? '';
    button?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code);
        button.textContent = 'Copied';
      } catch {
        button.textContent = 'Select the code to copy';
      }
    });
  });
}

export function field(name, label, attrs) {
  return `<label class="editor-label" for="${name}">${escapeHtml(label)}</label>
    <input id="${name}" name="${name}" class="editor auth-input" ${attrs}>`;
}
