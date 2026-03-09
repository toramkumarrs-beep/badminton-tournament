import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/players?userId=xxx
export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    const players = await prisma.player.findMany({ where: { userId }, orderBy: { name: 'asc' } })
    return NextResponse.json(players)
}

// POST /api/players  { userId, name }
export async function POST(req: NextRequest) {
    const { userId, name } = await req.json()
    if (!userId || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const player = await prisma.player.create({ data: { userId, name } })
    return NextResponse.json(player)
}

// DELETE /api/players?id=xxx
export async function DELETE(req: NextRequest) {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await prisma.player.delete({ where: { id } })
    return NextResponse.json({ ok: true })
}
