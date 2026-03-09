export interface BracketPlayer {
    id: string
    name: string
    seed?: number | null
}

export interface BracketMatch {
    id?: string
    round: number
    matchNumber: number
    player1Id: string | null
    player2Id: string | null
    player1Name: string | null
    player2Name: string | null
    isBye: boolean
    score1?: number | null
    score2?: number | null
    winnerId?: string | null
    winnerName?: string | null
    nextMatchId?: string | null
    nextMatchSlot?: number | null
}

/**
 * Returns the next power of 2 >= n
 */
export function nextPowerOf2(n: number): number {
    let power = 1
    while (power < n) power *= 2
    return power
}

/**
 * Generates the seeded knockout bracket.
 * Seeds are placed so that top seeds meet latest possible.
 * Standard seeding positions: 1 vs last, 2 vs second-to-last, etc.
 */
export function generateKnockoutBracket(players: BracketPlayer[]): BracketMatch[] {
    const n = players.length
    const bracketSize = nextPowerOf2(n)
    const byeCount = bracketSize - n
    const totalRounds = Math.log2(bracketSize)

    // Sort players by seed (seeded players first, then unseeded alphabetically)
    const seeded = players.filter(p => p.seed != null).sort((a, b) => (a.seed! - b.seed!))
    const unseeded = players.filter(p => p.seed == null)
    const sorted = [...seeded, ...unseeded]

    // Standard bracket seeding positions (1-indexed slots)
    // This ensures 1 plays in slot 1, and opponents meet as late as possible
    function seedPositions(size: number): number[] {
        if (size === 1) return [1]
        const half = size / 2
        const upper = seedPositions(half)
        const lower = upper.map(pos => size + 1 - pos)
        const result: number[] = []
        for (let i = 0; i < upper.length; i++) {
            result.push(upper[i], lower[i])
        }
        return result
    }

    const positions = seedPositions(bracketSize) // e.g. [1, 8, 5, 4, 3, 6, 7, 2] for 8
    // positions[i] = slot for the (i+1)-th seed/player

    // Fill slots
    const slots: (BracketPlayer | null)[] = new Array(bracketSize).fill(null)
    for (let i = 0; i < bracketSize; i++) {
        const slot = positions[i] - 1 // 0-indexed
        if (i < sorted.length) {
            slots[slot] = sorted[i]
        }
        // else null = BYE
    }

    const matches: BracketMatch[] = []
    // Round 1 matches
    const r1MatchCount = bracketSize / 2
    for (let m = 0; m < r1MatchCount; m++) {
        const p1 = slots[m * 2]
        const p2 = slots[m * 2 + 1]
        const isBye = (p1 !== null && p2 === null) || (p1 === null && p2 !== null)

        const match: BracketMatch = {
            round: 1,
            matchNumber: m + 1,
            player1Id: p1?.id ?? null,
            player1Name: p1?.name ?? null,
            player2Id: p2?.id ?? null,
            player2Name: p2?.name ?? null,
            isBye,
        }

        // Auto-resolve BYE matches
        if (isBye) {
            const winner = p1 ?? p2
            match.winnerId = winner?.id ?? null
            match.winnerName = winner?.name ?? null
        }

        matches.push(match)
    }

    // Generate subsequent rounds as empty placeholder matches
    let prevRoundCount = r1MatchCount
    for (let round = 2; round <= totalRounds; round++) {
        const matchCount = prevRoundCount / 2
        for (let m = 0; m < matchCount; m++) {
            matches.push({
                round,
                matchNumber: m + 1,
                player1Id: null,
                player1Name: null,
                player2Id: null,
                player2Name: null,
                isBye: false,
            })
        }
        prevRoundCount = matchCount
    }

    // Link next match references
    const rounds = Math.log2(bracketSize)
    for (let round = 1; round < rounds; round++) {
        const roundMatches = matches.filter(m => m.round === round)
        const nextRoundMatches = matches.filter(m => m.round === round + 1)
        roundMatches.forEach((match, idx) => {
            const nextMatchIdx = Math.floor(idx / 2)
            match.nextMatchSlot = (idx % 2) + 1
            // Will be filled with actual DB id after insertion
            // Store index for now
            match.nextMatchId = `${round + 1}-${nextMatchIdx + 1}` // temp ref
            // Auto-advance BYE winners into next round
            if (match.isBye && match.winnerId) {
                const nextMatch = nextRoundMatches[nextMatchIdx]
                if (match.nextMatchSlot === 1) {
                    nextMatch.player1Id = match.winnerId ?? null
                    nextMatch.player1Name = match.winnerName ?? null
                } else {
                    nextMatch.player2Id = match.winnerId ?? null
                    nextMatch.player2Name = match.winnerName ?? null
                }
            }
        })
    }

    return matches
}

// ─── League / Round Robin ────────────────────────────────────────────────────

export interface LeagueFixture {
    round: number
    matchNumber: number
    pool: number
    player1Id: string
    player2Id: string
    player1Name: string
    player2Name: string
}

/**
 * Generates round-robin fixtures for each pool.
 * Players are split into pools of roughly equal size.
 */
export function generateLeagueFixtures(
    players: BracketPlayer[],
    poolCount: number
): LeagueFixture[] {
    // Distribute players into pools
    const pools: BracketPlayer[][] = Array.from({ length: poolCount }, () => [])
    players.forEach((p, i) => {
        pools[i % poolCount].push(p)
    })

    const fixtures: LeagueFixture[] = []

    pools.forEach((poolPlayers, poolIdx) => {
        const roundRobin = generateRoundRobin(poolPlayers)
        roundRobin.forEach(f => {
            fixtures.push({ ...f, pool: poolIdx + 1 })
        })
    })

    return fixtures
}

function generateRoundRobin(players: BracketPlayer[]): Omit<LeagueFixture, 'pool'>[] {
    const n = players.length
    // If odd, add a dummy BYE player
    const list = n % 2 === 0 ? [...players] : [...players, { id: 'BYE', name: 'BYE' }]
    const total = list.length
    const rounds = total - 1
    const matchesPerRound = total / 2
    const fixtures: Omit<LeagueFixture, 'pool'>[] = []

    let matchNum = 1
    for (let round = 0; round < rounds; round++) {
        for (let match = 0; match < matchesPerRound; match++) {
            const home = list[match]
            const away = list[total - 1 - match]
            // Skip BYE matches
            if (home.id !== 'BYE' && away.id !== 'BYE') {
                fixtures.push({
                    round: round + 1,
                    matchNumber: matchNum++,
                    player1Id: home.id,
                    player2Id: away.id,
                    player1Name: home.name,
                    player2Name: away.name,
                })
            }
        }
        // Rotate: fix first element, rotate rest
        const fixed = list[0]
        const rotating = list.slice(1)
        rotating.unshift(rotating.pop()!)
        list.splice(1, rotating.length, ...rotating)
    }

    return fixtures
}

// ─── League Table ─────────────────────────────────────────────────────────────

export interface LeagueTableRow {
    playerId: string
    playerName: string
    played: number
    won: number
    lost: number
    points: number
    setsFor: number
    setsAgainst: number
    setDiff: number
}

export function calculateLeagueTable(
    players: BracketPlayer[],
    matches: Array<{
        player1Id: string | null
        player2Id: string | null
        player1Name: string | null
        player2Name: string | null
        score1: number | null
        score2: number | null
        winnerId: string | null
        pool: number | null
    }>,
    pool?: number
): LeagueTableRow[] {
    const poolMatches = pool != null ? matches.filter(m => m.pool === pool) : matches
    const completedMatches = poolMatches.filter(
        m => m.score1 != null && m.score2 != null && m.player1Id && m.player2Id
    )

    const tableMap = new Map<string, LeagueTableRow>()

    players.forEach(p => {
        tableMap.set(p.id, {
            playerId: p.id,
            playerName: p.name,
            played: 0,
            won: 0,
            lost: 0,
            points: 0,
            setsFor: 0,
            setsAgainst: 0,
            setDiff: 0,
        })
    })

    completedMatches.forEach(m => {
        const r1 = tableMap.get(m.player1Id!)
        const r2 = tableMap.get(m.player2Id!)
        if (!r1 || !r2) return

        r1.played++
        r2.played++
        r1.setsFor += m.score1!
        r1.setsAgainst += m.score2!
        r2.setsFor += m.score2!
        r2.setsAgainst += m.score1!

        if (m.winnerId === m.player1Id) {
            r1.won++
            r1.points += 2
            r2.lost++
        } else if (m.winnerId === m.player2Id) {
            r2.won++
            r2.points += 2
            r1.lost++
        }
    })

    const rows = Array.from(tableMap.values()).map(r => ({
        ...r,
        setDiff: r.setsFor - r.setsAgainst,
    }))

    // Sort: points desc → set diff desc → head-to-head (simplified) → name
    rows.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.setDiff !== a.setDiff) return b.setDiff - a.setDiff
        return a.playerName.localeCompare(b.playerName)
    })

    return rows
}
