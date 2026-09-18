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

    const oldWinnerId = match.winnerId

    // Update current match score + winner (allow nulls for match reset)
    await prisma.match.update({
        where: { id },
        data: {
            score1: score1 != null ? score1 : null,
            score2: score2 != null ? score2 : null,
            winnerId: winnerId != null ? winnerId : null,
            winnerName: winnerName != null ? winnerName : null,
        },
    })

    // For knockout: propagate winner to next match
    if (match.nextMatchId) {
        const slot = match.nextMatchSlot === 1 ? 'player1' : 'player2'
        await prisma.match.update({
            where: { id: match.nextMatchId },
            data: {
                [`${slot}Id`]: winnerId ?? null,
                [`${slot}Name`]: winnerName ?? null,
            },
        })

        // If the winner changed or was cleared, downstream completed matches must be reset
        if (oldWinnerId && oldWinnerId !== winnerId) {
            await resetDownstream(match.nextMatchId, oldWinnerId)
        }
    }

    return NextResponse.json({ ok: true })
}

async function resetDownstream(matchId: string, affectedPlayerId: string) {
    const match = await prisma.match.findUnique({ where: { id: matchId } })
    if (!match) return

    // If this match was already completed or had scores recorded
    if (match.winnerId || match.score1 != null || match.score2 != null) {
        const downstreamWinner = match.winnerId

        await prisma.match.update({
            where: { id: matchId },
            data: {
                score1: null,
                score2: null,
                winnerId: null,
                winnerName: null,
            },
        })

        // Propagate clearing downstream
        if (match.nextMatchId && downstreamWinner) {
            const nextSlot = match.nextMatchSlot === 1 ? 'player1' : 'player2'
            await prisma.match.update({
                where: { id: match.nextMatchId },
                data: {
                    [`${nextSlot}Id`]: null,
                    [`${nextSlot}Name`]: null,
                },
            })
            await resetDownstream(match.nextMatchId, downstreamWinner)
        }
    }
}
