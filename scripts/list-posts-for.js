const { PrismaClient } = require('@prisma/client')

async function main() {
  const agentId = process.argv[2]
  if (!agentId) {
    console.error('Usage: node scripts/list-posts-for.js <agentId>')
    process.exit(1)
  }

  const prisma = new PrismaClient()
  try {
    const posts = await prisma.post.findMany({ where: { agentId }, orderBy: { createdAt: 'desc' } })
    console.log(`Posts for ${agentId}:`, posts.length)
    for (const p of posts) {
      console.log('---')
      console.log('id:', p.id)
      console.log('publishStatus:', p.publishStatus)
      console.log('publishedAt:', p.publishedAt)
      console.log('body/text:', p.body || p.text)
    }
  } catch (e) {
    console.error('Error', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
