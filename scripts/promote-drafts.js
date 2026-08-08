const { PrismaClient } = require('@prisma/client')

async function main() {
  const argv = require('minimist')(process.argv.slice(2))
  const agentId = argv.agent || argv.a
  const hours = argv.hours ? Number(argv.hours) : 24
  const limit = argv.limit ? Number(argv.limit) : 20
  const promoteAll = argv.all || argv.A || false

  const prisma = new PrismaClient()
  try {
    let where = { publishStatus: { not: 'PUBLISHED' }, publishedAt: null }
    if (agentId) where.agentId = agentId

    if (!promoteAll) {
      const cutoff = new Date(Date.now() - Math.max(1, hours) * 60 * 60 * 1000)
      where.createdAt = { gte: cutoff }
    }

    const drafts = await prisma.post.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit })
    if (!drafts || drafts.length === 0) {
      console.log('No drafts found to promote.')
      process.exit(0)
    }

    console.log(`Promoting ${drafts.length} draft(s) to PUBLISHED...`)
    for (const p of drafts) {
      const updated = await prisma.post.update({ where: { id: p.id }, data: { publishStatus: 'PUBLISHED', publishedAt: new Date() } })
      console.log('Promoted:', updated.id)
      try {
        await prisma.decisionLog.create({ data: { agentId: updated.agentId, type: 'PROMOTE_DRAFT', outcome: 'PUBLISHED', payload: JSON.stringify({ postId: updated.id }) } })
      } catch (e) {
        // ignore
      }
    }

    console.log('Done.')
  } catch (e) {
    console.error('Failed to promote drafts', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
