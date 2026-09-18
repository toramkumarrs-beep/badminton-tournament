import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/players?userId=xxx
export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    try {
        const players = await prisma.player.findMany({ where: { userId }, orderBy: { name: 'asc' } })
        return NextResponse.json(players)
    } catch (e) {
        console.error('[GET /api/players]', e)
        return NextResponse.json([], { status: 200 })
    }
}

// POST /api/players  { userId, name }
export async function POST(req: NextRequest) {
    try {
        const { userId, name } = await req.json()
        if (!userId || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        const player = await prisma.player.create({ data: { userId, name } })
        return NextResponse.json(player)
    } catch (e) {
        console.error('[POST /api/players]', e)
        return NextResponse.json({ error: 'Failed to create player' }, { status: 500 })
    }
}

// DELETE /api/players?id=xxx
export async function DELETE(req: NextRequest) {
    try {
        const id = req.nextUrl.searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
        await prisma.player.delete({ where: { id } })
        return NextResponse.json({ ok: true })
    } catch (e) {
        console.error('[DELETE /api/players]', e)
        return NextResponse.json({ error: 'Failed to delete player' }, { status: 500 })
    }
}
