// Development check: finds text that is cut off on the current screen.
//
// For every element that holds text it measures the letters, grows that box by
// half the outline width (outlines paint outside the letter box), and tests it
// against every ancestor that clips. It also reports text shortened with an
// ellipsis, which is allowed for long song names but worth seeing.
//
// Run `await __auditText()` in the console on any screen.

const clips = style => ['hidden', 'clip', 'auto', 'scroll'].some(v => style.overflowX === v || style.overflowY === v);

function inner(element) {
  const box = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  const scaleX = element.offsetWidth ? box.width / element.offsetWidth : 1;
  const scaleY = element.offsetHeight ? box.height / element.offsetHeight : 1;
  return {
    left: box.left + parseFloat(style.borderLeftWidth) * scaleX,
    top: box.top + parseFloat(style.borderTopWidth) * scaleY,
    right: box.right - parseFloat(style.borderRightWidth) * scaleX,
    bottom: box.bottom - parseFloat(style.borderBottomWidth) * scaleY,
  };
}

export function auditText(root = document.body) {
  const stage = document.querySelector('.stage');
  const scale = stage ? stage.getBoundingClientRect().width / stage.offsetWidth : 1;
  const findings = [];
  let checked = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent.trim();
    const element = node.parentElement;
    if (!text || !element || element.closest('.visually-hidden, script, style')) continue;
    const style = getComputedStyle(element);
    if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = [...range.getClientRects()].filter(r => r.width > 0 && r.height > 0);
    if (!rects.length) continue;
    checked++;
    const outline = (parseFloat(style.webkitTextStrokeWidth) || 0) / 2 * scale;
    const letters = {
      left: Math.min(...rects.map(r => r.left)) - outline,
      top: Math.min(...rects.map(r => r.top)) - outline,
      right: Math.max(...rects.map(r => r.right)) + outline,
      bottom: Math.max(...rects.map(r => r.bottom)) + outline,
    };
    const name = `${element.tagName.toLowerCase()}${element.className && typeof element.className === 'string' ? '.' + element.className.trim().split(/\s+/).join('.') : ''}`;

    if (clips(style) && (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1)) {
      findings.push({ kind: style.textOverflow === 'ellipsis' ? 'shortened' : 'overflowing', text: text.slice(0, 40), element: name });
    }
    for (let up = element; up && up !== document.documentElement; up = up.parentElement) {
      const upStyle = getComputedStyle(up);
      if (!clips(upStyle)) continue;
      // a list that scrolls sideways, or the shelf running off the stage, is meant to be cut
      if (up.matches('.stage, .stage-frame, body') && element.closest('.shelf')) break;
      const box = inner(up);
      const over = {
        left: Math.round((box.left - letters.left) / scale * 10) / 10,
        top: Math.round((box.top - letters.top) / scale * 10) / 10,
        right: Math.round((letters.right - box.right) / scale * 10) / 10,
        bottom: Math.round((letters.bottom - box.bottom) / scale * 10) / 10,
      };
      const sides = Object.entries(over).filter(([, amount]) => amount > 0.5);
      if (sides.length) {
        findings.push({
          kind: 'cut off', text: text.slice(0, 40), element: name,
          by: `${up.tagName.toLowerCase()}.${String(up.className).trim().split(/\s+/)[0]}`,
          sides: Object.fromEntries(sides),
        });
        break;
      }
    }
  }
  return { checked, cutOff: findings.filter(f => f.kind !== 'shortened'), shortened: findings.filter(f => f.kind === 'shortened') };
}

// Measures the screen as it looks at rest. Opening and closing animations are
// switched off while measuring, so a panel that is still sliding open is
// judged by where it ends up, not by where it happens to be.
export async function auditAtRest(root) {
  const still = document.createElement('style');
  still.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }';
  document.head.append(still);
  void document.body.offsetWidth;
  await new Promise(resolve => setTimeout(resolve, 30));
  void document.body.offsetWidth;
  try {
    return auditText(root);
  } finally {
    still.remove();
  }
}
