import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/matches/[id]/score  { score1, score2, winnerId, winnerName }
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const { score1, score2, winnerId, winnerName } = await req.json()

    const match = await prisma.match.findUnique({ where: { id } })
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

    // Update current match score + winner
    await prisma.match.update({
        where: { id },
        data: { score1, score2, winnerId, winnerName },
    })

    // For knockout: propagate winner to next match
    if (match.nextMatchId && winnerId) {
        const slot = match.nextMatchSlot === 1 ? 'player1' : 'player2'
        await prisma.match.update({
            where: { id: match.nextMatchId },
            data: {
                [`${slot}Id`]: winnerId,
                [`${slot}Name`]: winnerName,
            },
        })
    }

    return NextResponse.json({ ok: true })
}
