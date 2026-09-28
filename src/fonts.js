// Fonts ship with the app so the game looks the same offline.
import '@fontsource/m-plus-rounded-1c/800.css';
import '@fontsource/m-plus-rounded-1c/900.css';
import '@fontsource/dela-gothic-one/400.css';

const CANVAS_GLYPHS = '良可不可魂連打ドンカッふうせん大かんたんふつうむずかしい祭コンボクリア0123456789GO-TIME!×';

// Canvas text does not trigger font loading by itself, so ask for the faces
// (and any extra text such as a song title) before the first frame is drawn.
export async function loadFonts(extra = '') {
  if (!document.fonts?.load) return;
  const text = CANVAS_GLYPHS + extra;
  const faces = ['800', '900'].map(w => `${w} 24px "M PLUS Rounded 1c"`).concat('400 24px "Dela Gothic One"');
  await Promise.allSettled(faces.map(face => document.fonts.load(face, text)));
}
