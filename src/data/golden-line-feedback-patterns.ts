/** Banned vague feedback patterns for active golden-line choices (PXG2 / US-006–007). */
export const DEFAULT_NARRATIVE_FALLBACK = '你的选择激起了涟漪，后续影响仍在发酵。';

export const BANNED_VAGUE_FEEDBACK_PATTERNS: RegExp[] = [
  /^你的选择激起了涟漪/,
  /^你的心中泛起涟漪/,
  /^你获得了新的体悟$/,
  /^与某人的关系发生了微妙的变化$/,
  /^一段新的旅程开始了$/,
  /^新的机遇正在等待你$/,
  /^你完成了某件重要的事$/,
];

export function isBannedVagueFeedback(text: string | null | undefined): boolean {
  if (!text || text.trim().length === 0) {
    return true;
  }
  const trimmed = text.trim();
  if (trimmed === DEFAULT_NARRATIVE_FALLBACK) {
    return true;
  }
  return BANNED_VAGUE_FEEDBACK_PATTERNS.some((pattern) => pattern.test(trimmed));
}
