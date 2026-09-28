// A modal panel that lives inside the stage, so it scales with the game.
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function Dialog({ title, kana, onClose, children, className = '', locked = false }) {
  const panel = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    panel.current.focus();
    const down = event => {
      event.stopPropagation();
      if (event.key === 'Escape' && !locked) { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const items = [...panel.current.querySelectorAll('button:not(:disabled), input:not(:disabled), [tabindex="0"]')];
      if (!items.length) return;
      const first = items[0]; const last = items.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    // capture, so the screen underneath never sees keys meant for the dialog
    window.addEventListener('keydown', down, true);
    return () => { window.removeEventListener('keydown', down, true); previous?.focus?.(); };
  }, [onClose, locked]);

  return (
    <div className="dialog-shade" onPointerDown={event => { if (event.target === event.currentTarget && !locked) onClose(); }}>
      <div className={`dialog ${className}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={panel}>
        <header className="dialog-head">
          <h2>{kana && <span>{kana}</span>}{title}</h2>
          <button className="dialog-close" aria-label="Close" onClick={onClose} disabled={locked}><X size={26} strokeWidth={3} /></button>
        </header>
        <div className="dialog-body">{children}</div>
      </div>
    </div>
  );
}
