import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/tournaments/[id]  — full tournament data
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const tournament = await prisma.tournament.findUnique({
        where: { id },
        include: {
            tournamentPlayers: true,
            matches: { orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }] },
        },
    })
    if (!tournament) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(tournament)
}

// DELETE /api/tournaments/[id]
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    await prisma.tournament.delete({ where: { id } })
    return NextResponse.json({ ok: true })
}
