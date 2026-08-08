const BAD_WORDS = ['abuse', 'hate', 'terror', 'bomb', 'kill', 'racist']

export function isToxic(text: string) {
  if (!text) return false
  const lower = text.toLowerCase()
  for (const w of BAD_WORDS) if (lower.includes(w)) return true
  return false
}

export function sanitizeText(text: string) {
  if (!text) return text
  let out = text
  for (const w of BAD_WORDS) {
    const r = new RegExp(w, 'gi')
    out = out.replace(r, '****')
  }
  return out
}

export async function checkSafety(text: string) {
  const toxic = isToxic(text)
  return { toxic, sanitized: toxic ? sanitizeText(text) : text }
}
