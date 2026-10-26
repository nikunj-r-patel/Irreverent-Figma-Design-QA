export class TextNormalizer {
 static normalize(value: string): string {
  return value
    .replace(/\u00A0/g, ' ')
    .replace(/Â©/g, '©')
    .replace(/Â/g, '')
    .replace(/â€¢/g, '•')
    .replace(/â€™/g, '’')
    .replace(/â€œ/g, '“')
    .replace(/â€/g, '”')
    .replace(/\s+/g, ' ')
    .trim();
}

  static normalizeForMatching(
    value: string
  ): string {
    return this.normalize(value)
      .toLowerCase();
  }
}