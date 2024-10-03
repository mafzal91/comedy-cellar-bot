export function removeSizeFromUrl(url: string): string {
  // Use a regular expression to remove '-70x70' before the file extension
  // return url.replace(/-70x70(?=\.\w+)$/, "");
  return url.replace(/-70x70(?=\.\w+$)/, "");
}
