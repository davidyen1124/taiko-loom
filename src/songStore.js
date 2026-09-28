// Songs analysed in this browser, kept in IndexedDB so the shelf survives a
// reload. Charts and audio live in separate stores: listing the shelf never
// touches the audio. The audio is the file as it was chosen, not decoded
// samples, which would be ten times the size. It is stored as plain bytes:
// Safari will not always store a File or Blob.
const NAME = 'taiko-nights';
const VERSION = 1;
const SONGS = 'songs';
const AUDIO = 'audio';

let opening = null;

function open() {
  if (opening) return opening;
  opening = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('This browser cannot save songs.')); return; }
    const request = indexedDB.open(NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SONGS)) db.createObjectStore(SONGS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(AUDIO)) db.createObjectStore(AUDIO);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('The song library is open in another tab.'));
  });
  opening.catch(() => { opening = null; });
  return opening;
}

// Runs `work` inside one transaction and resolves with its result once the
// transaction has been written.
async function within(stores, mode, work) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(stores, mode);
    let result;
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error('The song could not be saved.'));
    const request = work(transaction);
    if (request) request.onsuccess = () => { result = request.result; };
  });
}

// Every saved song, oldest first.
export async function savedSongs() {
  const songs = await within([SONGS], 'readonly', transaction => transaction.objectStore(SONGS).getAll());
  return (songs || []).sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
}

export async function saveSong(song, file) {
  const bytes = await file.arrayBuffer();
  return within([SONGS, AUDIO], 'readwrite', transaction => {
    transaction.objectStore(SONGS).put({ ...song, addedAt: song.addedAt || Date.now() });
    transaction.objectStore(AUDIO).put({ bytes, type: file.type || 'application/octet-stream' }, song.id);
  });
}

export async function savedAudio(id) {
  const saved = await within([AUDIO], 'readonly', transaction => transaction.objectStore(AUDIO).get(id));
  return saved ? new Blob([saved.bytes], { type: saved.type }) : null;
}

export const forgetSong = id => within([SONGS, AUDIO], 'readwrite', transaction => {
  transaction.objectStore(SONGS).delete(id);
  transaction.objectStore(AUDIO).delete(id);
});
