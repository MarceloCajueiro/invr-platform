/**
 * Check if student preview mode is active.
 */
export function isPreviewMode(
  searchParams: Record<string, string | string[] | undefined>,
): boolean {
  return searchParams.preview === "student";
}

/**
 * Build an href that preserves ?preview=student when active.
 */
export function previewHref(
  path: string,
  searchParams: Record<string, string | string[] | undefined>,
): string {
  if (!isPreviewMode(searchParams)) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}preview=student`;
}
