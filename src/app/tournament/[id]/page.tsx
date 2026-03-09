'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Users, Dribbble, ArrowLeft, Printer, Trash2, Loader2, X, ChevronRight, Hash } from 'lucide-react'
import { calculateLeagueTable } from '@/lib/bracketEngine'

interface TournamentPlayer {
    id: string
    playerId: string
    playerName: string
    seed: number | null
    pool: number | null
}

interface Match {
    id: string
    round: number
    matchNumber: number
    player1Id: string | null
    player2Id: string | null
    player1Name: string | null
    player2Name: string | null
    score1: number | null
    score2: number | null
    winnerId: string | null
    winnerName: string | null
    isBye: boolean
    pool: number | null
    nextMatchId: string | null
    nextMatchSlot: number | null
}

interface Tournament {
    id: string
    name: string
    type: string
    status: string
    poolCount: number
    createdAt: string
    tournamentPlayers: TournamentPlayer[]
    matches: Match[]
}

interface ScoreModal {
    match: Match
}

function roundLabel(round: number, totalRounds: number): string {
    const remaining = totalRounds - round + 1
    if (remaining === 1) return 'Final'
    if (remaining === 2) return 'Semi-Finals'
    if (remaining === 3) return 'Quarter-Finals'
    return `Round ${round}`
}

export default function TournamentPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [tournament, setTournament] = useState<Tournament | null>(null)
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<'bracket' | 'fixtures' | 'table'>('bracket')
    const [scoreModal, setScoreModal] = useState<ScoreModal | null>(null)
    const [s1, setS1] = useState('')
    const [s2, setS2] = useState('')
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState('')

    const fetch_ = useCallback(async () => {
        const res = await fetch(`/api/tournaments/${id}`)
        if (!res.ok) { router.push('/'); return }
        const data = await res.json()
        setTournament(data)
        setLoading(false)
    }, [id, router])

    useEffect(() => { fetch_() }, [fetch_])

    const showToast = (msg: string) => {
        setToast(msg)
        setTimeout(() => setToast(''), 2500)
    }

    const openScoreModal = (match: Match) => {
        if (match.isBye) return
        if (!match.player1Id || !match.player2Id) return
        setS1(match.score1 != null ? String(match.score1) : '')
        setS2(match.score2 != null ? String(match.score2) : '')
        setScoreModal({ match })
    }

    const saveScore = async () => {
        if (!scoreModal) return
        const score1 = parseInt(s1)
        const score2 = parseInt(s2)
        if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) return
        if (score1 === score2) { alert('Scores cannot be equal — there must be a winner.'); return }

        const m = scoreModal.match
        const winnerId = score1 > score2 ? m.player1Id : m.player2Id
        const winnerName = score1 > score2 ? m.player1Name : m.player2Name

        setSaving(true)
        await fetch(`/api/matches/${m.id}/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score1, score2, winnerId, winnerName }),
        })
        setSaving(false)
        setScoreModal(null)
        showToast('Score saved! ✓')
        await fetch_()
    }

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background pointer-events-none">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <div className="text-white/50 animate-pulse font-medium">Loading Arena...</div>
        </div>
    )

    if (!tournament) return null

    const isKnockout = tournament.type === 'knockout'
    const matches = tournament.matches
    const players = tournament.tournamentPlayers.map(tp => ({ id: tp.playerId, name: tp.playerName }))

    // ─── Knockout bracket ────────────────────────────────────────────────────────
    const maxRound = Math.max(...matches.map(m => m.round), 1)
    const roundNums = Array.from({ length: maxRound }, (_, i) => i + 1)

    // ─── League / pools ──────────────────────────────────────────────────────────
    const numPools = tournament.poolCount
    const pools = Array.from({ length: numPools }, (_, pi) => pi + 1)

    const deleteTournament = async () => {
        if (!confirm(`Delete "${tournament.name}"? This cannot be undone.`)) return
        await fetch(`/api/tournaments/${id}`, { method: 'DELETE' })
        router.push('/')
    }

    const completedMatches = matches.filter(m => m.winnerId || m.isBye).length
    const pendingMatches = matches.filter(m => !m.winnerId && !m.isBye && m.player1Id && m.player2Id).length

    return (
        <div className="min-h-screen flex flex-col font-sans">
            {/* Injected print styles - guaranteed to override Tailwind */}
            <style>{`
                @media print {
                    * { box-shadow: none !important; backdrop-filter: none !important; animation: none !important; transition: none !important; color: #111 !important; background-color: transparent !important; border-color: transparent !important; }
                    nav, .no-print { display: none !important; }
                    .overflow-x-auto, .overflow-hidden { overflow: visible !important; }
                    .min-h-screen { min-height: auto !important; }
                    main { padding: 4px 0 0 0 !important; max-width: 100% !important; width: 100% !important; }
                    .bracket-print-container { zoom: var(--pz, 0.65); gap: 28px !important; padding: 0 !important; }
                    .bracket-round-header { color: #444 !important; border-bottom: 1px solid #ccc !important; border-color: #ccc !important; font-size: 9px !important; margin-bottom: 6px !important; }
                    .bracket-match-card { border: 1px solid #ccc !important; border-color: #ccc !important; background-color: white !important; border-radius: 4px !important; }
                    .bracket-match-card > div { background-color: white !important; border: none !important; overflow: visible !important; }
                    .bracket-player { display: flex !important; align-items: center !important; justify-content: space-between !important; padding: 2px 6px !important; height: 22px !important; min-height: 22px !important; max-height: 22px !important; background-color: white !important; overflow: hidden !important; }
                    .bracket-player-winner { background-color: #f0fff4 !important; }
                    .bracket-player-name { color: #111 !important; font-size: 9px !important; }
                    .bracket-player-score { color: #111 !important; font-size: 9px !important; font-weight: bold !important; }
                    .bracket-bye { display: flex !important; align-items: center !important; padding: 2px 6px !important; height: 22px !important; min-height: 22px !important; max-height: 22px !important; background-color: #f5f5f5 !important; overflow: hidden !important; }
                    .bracket-bye span { color: #bbb !important; font-size: 8px !important; }
                    .bracket-divider { height: 0 !important; border-bottom: 1px solid #ddd !important; border-color: #ddd !important; display: block !important; }
                    svg path, svg line { stroke: #bbb !important; stroke-opacity: 1 !important; }
                }
            `}</style>

            <nav className="sticky top-0 z-40 glass border-b border-white/5 no-print">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg group-hover:shadow-primary/50 transition-all">
                            <Dribbble className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-white font-['Outfit'] hidden sm:block">
                            Shuttle<span className="text-secondary">Court</span>
                        </span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link href="/" className="px-4 py-2 rounded-full text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" /> Home
                        </Link>
                        <div className="w-px h-6 bg-white/10 mx-1"></div>
                        <button onClick={() => window.print()} className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors" title="Print Bracket">
                            <Printer className="w-5 h-5" />
                        </button>
                        <button onClick={deleteTournament} className="p-2 rounded-full text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-colors" title="Delete Tournament">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </nav>

            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-secondary/20 backdrop-blur-md border border-secondary/50 text-secondary font-semibold shadow-[0_0_30px_-5px_rgba(0,132,255,0.4)] no-print">
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 print:py-0 print:px-0">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start mb-6 print:mb-2 no-print">
                    <div>
                        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-4xl md:text-5xl font-extrabold text-white tracking-tight font-['Outfit'] mb-2 print:text-black">
                            {tournament.name}
                        </motion.h1>
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-2">
                            <span className={`px-2 md:px-3 py-1 rounded-md text-xs md:text-sm font-bold uppercase tracking-wide border ${isKnockout ? 'bg-primary/10 text-primary border-primary/20 print:!border-gray-300 print:!text-black print:!bg-white' : 'bg-secondary/10 text-secondary border-secondary/20 print:!border-gray-300 print:!text-black print:!bg-white'} flex items-center gap-1.5`}>
                                {isKnockout ? <Trophy className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                                {isKnockout ? 'Knockout' : 'League'}
                            </span>
                            <span className="px-2 md:px-3 py-1 rounded-md text-xs md:text-sm font-bold uppercase tracking-wide bg-white/5 text-white/70 border border-white/10 print:!border-gray-300 print:!text-black print:!bg-white">
                                {tournament.tournamentPlayers.length} Players
                            </span>
                            {!isKnockout && numPools > 1 && (
                                <span className="px-2 md:px-3 py-1 rounded-md text-xs md:text-sm font-bold uppercase tracking-wide bg-white/5 text-white/70 border border-white/10 print:!border-gray-300 print:!text-black print:!bg-white flex items-center gap-1.5">
                                    <Hash className="w-3.5 h-3.5" /> {numPools} Pools
                                </span>
                            )}
                        </motion.div>
                    </div>

                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3 w-full md:w-auto mt-4 print:mt-0">
                        <div className="glass-card p-4 text-center min-w-[100px]">
                            <div className="text-3xl font-bold text-white mb-1 font-['Outfit']">{completedMatches}</div>
                            <div className="text-xs font-semibold text-white/40 uppercase tracking-widest">Done</div>
                        </div>
                        <div className="glass-card p-4 text-center min-w-[100px]">
                            <div className="text-3xl font-bold text-secondary mb-1 font-['Outfit']">{pendingMatches}</div>
                            <div className="text-xs font-semibold text-secondary/40 uppercase tracking-widest">Pending</div>
                        </div>
                        <div className="glass-card p-4 text-center min-w-[100px]">
                            <div className="text-3xl font-bold text-white/50 mb-1 font-['Outfit']">{matches.length}</div>
                            <div className="text-xs font-semibold text-white/30 uppercase tracking-widest">Total</div>
                        </div>
                    </motion.div>
                </div>

                <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 w-fit mb-8 no-print mx-auto sm:mx-0">
                    {isKnockout && (
                        <button onClick={() => setTab('bracket')} className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${tab === 'bracket' ? 'bg-primary text-white shadow-md' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                            Tournament Bracket
                        </button>
                    )}
                    <button onClick={() => setTab('fixtures')} className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${tab === 'fixtures' ? 'bg-primary text-white shadow-md' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                        All Fixtures
                    </button>
                    {!isKnockout && (
                        <button onClick={() => setTab('table')} className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${tab === 'table' ? 'bg-primary text-white shadow-md' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                            League Tables
                        </button>
                    )}
                </div>

                {isKnockout && tab === 'bracket' && (
                    <>
                        <div className="w-full overflow-x-auto pb-4 print:overflow-visible print:pb-0" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
                            {/* Dynamic print zoom: fit all rounds on A4 landscape (≈820px usable) */}
                            {(() => {
                                const numRounds = roundNums.length
                                const colW = 256   // w-64
                                const gapW = 64    // gap-16
                                const totalW = numRounds * colW + Math.max(0, numRounds - 1) * gapW
                                const printZoom = Math.min(1, Math.floor((820 / totalW) * 100) / 100)
                                return (
                                    <div
                                        className="flex gap-16 min-w-max p-4 print:p-0 bracket-print-container"
                                        style={{ '--pz': printZoom } as any}
                                    >
                                        {roundNums.map((round) => {
                                            const roundMatches = matches.filter(m => m.round === round).sort((a, b) => a.matchNumber - b.matchNumber)
                                            const spacingMultiplier = Math.pow(2, round - 1)
                                            const cellHeight = spacingMultiplier * 90

                                            return (
                                                <div key={round} className="flex flex-col w-64">
                                                    <div className="bracket-round-header text-xs font-black uppercase tracking-[0.2em] text-white/30 text-center mb-8 border-b border-white/10 pb-4">
                                                        {roundLabel(round, maxRound)}
                                                    </div>
                                                    <div className="flex flex-col justify-around h-full">
                                                        {roundMatches.map(m => (
                                                            <div
                                                                key={m.id}
                                                                className="relative flex items-center justify-center"
                                                                style={{ height: cellHeight }}
                                                            >
                                                                <BracketMatchCard
                                                                    match={m}
                                                                    onClick={() => openScoreModal(m)}
                                                                    round={round}
                                                                    maxRound={maxRound}
                                                                    cellHeight={cellHeight}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })()}
                        </div>
                        {/* Scroll hint — hidden in print */}
                        <p className="no-print text-center text-white/20 text-xs mt-2 animate-pulse">
                            ← scroll to see all rounds including Final →
                        </p>
                    </>
                )}

                {tab === 'fixtures' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {isKnockout ? (
                            roundNums.map(round => (
                                <div key={round} className="flex-1 min-w-[240px] print:min-w-[150px] flex flex-col items-center">
                                    <h3 className="font-bold text-white/30 tracking-[0.2em] mb-8 text-sm uppercase print:!text-black">
                                        {round === maxRound ? 'Final' : round === maxRound - 1 ? 'Semi-Finals' : round === maxRound - 2 ? 'Quarter-Finals' : `Round ${round}`}
                                    </h3>
                                    <FixtureList matches={matches.filter(m => m.round === round && !m.isBye)} onClick={openScoreModal} />
                                </div>
                            ))
                        ) : pools.length > 1 ? (
                            pools.map(pool => (
                                <div key={pool} className="glass-card p-6">
                                    <h3 className="text-lg font-bold text-secondary uppercase tracking-wider mb-4 flex items-center gap-3 border-b border-white/10 pb-4">
                                        Pool {pool}
                                    </h3>
                                    <FixtureList matches={matches.filter(m => m.pool === pool)} onClick={openScoreModal} />
                                </div>
                            ))
                        ) : (
                            <div className="glass-card p-6 max-w-2xl">
                                <FixtureList matches={matches} onClick={openScoreModal} />
                            </div>
                        )}
                    </div>
                )}

                {!isKnockout && tab === 'table' && (
                    <div className="space-y-12">
                        {pools.map(pool => {
                            const poolPlayers = tournament.tournamentPlayers
                                .filter(tp => numPools <= 1 || tp.pool === pool)
                                .map(tp => ({ id: tp.playerId, name: tp.playerName }))
                            const rows = calculateLeagueTable(poolPlayers, matches, numPools > 1 ? pool : undefined)
                            return (
                                <div key={pool} className="glass-card overflow-hidden">
                                    {numPools > 1 && (
                                        <div className="bg-secondary/10 px-6 py-4 border-b border-white/5">
                                            <h3 className="text-lg font-bold text-secondary uppercase tracking-wider">Pool {pool}</h3>
                                        </div>
                                    )}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[700px]">
                                            <thead>
                                                <tr className="bg-white/5 text-xs font-semibold text-white/50 uppercase tracking-widest">
                                                    <th className="px-6 py-4 border-b border-white/5 w-16 text-center">Rnk</th>
                                                    <th className="px-6 py-4 border-b border-white/5">Player/Team</th>
                                                    <th className="px-3 py-4 border-b border-white/5 text-center">MP</th>
                                                    <th className="px-3 py-4 border-b border-white/5 text-center text-primary">W</th>
                                                    <th className="px-3 py-4 border-b border-white/5 text-center text-red-400">L</th>
                                                    <th className="px-3 py-4 border-b border-white/5 text-center">SF</th>
                                                    <th className="px-3 py-4 border-b border-white/5 text-center">SA</th>
                                                    <th className="px-3 py-4 border-b border-white/5 text-center">+/-</th>
                                                    <th className="px-6 py-4 border-b border-white/5 text-right text-secondary font-bold">PTS</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 text-sm">
                                                {rows.map((row, i) => (
                                                    <tr key={row.playerId} className={`hover:bg-white/[0.02] transition-colors ${i === 0 ? 'bg-primary/5' : ''}`}>
                                                        <td className="px-6 py-4 text-center font-bold font-['Outfit'] text-lg text-white/40">
                                                            {i === 0 ? <span className="text-primary">1</span> : i + 1}
                                                        </td>
                                                        <td className={`px-6 py-4 font-semibold ${i === 0 ? 'text-primary' : 'text-white'}`}>{row.playerName}</td>
                                                        <td className="px-3 py-4 text-center text-white/70">{row.played}</td>
                                                        <td className="px-3 py-4 text-center font-medium text-primary/80">{row.won}</td>
                                                        <td className="px-3 py-4 text-center font-medium text-red-400/80">{row.lost}</td>
                                                        <td className="px-3 py-4 text-center text-white/50">{row.setsFor}</td>
                                                        <td className="px-3 py-4 text-center text-white/50">{row.setsAgainst}</td>
                                                        <td className={`px-3 py-4 text-center font-bold ${row.setDiff > 0 ? 'text-primary' : row.setDiff < 0 ? 'text-destructive' : 'text-white/50'}`}>
                                                            {row.setDiff > 0 ? '+' : ''}{row.setDiff}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-black font-['Outfit'] text-xl text-secondary">{row.points}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>

            <AnimatePresence>
                {scoreModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setScoreModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-md bg-[#111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex items-center justify-between">
                                <h3 className="font-bold text-white font-['Outfit'] text-lg flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-primary" />
                                    Enter Score
                                </h3>
                                <button onClick={() => setScoreModal(null)} className="text-white/40 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-8">
                                <div className="flex items-center justify-between gap-6">
                                    {/* Player 1 */}
                                    <div className="flex-1 text-center">
                                        <div className="font-semibold text-white/80 mb-4 h-12 flex items-center justify-center leading-tight">
                                            {scoreModal.match.player1Name}
                                        </div>
                                        <input
                                            type="number"
                                            className="w-full h-20 text-center text-4xl font-black font-['Outfit'] bg-black border-2 border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all shadow-inner"
                                            min={0}
                                            value={s1}
                                            onChange={e => setS1(e.target.value)}
                                            autoFocus
                                        />
                                    </div>

                                    <div className="text-sm font-black text-white/30 uppercase tracking-widest mt-12">VS</div>

                                    {/* Player 2 */}
                                    <div className="flex-1 text-center">
                                        <div className="font-semibold text-white/80 mb-4 h-12 flex items-center justify-center leading-tight">
                                            {scoreModal.match.player2Name}
                                        </div>
                                        <input
                                            type="number"
                                            className="w-full h-20 text-center text-4xl font-black font-['Outfit'] bg-black border-2 border-white/10 rounded-2xl text-white focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/20 transition-all shadow-inner"
                                            min={0}
                                            value={s2}
                                            onChange={e => setS2(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-white/5 border-t border-white/5 flex gap-3">
                                <button onClick={() => setScoreModal(null)} className="flex-1 py-3 rounded-xl font-semibold text-white/60 bg-white/5 hover:bg-white/10 hover:text-white transition-colors border border-white/5">
                                    Cancel
                                </button>
                                <button
                                    onClick={saveScore}
                                    disabled={saving || s1 === '' || s2 === ''}
                                    className="flex-1 py-3 rounded-xl font-bold bg-primary hover:bg-[#2563eb] text-white disabled:opacity-50 transition-colors shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />} Save
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function CheckCircle2(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}

function BracketMatchCard({ match, onClick, round, maxRound, cellHeight }: { match: Match; onClick: () => void; round: number; maxRound: number; cellHeight: number }) {
    const isReady = !match.winnerId && !match.isBye && match.player1Id && match.player2Id
    const isCompleted = match.winnerId || match.isBye
    const showConnector = round < maxRound
    const connectorHeight = cellHeight / 2

    return (
        <div className="relative w-full z-10 flex group bracket-match-card" onClick={onClick} style={{ cursor: isReady ? 'pointer' : 'default' }}>
            <div className={`w-full rounded-xl overflow-hidden border transition-all duration-300 relative z-20
                ${isCompleted ? 'glass' : isReady ? 'bg-primary/5 border-primary/50 shadow-[0_0_15px_-5px_rgba(59,130,246,0.4)] group-hover:bg-primary/10 hover:-translate-y-1' : 'bg-black/50 border-white/5'}`}
            >
                <BracketPlayerRow name={match.player1Name} score={match.score1} isWinner={match.winnerId === match.player1Id} isLoser={!!match.winnerId && match.winnerId !== match.player1Id} isBye={match.isBye} />
                <div className="h-px w-full bracket-divider" style={{ borderBottom: '1px solid #ddd' }} />
                <BracketPlayerRow name={match.player2Name} score={match.score2} isWinner={match.winnerId === match.player2Id} isLoser={!!match.winnerId && match.winnerId !== match.player2Id} isBye={match.isBye && !match.player2Name} isByeIndicator={match.isBye && !match.player2Name} />
            </div>

            {/* SVG Connectors to the next round */}
            {showConnector && (
                <div className="absolute left-full top-1/2 w-16 -translate-y-1/2 pointer-events-none z-0">
                    <svg className="w-full overflow-visible" height={connectorHeight} style={{ position: 'absolute', top: match.matchNumber % 2 !== 0 ? 0 : -connectorHeight }}>
                        {match.matchNumber % 2 !== 0 ? (
                            <path d={`M 0 0 L 32 0 L 32 ${connectorHeight} L 64 ${connectorHeight}`} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        ) : (
                            <path d={`M 0 ${connectorHeight} L 32 ${connectorHeight} L 32 0 L 64 0`} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        )}
                    </svg>
                </div>
            )}
        </div>
    )
}

function BracketPlayerRow({ name, score, isWinner, isLoser, isBye, isByeIndicator }: { name: string | null, score: number | null, isWinner: boolean | null, isLoser: boolean | null, isBye?: boolean, isByeIndicator?: boolean }) {
    if (isByeIndicator) return (
        <div className="bracket-bye flex items-center px-3 py-1 bg-white/[0.02] text-white/30">
            <span className="text-xs font-bold tracking-widest uppercase">BYE</span>
        </div>
    )

    return (
        <div className={`bracket-player flex items-center justify-between px-3 py-2 transition-colors ${isWinner ? 'bracket-player-winner bg-primary/10' : ''}`}>
            <span className={`bracket-player-name font-medium truncate pr-2 ${isWinner ? 'text-primary font-bold' : isLoser ? 'text-white/30' : name ? 'text-white/80' : 'text-white/30'}`}>
                {name || 'TBD'}
            </span>
            {score != null && (
                <span className={`bracket-player-score font-black font-['Outfit'] ${isWinner ? 'text-primary' : isLoser ? 'text-white/30' : 'text-white'}`}>
                    {score}
                </span>
            )}
        </div>
    )
}

function FixtureList({ matches, onClick }: { matches: Match[], onClick: (m: Match) => void }) {
    if (matches.length === 0) return <div className="text-white/30 py-4 text-sm font-medium">No fixtures generated.</div>

    return (
        <div className="space-y-3">
            {matches.map(m => {
                const isReady = m.player1Id && m.player2Id && !m.winnerId
                return (
                    <div
                        key={m.id}
                        className={`group relative overflow-hidden flex items-center justify-between p-4 rounded-xl border transition-all duration-300
                            ${m.winnerId ? 'bg-white/5 border-white/10' : isReady ? 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/5 cursor-pointer hover:-translate-y-0.5' : 'bg-black/50 border-white/5 opacity-50'}`}
                        onClick={() => isReady && onClick(m)}
                    >
                        {isReady && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />}

                        <div className={`flex-1 font-semibold truncate ${m.winnerId === m.player1Id ? 'text-primary' : 'text-white/80'}`}>
                            {m.player1Name || 'TBD'}
                        </div>

                        <div className="flex-1 flex justify-center items-center gap-3 relative z-10">
                            {m.score1 != null && m.score2 != null ? (
                                <div className="flex items-center gap-3 bg-black/50 px-4 py-1.5 rounded-full border border-white/5">
                                    <span className="font-bold text-lg text-white font-['Outfit']">{m.score1}</span>
                                    <span className="w-1 h-1 rounded-full bg-white/30" />
                                    <span className="font-bold text-lg text-white font-['Outfit']">{m.score2}</span>
                                </div>
                            ) : (
                                <span className="text-xs font-bold text-white/20 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">VS</span>
                            )}
                        </div>

                        <div className={`flex-1 font-semibold truncate text-right ${m.winnerId === m.player2Id ? 'text-primary' : 'text-white/80'}`}>
                            {m.player2Name || 'TBD'}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
