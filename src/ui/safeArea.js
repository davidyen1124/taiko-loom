// The parts of the display the device keeps for itself: the notch, the rounded
// corners, the strip along the bottom of an iPhone that swipes back to the
// home screen. Measured from the page, in CSS pixels.
let probe = null;

export function safeArea() {
  if (typeof document === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 };
  if (!probe) {
    probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;'
      + 'padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
    document.body.append(probe);
  }
  const style = getComputedStyle(probe);
  const read = side => parseFloat(style[`padding${side}`]) || 0;
  return { top: read('Top'), right: read('Right'), bottom: read('Bottom'), left: read('Left') };
}
