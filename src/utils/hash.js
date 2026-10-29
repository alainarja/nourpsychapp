// NOT secure — placeholder so plain-text passwords never sit in AsyncStorage.
// Replace with real server-side auth when the backend is added.
export function hashPassword(pw) {
  let h = 5381;
  for (let i = 0; i < pw.length; i++) h = ((h << 5) + h + pw.charCodeAt(i)) | 0;
  return `djb2:${(h >>> 0).toString(16)}`;
}
