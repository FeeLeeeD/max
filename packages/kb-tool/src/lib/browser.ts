export function isChromiumBased(): boolean {
  return 'showOpenFilePicker' in window;
}
