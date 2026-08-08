const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    const posts = await prisma.post.findMany({ orderBy: { createdAt: 'desc' } })
    if (!posts.length) {
      console.log('No posts found')
      return
    }

    console.log('Posts:')
    for (const p of posts) {
      console.log('---')
      console.log('id:', p.id)
      console.log('agentId:', p.agentId)
      console.log('publishStatus:', p.publishStatus)
      console.log('publishedAt:', p.publishedAt)
      console.log('text/body:', p.text || p.body)
    }
  } catch (e) {
    console.error('Error listing posts', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
