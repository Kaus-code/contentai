export async function factCheckUrl(url: string, queryTerms: string[]): Promise<{ passed: boolean; notes: string }> {
  try {
    // lightweight fetch and search for query terms
    // @ts-ignore
    const fetchFn = typeof fetch !== 'undefined' ? fetch : (await import('node-fetch')).default
    const res = await fetchFn(url, { method: 'GET', redirect: 'follow', timeout: 4000 })
    const text = await res.text()
    const found = queryTerms.filter((q) => text.toLowerCase().includes(q.toLowerCase()))
    const passed = found.length > 0
    const notes = `Found ${found.length} evidence terms: ${found.slice(0,5).join(', ')}`
    return { passed, notes }
  } catch (e) {
    return { passed: false, notes: `Fetch failed: ${String(e)}` }
  }
}

export async function quickFactCheckSummary(url: string, textSnippet: string) {
  // extract a few keywords and run a quick check
  const tokens = textSnippet.split(/\s+/).slice(0, 30).map((t) => t.replace(/[^a-zA-Z0-9]/g, ''))
  const terms = Array.from(new Set(tokens)).filter((t) => t.length > 3).slice(0, 5)
  return factCheckUrl(url, terms)
}
