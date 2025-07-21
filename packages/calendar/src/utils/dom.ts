export function stripTags(str: string) {
  return str.replace(/<([^>]+)>/gi, '');
}
