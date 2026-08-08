import * as db from './db'

// Simple A/B testing runner utilities

// Choose a variant for display using epsilon-greedy exploration
export async function chooseVariantForPost(postId: string, variants: any[]) {
  if (!variants || variants.length === 0) return null

  // Fetch metrics
  const metrics = await db.getVariantMetricsForPost(postId)
  const map = new Map(metrics.map((m: any) => [m.postVariantId, m]))

  // Epsilon-greedy
  const EPS = 0.1
  if (Math.random() < EPS) {
    // explore
    const pick = variants[Math.floor(Math.random() * variants.length)]
    return pick
  }

  // Exploit: pick highest conversion rate (conversions/impressions)
  let best: any = null
  let bestRate = -1
  for (const v of variants) {
    const m = map.get(v.id)
    const conv = m ? m.conversions : 0
    const imp = m ? m.impressions : 0
    const rate = imp > 0 ? conv / imp : 0
    if (rate > bestRate) {
      bestRate = rate
      best = v
    }
  }
  return best || variants[0]
}

export async function recordImpression(variantId: string) {
  return db.recordImpression(variantId)
}

export async function recordConversion(variantId: string) {
  return db.recordConversion(variantId)
}

export async function computeWinner(postId: string) {
  const metrics = await db.getVariantMetricsForPost(postId)
  if (!metrics || metrics.length === 0) return null
  let winner = null
  let bestRate = -1
  for (const m of metrics) {
    const conv = m.conversions
    const imp = m.impressions
    const rate = imp > 0 ? conv / imp : 0
    if (rate > bestRate) {
      bestRate = rate
      winner = m.postVariant
    }
  }
  return { winner, bestRate }
}
