export function decodedPathname(path: string) {
  try {
    return decodeURI(path);
  } catch {
    return path;
  }
}
