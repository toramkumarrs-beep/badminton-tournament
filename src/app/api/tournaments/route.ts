import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateKnockoutBracket, generateLeagueFixtures } from '@/lib/bracketEngine'

// GET /api/tournaments?userId=xxx  — list tournaments for a user
export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const tournaments = await prisma.tournament.findMany({
        where: { createdBy: userId },
        orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(tournaments)
}

// POST /api/tournaments  — create tournament and generate matches
export async function POST(req: NextRequest) {
    const { name, type, poolCount, players, userId } = await req.json()

    if (!name || !type || !players || !userId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Ensure user exists
    let user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // 2. Create or find players in DB
    const playerRecords = await Promise.all(
        players.map(async (p: { id?: string; name: string; seed?: number }) => {
            if (p.id) return { id: p.id, name: p.name, seed: p.seed }
            const created = await prisma.player.create({ data: { userId, name: p.name } })
            return { id: created.id, name: created.name, seed: p.seed }
        })
    )

    // 3. Create tournament record
    const tournament = await prisma.tournament.create({
        data: {
            name,
            type,
            status: 'active',
            poolCount: poolCount ?? 1,
            createdBy: userId,
        },
    })

    // 4. Create TournamentPlayer records
    await prisma.tournamentPlayer.createMany({
        data: playerRecords.map((p: { id: string; name: string; seed?: number }, idx: number) => ({
            tournamentId: tournament.id,
            playerId: p.id,
            playerName: p.name,
            seed: p.seed ?? null,
            pool: type === 'league' ? (idx % (poolCount ?? 1)) + 1 : null,
        })),
    })

    // 5. Generate matches
    if (type === 'knockout') {
        const bracketMatches = generateKnockoutBracket(playerRecords)

        // Insert all matches first (without nextMatchId links)
        const createdMatches = await Promise.all(
            bracketMatches.map(m =>
                prisma.match.create({
                    data: {
                        tournamentId: tournament.id,
                        round: m.round,
                        matchNumber: m.matchNumber,
                        player1Id: m.player1Id,
                        player2Id: m.player2Id,
                        player1Name: m.player1Name,
                        player2Name: m.player2Name,
                        isBye: m.isBye,
                        winnerId: m.winnerId ?? null,
                        winnerName: m.winnerName ?? null,
                    },
                })
            )
        )

        // Now link nextMatchId using round and matchNumber
        const matchLookup = new Map<string, string>()
        createdMatches.forEach((m: { id: string, round: number, matchNumber: number }) => {
            matchLookup.set(`${m.round}-${m.matchNumber}`, m.id)
        })

        await Promise.all(
            bracketMatches.map((bm, idx) => {
                if (!bm.nextMatchId) return Promise.resolve()
                const nextId = matchLookup.get(bm.nextMatchId)
                if (!nextId) return Promise.resolve()
                return prisma.match.update({
                    where: { id: createdMatches[idx].id },
                    data: { nextMatchId: nextId, nextMatchSlot: bm.nextMatchSlot },
                })
            })
        )

        // Propagate bye winners into next matches
        const r1Byes = bracketMatches
            .map((bm, idx) => ({ bm, idx }))
            .filter(({ bm }) => bm.isBye && bm.winnerId)

        for (const { bm, idx } of r1Byes) {
            const nextId = matchLookup.get(bm.nextMatchId as string)
            if (!nextId) continue
            const slot = bm.nextMatchSlot === 1 ? 'player1' : 'player2'
            await prisma.match.update({
                where: { id: nextId },
                data: {
                    [`${slot}Id`]: bm.winnerId,
                    [`${slot}Name`]: bm.winnerName,
                },
            })
        }
    } else {
        // League
        const fixtures = generateLeagueFixtures(playerRecords, poolCount ?? 1)
        await prisma.match.createMany({
            data: fixtures.map(f => ({
                tournamentId: tournament.id,
                round: f.round,
                matchNumber: f.matchNumber,
                player1Id: f.player1Id,
                player2Id: f.player2Id,
                player1Name: f.player1Name,
                player2Name: f.player2Name,
                pool: f.pool,
                isBye: false,
            })),
        })
    }

    return NextResponse.json({ id: tournament.id })
}
