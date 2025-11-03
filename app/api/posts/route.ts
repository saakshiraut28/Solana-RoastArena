import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// GET all posts
export async function GET() {
    const posts = await prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(posts)
}

// CREATE new post
export async function POST(req: Request) {
    try {
        const { text } = await req.json()
        if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 })

        const post = await prisma.post.create({ data: { text } })
        return NextResponse.json(post)
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
