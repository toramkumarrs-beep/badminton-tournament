'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Users, ArrowLeft, Printer, Trash2, Loader2, X, Hash, Pencil, RotateCcw, ZoomIn, ZoomOut, Maximize2, FileText, Share2, ChevronDown, ChevronUp } from 'lucide-react'
import { calculateLeagueTable, calculateH2HMatrix, getQualificationStatus } from '@/lib/bracketEngine'

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

interface ScoreModal { match: Match }

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
    const [tab, setTab] = useState<'bracket' | 'fixtures' | 'table' | 'h2h'>('bracket')
    const [scoreModal, setScoreModal] = useState<ScoreModal | null>(null)
    const [pdfModal, setPdfModal] = useState(false)
    const [s1, setS1] = useState('')
    const [s2, setS2] = useState('')
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState('')
    const [bracketZoom, setBracketZoom] = useState(100)
    const [activeRound, setActiveRound] = useState<number | null>(null)
    const [pdfFormat, setPdfFormat] = useState<'landscape-a4' | 'eco-mono'>('landscape-a4')
    const [pdfDispatchOpen, setPdfDispatchOpen] = useState(true)

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

    const resetScore = async () => {
        if (!scoreModal) return
        if (!confirm('Reset this match? This will clear the score and any subsequent round advancements.')) return
        const m = scoreModal.match
        setSaving(true)
        await fetch(`/api/matches/${m.id}/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score1: null, score2: null, winnerId: null, winnerName: null }),
        })
        setSaving(false)
        setScoreModal(null)
        showToast('Match reset!')
        await fetch_()
    }

    const deleteTournament = async () => {
        if (!confirm(`Delete "${tournament?.name}"? This cannot be undone.`)) return
        await fetch(`/api/tournaments/${id}`, { method: 'DELETE' })
        router.push('/')
    }

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f131c]">
            <Loader2 className="w-10 h-10 animate-spin text-[#4cd7f6] mb-4" />
            <div className="text-white/50 animate-pulse font-medium">Loading Arena...</div>
        </div>
    )

    if (!tournament) return null

    const isKnockout = tournament.type === 'knockout'
    const matches = tournament.matches
    const players = tournament.tournamentPlayers.map(tp => ({ id: tp.playerId, name: tp.playerName }))
    const maxRound = Math.max(...matches.map(m => m.round), 1)
    const roundNums = Array.from({ length: maxRound }, (_, i) => i + 1)
    const numPools = tournament.poolCount
    const pools = Array.from({ length: numPools }, (_, pi) => pi + 1)
    const completedMatches = matches.filter(m => m.winnerId || m.isBye).length
    const pendingMatches = matches.filter(m => !m.winnerId && !m.isBye && m.player1Id && m.player2Id).length

    // Default to first available tab
    const availableTabs = [
        ...(isKnockout ? ['bracket'] : []),
        'fixtures',
        ...(!isKnockout ? ['table', 'h2h'] : []),
    ] as const

    return (
        <div className="min-h-screen flex flex-col font-sans bg-[#0f131c]">
            <style>{`
                @media print {
                    * { box-shadow: none !important; backdrop-filter: none !important; animation: none !important; transition: none !important; }
                    .no-print { display: none !important; }
                    .print-show { display: block !important; }
                    nav, header { display: none !important; }
                    .overflow-x-auto { overflow: visible !important; }
                    .min-h-screen { min-height: auto !important; }
                    main { padding: 0 !important; max-width: 100% !important; }
                    .bracket-print-container { zoom: var(--pz, 0.65); gap: 28px !important; padding: 0 !important; }
                    .bracket-round-header { color: #444 !important; border-bottom: 1px solid #ccc !important; font-size: 9px !important; margin-bottom: 6px !important; }
                    .bracket-match-card { border: 1px solid #ccc !important; background-color: white !important; border-radius: 4px !important; }
                    .bracket-match-card > div { background-color: white !important; border: none !important; }
                    .bracket-player { display: flex !important; align-items: center !important; justify-content: space-between !important; padding: 2px 6px !important; height: 22px !important; background-color: white !important; }
                    .bracket-player-winner { background-color: #f0fff4 !important; }
                    .bracket-player-name { color: #111 !important; font-size: 9px !important; }
                    .bracket-player-score { color: #111 !important; font-size: 9px !important; font-weight: bold !important; }
                    .bracket-bye { display: flex !important; align-items: center !important; padding: 2px 6px !important; height: 22px !important; background-color: #f5f5f5 !important; }
                    .bracket-bye span { color: #bbb !important; font-size: 8px !important; }
                    .bracket-divider { height: 0 !important; border-bottom: 1px solid #ddd !important; display: block !important; }
                    svg path, svg line { stroke: #bbb !important; }
                    #bwf-print-sheet { display: block !important; }
                    #bwf-print-sheet * { color: #111 !important; background-color: white !important; border-color: #ccc !important; }
                }
                .snap-x { scroll-snap-type: x mandatory; }
                .snap-center { scroll-snap-align: center; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .pb-safe { padding-bottom: env(safe-area-inset-bottom, 0px); }
                .pt-safe { padding-top: env(safe-area-inset-top, 0px); }
            `}</style>

            {/* ── Navbar ── */}
            <header className="sticky top-0 z-40 bg-[#131A26]/90 backdrop-blur-xl border-b border-[#334155]/60 no-print">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-lg bg-[#1E293B] border border-[#4cd7f6]/30 flex items-center justify-center text-[#4cd7f6] group-hover:border-[#4cd7f6] group-hover:shadow-[0_0_12px_rgba(76,215,246,0.35)] transition-all">
                            <Trophy className="w-5 h-5" />
                        </div>
                        <span className="font-extrabold text-xl tracking-tight text-white font-['Outfit'] hidden sm:block">
                            Shuttle<span className="text-[#4cd7f6]">Court</span>
                        </span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Link href="/" className="px-3.5 py-1.5 rounded-lg text-sm font-semibold text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" /> Console
                        </Link>
                        <div className="w-px h-6 bg-[#334155] mx-1" />
                        <button onClick={() => setPdfModal(true)} className="p-2 rounded-lg text-[#94A3B8] hover:text-[#4cd7f6] hover:bg-[#1E293B] transition-colors" title="PDF Export">
                            <FileText className="w-5 h-5" />
                        </button>
                        <button onClick={() => window.print()} className="p-2 rounded-lg text-[#94A3B8] hover:text-[#4cd7f6] hover:bg-[#1E293B] transition-colors" title="Print Bracket">
                            <Printer className="w-5 h-5" />
                        </button>
                        <button onClick={deleteTournament} className="p-2 rounded-lg text-[#94A3B8] hover:text-red-400 hover:bg-red-400/10 transition-colors" title="Delete Tournament">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Toast ── */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl bg-[#131A26] backdrop-blur-md border border-[#4cd7f6]/40 text-[#4cd7f6] font-bold shadow-[0_0_30px_-5px_rgba(76,215,246,0.4)] no-print text-sm">
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 print:py-0 print:px-0 pb-24 lg:pb-8">

                {/* ── Arena Header ── */}
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start mb-6 no-print">
                    <div>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
                            <span className="text-xs uppercase tracking-widest text-[#4cd7f6] font-bold">Arena Central</span>
                        </motion.div>
                        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-['Outfit'] mb-3">
                            {tournament.name}
                        </motion.h1>
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-2">
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 ${isKnockout ? 'bg-[#4cd7f6]/15 text-[#4cd7f6] border-[#4cd7f6]/30' : 'bg-[#4edea3]/15 text-[#4edea3] border-[#4edea3]/30'}`}>
                                {isKnockout ? <Trophy className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                                {isKnockout ? 'Single Knockout' : 'League Round-Robin'}
                            </span>
                            <span className="px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-[#131A26] text-[#dfe2ee] border border-[#334155]">
                                {tournament.tournamentPlayers.length} Athletes
                            </span>
                            {!isKnockout && numPools > 1 && (
                                <span className="px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-[#131A26] text-[#dfe2ee] border border-[#334155] flex items-center gap-1.5">
                                    <Hash className="w-3.5 h-3.5 text-[#4edea3]" /> {numPools} Pools
                                </span>
                            )}
                        </motion.div>
                    </div>

                    {/* ── Stats Grid ── */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3 w-full md:w-auto mt-2">
                        {[
                            { label: 'Done', value: completedMatches, color: 'text-white' },
                            { label: 'Pending', value: pendingMatches, color: 'text-[#4edea3]' },
                            { label: 'Total', value: matches.length, color: 'text-[#4cd7f6]' },
                        ].map(s => (
                            <div key={s.label} className="rounded-2xl bg-[#131A26] border border-[#334155] p-4 text-center min-w-[95px] shadow-lg">
                                <div className={`text-3xl font-extrabold mb-1 font-['Outfit'] ${s.color}`}>{s.value}</div>
                                <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">{s.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* ── Tab Bar ── */}
                <div className="flex gap-1.5 p-1.5 bg-[#131A26] rounded-xl border border-[#334155] w-fit mb-6 no-print mx-auto sm:mx-0 shadow-inner overflow-x-auto no-scrollbar">
                    {isKnockout && (
                        <TabBtn active={tab === 'bracket'} onClick={() => setTab('bracket')}>Bracket</TabBtn>
                    )}
                    <TabBtn active={tab === 'fixtures'} onClick={() => setTab('fixtures')}>Fixtures</TabBtn>
                    {!isKnockout && (
                        <>
                            <TabBtn active={tab === 'table'} onClick={() => setTab('table')}>Standings</TabBtn>
                            <TabBtn active={tab === 'h2h'} onClick={() => setTab('h2h')}>Head-to-Head</TabBtn>
                        </>
                    )}
                </div>

                {/* ══════════ BRACKET TAB ══════════ */}
                {isKnockout && tab === 'bracket' && (
                    <>
                        {/* Zoom Controls */}
                        <div className="no-print flex flex-wrap items-center gap-2 mb-4 p-3 bg-[#131A26] rounded-xl border border-[#334155]">
                            {/* Round pills */}
                            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1">
                                <button
                                    onClick={() => setActiveRound(null)}
                                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeRound === null ? 'bg-[#4cd7f6] text-[#003640]' : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'}`}>
                                    All Rounds
                                </button>
                                {roundNums.map(r => (
                                    <button key={r}
                                        onClick={() => setActiveRound(r)}
                                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${activeRound === r ? 'bg-[#4cd7f6] text-[#003640]' : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'}`}>
                                        {roundLabel(r, maxRound)}
                                        {matches.filter(m => m.round === r && !m.winnerId && !m.isBye && m.player1Id && m.player2Id).length > 0 && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
                                        )}
                                    </button>
                                ))}
                            </div>
                            {/* Zoom */}
                            <div className="flex items-center gap-1 bg-[#0a0e16] rounded-lg p-0.5">
                                <button onClick={() => setBracketZoom(z => Math.max(60, z - 10))}
                                    className="w-8 h-8 rounded flex items-center justify-center hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#4cd7f6] transition-colors">
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <span className="px-3 text-sm font-bold text-white font-mono">{bracketZoom}%</span>
                                <button onClick={() => setBracketZoom(z => Math.min(150, z + 10))}
                                    className="w-8 h-8 rounded flex items-center justify-center hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#4cd7f6] transition-colors">
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                            </div>
                            <button onClick={() => setBracketZoom(100)}
                                className="px-3 py-1.5 rounded-lg bg-[#1E293B] text-[#94A3B8] hover:text-white text-xs font-semibold transition-colors flex items-center gap-1">
                                <Maximize2 className="w-3.5 h-3.5" /> Fit View
                            </button>
                        </div>

                        {/* Bracket Canvas */}
                        <div className="w-full overflow-x-auto pb-4 print:overflow-visible" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
                            {(() => {
                                const visibleRounds = activeRound !== null ? [activeRound] : roundNums
                                const numRounds = visibleRounds.length
                                const colW = 256; const gapW = 64
                                const totalW = numRounds * colW + Math.max(0, numRounds - 1) * gapW
                                const printZoom = Math.min(1, Math.floor((820 / totalW) * 100) / 100)
                                return (
                                    <div className="flex gap-16 min-w-max p-4 print:p-0 bracket-print-container"
                                        style={{ '--pz': printZoom, transform: `scale(${bracketZoom / 100})`, transformOrigin: 'top left' } as any}>
                                        {visibleRounds.map((round) => {
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
                                                            <div key={m.id} className="relative flex items-center justify-center" style={{ height: cellHeight }}>
                                                                <BracketMatchCard match={m} onClick={() => openScoreModal(m)} round={round} maxRound={maxRound} cellHeight={cellHeight} />
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
                        <p className="no-print text-center text-white/20 text-xs mt-2 animate-pulse">
                            ← scroll to see all rounds including Final →
                        </p>
                    </>
                )}

                {/* ══════════ FIXTURES TAB ══════════ */}
                {tab === 'fixtures' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {isKnockout ? (
                            roundNums.map(round => (
                                <div key={round} className="rounded-2xl bg-[#131A26] border border-[#334155] p-5 shadow-xl">
                                    <h3 className="font-bold text-[#94A3B8]/60 tracking-[0.15em] mb-5 text-xs uppercase flex items-center gap-2">
                                        {roundLabel(round, maxRound)}
                                        <span className="flex-1 h-px bg-[#334155]" />
                                        <span className="text-[#4edea3] font-mono">
                                            {matches.filter(m => m.round === round && (m.winnerId || m.isBye)).length}/{matches.filter(m => m.round === round).length}
                                        </span>
                                    </h3>
                                    <FixtureList matches={matches.filter(m => m.round === round && !m.isBye)} onClick={openScoreModal} />
                                </div>
                            ))
                        ) : pools.length > 1 ? (
                            pools.map(pool => (
                                <div key={pool} className="rounded-2xl bg-[#131A26] border border-[#334155] p-5 shadow-xl">
                                    <h3 className="text-sm font-bold text-[#4edea3] uppercase tracking-wider mb-4 flex items-center gap-3 border-b border-[#334155] pb-4 font-['Outfit']">
                                        Pool {pool} Fixtures
                                    </h3>
                                    <FixtureList matches={matches.filter(m => m.pool === pool)} onClick={openScoreModal} />
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full rounded-2xl bg-[#131A26] border border-[#334155] p-5 shadow-xl">
                                <FixtureList matches={matches} onClick={openScoreModal} />
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════ STANDINGS TAB ══════════ */}
                {!isKnockout && tab === 'table' && (
                    <div className="space-y-10">
                        {pools.map(pool => {
                            const poolPlayers = tournament.tournamentPlayers
                                .filter(tp => numPools <= 1 || tp.pool === pool)
                                .map(tp => ({ id: tp.playerId, name: tp.playerName }))
                            const rows = calculateLeagueTable(poolPlayers, matches, numPools > 1 ? pool : undefined)
                            const rowsWithStatus = getQualificationStatus(rows, 2)
                            return (
                                <div key={pool} className="rounded-2xl bg-[#131A26] border border-[#334155] overflow-hidden shadow-xl">
                                    {numPools > 1 && (
                                        <div className="bg-[#1E293B] px-6 py-4 border-b border-[#334155] flex items-center justify-between">
                                            <h3 className="text-base font-bold text-[#4edea3] uppercase tracking-wider font-['Outfit']">Pool {pool} Standings</h3>
                                            <span className="text-xs text-[#94A3B8]">Rank by points → set diff → name</span>
                                        </div>
                                    )}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[640px]">
                                            <thead>
                                                <tr className="bg-[#1E293B] text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
                                                    <th className="px-4 py-4 border-b border-[#334155] w-12 text-center">Pos</th>
                                                    <th className="px-4 py-4 border-b border-[#334155]">Athlete / Team</th>
                                                    <th className="px-3 py-4 border-b border-[#334155] text-center">MP</th>
                                                    <th className="px-3 py-4 border-b border-[#334155] text-center text-[#4edea3]">W</th>
                                                    <th className="px-3 py-4 border-b border-[#334155] text-center text-[#EF4444]">L</th>
                                                    <th className="px-3 py-4 border-b border-[#334155] text-center">SF</th>
                                                    <th className="px-3 py-4 border-b border-[#334155] text-center">SA</th>
                                                    <th className="px-3 py-4 border-b border-[#334155] text-center">+/-</th>
                                                    <th className="px-4 py-4 border-b border-[#334155] text-right text-[#4edea3] font-extrabold">PTS</th>
                                                    <th className="px-4 py-4 border-b border-[#334155] text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#334155]/60 text-sm">
                                                {rowsWithStatus.map((row, i) => (
                                                    <tr key={row.playerId} className={`hover:bg-[#181f2d] transition-colors ${row.status === 'QUALIFIED' ? 'bg-[#4edea3]/5' : ''}`}>
                                                        <td className="px-4 py-3.5 text-center">
                                                            {i === 0 ? (
                                                                <span className="w-6 h-6 rounded-md bg-[#4edea3] text-[#003824] font-bold text-xs flex items-center justify-center shadow-sm">1</span>
                                                            ) : (
                                                                <span className="w-6 h-6 rounded-md bg-[#1E293B] text-[#94A3B8] font-bold text-xs flex items-center justify-center">{i + 1}</span>
                                                            )}
                                                        </td>
                                                        <td className={`px-4 py-3.5 font-semibold ${i === 0 ? 'text-[#4cd7f6]' : 'text-white'}`}>{row.playerName}</td>
                                                        <td className="px-3 py-3.5 text-center text-[#94A3B8]">{row.played}</td>
                                                        <td className="px-3 py-3.5 text-center font-bold text-[#4edea3]">{row.won}</td>
                                                        <td className="px-3 py-3.5 text-center font-medium text-red-400/90">{row.lost}</td>
                                                        <td className="px-3 py-3.5 text-center text-[#94A3B8]">{row.setsFor}</td>
                                                        <td className="px-3 py-3.5 text-center text-[#94A3B8]">{row.setsAgainst}</td>
                                                        <td className={`px-3 py-3.5 text-center font-bold ${row.setDiff > 0 ? 'text-[#4edea3]' : row.setDiff < 0 ? 'text-red-400' : 'text-[#94A3B8]'}`}>
                                                            {row.setDiff > 0 ? '+' : ''}{row.setDiff}
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right font-black font-['Outfit'] text-xl text-[#4edea3]">{row.points}</td>
                                                        <td className="px-4 py-3.5 text-right">
                                                            {row.status === 'QUALIFIED' && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#4edea3]/20 text-[#4edea3] text-[10px] font-bold uppercase">✓ QF</span>
                                                            )}
                                                            {row.status === 'IN_CONTENTION' && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffb95f]/20 text-[#ffb95f] text-[10px] font-bold uppercase">~ Contention</span>
                                                            )}
                                                            {row.status === 'ELIMINATED' && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#334155] text-[#94A3B8] text-[10px] font-bold uppercase">✕ Eliminated</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Tie-break legend */}
                                    <div className="px-6 py-3 border-t border-[#334155] bg-[#0a0e16]/50">
                                        <p className="text-xs text-[#94A3B8]">
                                            <span className="text-[#4edea3] font-bold">Tie-Break order:</span> 1. Head-to-Head result  2. Set Differential  3. Player Name
                                        </p>
                                    </div>
                                </div>
                            )
                        })}

                        {/* BWF Tie-Break Decision Engine Card */}
                        <div className="rounded-2xl bg-[#131A26] border border-[#334155] p-6 shadow-xl">
                            <div className="flex items-center gap-2 text-[#4cd7f6] font-bold uppercase tracking-wider text-xs mb-3">
                                <span>⚖</span> BWF Tie-Break Decision Protocol
                            </div>
                            <h3 className="font-bold text-white text-lg font-['Outfit'] mb-2">Resolution Protocol</h3>
                            <p className="text-sm text-[#94A3B8] mb-4">When 2 or more players finish with equal wins, the system resolves automatically:</p>
                            <div className="space-y-2">
                                {[
                                    { n: 1, color: 'text-[#4cd7f6]', label: 'Head-to-Head', desc: 'Result of the match played directly between the tied players.' },
                                    { n: 2, color: 'text-[#4edea3]', label: 'Set Differential', desc: 'Total Sets Won minus Total Sets Lost across all pool matches.' },
                                    { n: 3, color: 'text-[#ffb95f]', label: 'Point Differential', desc: 'Total points scored minus total points conceded across all pool sets.' },
                                ].map(item => (
                                    <div key={item.n} className="flex items-start gap-3 p-3 rounded-lg bg-[#0a0e16]">
                                        <span className={`w-5 h-5 rounded-full bg-[#1E293B] ${item.color} text-xs flex items-center justify-center font-bold flex-shrink-0`}>{item.n}</span>
                                        <div className="text-sm">
                                            <span className="text-white font-semibold">{item.label}: </span>
                                            <span className="text-[#94A3B8]">{item.desc}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════ HEAD-TO-HEAD TAB ══════════ */}
                {!isKnockout && tab === 'h2h' && (
                    <div className="space-y-8">
                        {pools.map(pool => {
                            const poolPlayers = tournament.tournamentPlayers
                                .filter(tp => numPools <= 1 || tp.pool === pool)
                                .map(tp => ({ id: tp.playerId, name: tp.playerName }))
                            const poolMatches = numPools > 1 ? matches.filter(m => m.pool === pool) : matches
                            const matrix = calculateH2HMatrix(poolPlayers, poolMatches)
                            return (
                                <div key={pool} className="rounded-2xl bg-[#131A26] border border-[#334155] p-5 shadow-xl">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                        <div>
                                            <h3 className="font-bold text-white text-lg font-['Outfit']">
                                                {numPools > 1 ? `Pool ${pool} ` : ''}Head-to-Head Cross Table
                                            </h3>
                                            <p className="text-xs text-[#94A3B8] mt-0.5">Direct match intersections for tie-break resolution</p>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#4edea3]/30" /> Won</span>
                                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-500/20" /> Lost</span>
                                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#4cd7f6]/20" /> Pending</span>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <div className="min-w-[500px]">
                                            {/* Header row */}
                                            <div className="grid gap-2 mb-2 text-center font-bold text-xs text-[#94A3B8] uppercase" style={{ gridTemplateColumns: `160px repeat(${poolPlayers.length}, 1fr)` }}>
                                                <div className="p-2 text-left bg-[#0a0e16]/50 rounded-lg">PAIR</div>
                                                {poolPlayers.map(p => (
                                                    <div key={p.id} className="p-2 bg-[#1E293B] rounded-lg truncate text-white">{p.name.split(' ')[0]}</div>
                                                ))}
                                            </div>
                                            {/* Data rows */}
                                            {poolPlayers.map((rowPlayer, ri) => {
                                                const rowData = matrix.get(rowPlayer.id)
                                                return (
                                                    <div key={rowPlayer.id} className="grid gap-2 mb-2" style={{ gridTemplateColumns: `160px repeat(${poolPlayers.length}, 1fr)` }}>
                                                        <div className="p-3 text-left bg-[#1E293B] rounded-lg flex items-center gap-2">
                                                            <span className="w-5 h-5 rounded bg-[#0a0e16] text-[#94A3B8] text-[10px] flex items-center justify-center font-bold">{ri + 1}</span>
                                                            <span className="font-bold text-white text-xs truncate">{rowPlayer.name}</span>
                                                        </div>
                                                        {poolPlayers.map(colPlayer => {
                                                            const cell = rowData?.get(colPlayer.id)
                                                            if (!cell || cell.outcome === 'SELF') {
                                                                return <div key={colPlayer.id} className="p-3 bg-[#0a0e16] rounded-lg flex items-center justify-center text-[#334155] font-bold text-sm">—</div>
                                                            }
                                                            const bgClass = cell.outcome === 'WON' ? 'bg-[#4edea3]/15 hover:bg-[#4edea3]/25' : cell.outcome === 'LOST' ? 'bg-red-500/10 hover:bg-red-500/20' : 'bg-[#4cd7f6]/10'
                                                            const textClass = cell.outcome === 'WON' ? 'text-[#4edea3]' : cell.outcome === 'LOST' ? 'text-red-400' : 'text-[#4cd7f6]'
                                                            return (
                                                                <div key={colPlayer.id} className={`p-2 ${bgClass} rounded-lg flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform`}
                                                                    onClick={() => cell.matchId && openScoreModal(matches.find(m => m.id === cell.matchId)!)}>
                                                                    <span className={`${textClass} font-bold text-[10px] uppercase tracking-wider`}>
                                                                        {cell.outcome === 'SCHEDULED' ? 'TBD' : cell.outcome}
                                                                    </span>
                                                                    {cell.outcome !== 'SCHEDULED' && (
                                                                        <span className="text-white text-[10px] font-semibold mt-0.5">{cell.setScore}</span>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    {/* Legend footnote */}
                                    <p className="text-xs text-[#94A3B8] mt-3 border-t border-[#334155] pt-3">
                                        Click any completed cell to edit the match score. Tie-break resolution uses this matrix first.
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>

            {/* ══════════ MOBILE BOTTOM NAV ══════════ */}
            <nav className="lg:hidden fixed bottom-0 w-full z-40 pb-safe bg-[#131A26]/90 backdrop-blur-xl border-t border-[#334155]/60 no-print">
                <div className="flex justify-around items-center h-16 px-2">
                    {[
                        { label: 'Bracket', tab: 'bracket' as const, show: isKnockout, icon: '⊞' },
                        { label: 'Fixtures', tab: 'fixtures' as const, show: true, icon: '≡' },
                        { label: 'Standings', tab: 'table' as const, show: !isKnockout, icon: '▦' },
                        { label: 'H2H', tab: 'h2h' as const, show: !isKnockout, icon: '⇄' },
                    ].filter(t => t.show).map(t => (
                        <button key={t.tab} onClick={() => setTab(t.tab)}
                            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-11 transition-all relative ${tab === t.tab ? 'text-[#4cd7f6]' : 'text-[#94A3B8] hover:text-white'}`}>
                            <span className="text-lg">{t.icon}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider">{t.label}</span>
                            {tab === t.tab && <span className="absolute bottom-0.5 w-8 h-0.5 bg-[#4cd7f6] rounded-full" />}
                        </button>
                    ))}
                    <button onClick={() => setPdfModal(true)}
                        className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-11 text-[#94A3B8] hover:text-[#4cd7f6] transition-all">
                        <span className="text-lg">⎙</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">PDF</span>
                    </button>
                </div>
            </nav>

            {/* ══════════ SCORE MODAL ══════════ */}
            <AnimatePresence>
                {scoreModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f131c]/80 backdrop-blur-md"
                        onClick={() => setScoreModal(null)}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-md bg-[#131A26] border border-[#334155] rounded-3xl shadow-2xl overflow-hidden">
                            <div className="bg-[#1E293B] px-6 py-4 border-b border-[#334155] flex items-center justify-between">
                                <h3 className="font-bold text-white font-['Outfit'] text-lg flex items-center gap-2">
                                    {scoreModal.match.winnerId ? <Pencil className="w-5 h-5 text-[#4cd7f6]" /> : <Trophy className="w-5 h-5 text-[#4cd7f6]" />}
                                    {scoreModal.match.winnerId ? 'Edit Match Score' : 'Enter Match Score'}
                                </h3>
                                <button onClick={() => setScoreModal(null)} className="text-[#94A3B8] hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-8">
                                <div className="flex items-center justify-between gap-6">
                                    <div className="flex-1 text-center">
                                        <div className="font-semibold text-white mb-4 h-12 flex items-center justify-center leading-tight text-sm">
                                            {scoreModal.match.player1Name}
                                        </div>
                                        <input type="number" autoFocus
                                            className="w-full h-20 text-center text-4xl font-black font-['Outfit'] bg-[#0f131c] border-2 border-[#334155] rounded-2xl text-white focus:outline-none focus:border-[#4cd7f6] focus:ring-4 focus:ring-[#4cd7f6]/20 transition-all shadow-inner"
                                            min={0} value={s1} onChange={e => setS1(e.target.value)} />
                                    </div>
                                    <div className="text-xs font-black text-[#94A3B8] uppercase tracking-widest mt-12">VS</div>
                                    <div className="flex-1 text-center">
                                        <div className="font-semibold text-white mb-4 h-12 flex items-center justify-center leading-tight text-sm">
                                            {scoreModal.match.player2Name}
                                        </div>
                                        <input type="number"
                                            className="w-full h-20 text-center text-4xl font-black font-['Outfit'] bg-[#0f131c] border-2 border-[#334155] rounded-2xl text-white focus:outline-none focus:border-[#4edea3] focus:ring-4 focus:ring-[#4edea3]/20 transition-all shadow-inner"
                                            min={0} value={s2} onChange={e => setS2(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-[#1E293B]/40 border-t border-[#334155] flex gap-3">
                                {scoreModal.match.winnerId && (
                                    <button onClick={resetScore} disabled={saving}
                                        className="px-4 py-3 rounded-xl font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors border border-red-500/20 flex items-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50">
                                        <RotateCcw className="w-4 h-4" /> Reset
                                    </button>
                                )}
                                <button onClick={() => setScoreModal(null)} className="flex-1 py-3 rounded-xl font-bold text-[#94A3B8] bg-[#1E293B] hover:bg-[#262a33] hover:text-white transition-colors border border-[#334155] text-sm">
                                    Cancel
                                </button>
                                <button onClick={saveScore} disabled={saving || s1 === '' || s2 === ''}
                                    className="flex-1 py-3 rounded-xl font-bold bg-[#4cd7f6] hover:bg-[#06b6d4] text-[#003640] disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(76,215,246,0.35)] flex items-center justify-center gap-2 text-sm">
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : '✓'}
                                    {scoreModal.match.winnerId ? 'Update Score' : 'Save Score'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ══════════ PDF EXPORT MODAL ══════════ */}
            <AnimatePresence>
                {pdfModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f131c]/80 backdrop-blur-md p-4"
                        onClick={() => setPdfModal(false)}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#131A26] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden border border-[#334155]">
                            {/* Modal header */}
                            <div className="px-6 py-4 bg-[#1E293B] border-b border-[#334155] flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#4cd7f6]/20 text-[#4cd7f6] flex items-center justify-center">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-white text-lg font-['Outfit']">Official Tournament Bracket Sheet</h2>
                                        <p className="text-xs text-[#94A3B8]">BWF-style PDF dispatch export</p>
                                    </div>
                                </div>
                                <button onClick={() => setPdfModal(false)} className="p-2 rounded-lg bg-[#0a0e16] text-[#94A3B8] hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            {/* Format toolbar */}
                            <div className="px-6 py-3 bg-[#0a0e16]/60 border-b border-[#334155] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Format:</label>
                                    <div className="inline-flex rounded-lg bg-[#1E293B] p-0.5 gap-0.5">
                                        {[
                                            { id: 'landscape-a4', label: 'Landscape A4' },
                                            { id: 'eco-mono', label: 'Eco Mono' },
                                        ].map(f => (
                                            <button key={f.id} onClick={() => setPdfFormat(f.id as any)}
                                                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${pdfFormat === f.id ? 'bg-[#4cd7f6] text-[#003640]' : 'text-[#94A3B8] hover:text-white'}`}>
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Collapsible toggle */}
                                <button onClick={() => setPdfDispatchOpen(v => !v)} className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-white transition-colors">
                                    <span>Preview</span>
                                    {pdfDispatchOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                            {/* Sheet preview */}
                            {pdfDispatchOpen && (
                                <div className="flex-1 overflow-y-auto p-6 bg-[#0a0e16]">
                                    <div id="bwf-print-sheet" className="w-full bg-[#131A26] rounded-xl p-6 shadow-2xl text-white border border-[#334155]">
                                        {/* Official header */}
                                        <div className="flex items-start justify-between pb-5 mb-5 border-b border-[#334155]">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-[#4cd7f6] text-[#003640] flex items-center justify-center font-extrabold text-xl font-['Outfit']">SC</div>
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#4cd7f6] font-mono">Official Tournament Dispatch</div>
                                                    <h3 className="text-lg font-extrabold text-white font-['Outfit']">{tournament.name.toUpperCase()}</h3>
                                                    <p className="text-xs text-[#94A3B8]">
                                                        {isKnockout ? 'Single Elimination Knockout' : 'Round-Robin League'} • {tournament.tournamentPlayers.length} Athletes
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                {/* QR placeholder */}
                                                <div className="w-16 h-16 rounded-lg bg-[#0a0e16] border border-[#334155] flex items-center justify-center">
                                                    <svg className="w-12 h-12 text-[#4cd7f6]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                                                        <rect x="3" y="14" width="7" height="7" rx="1" /><circle cx="17.5" cy="17.5" r="2.5" fill="currentColor" />
                                                        <path d="M7 7h.01M17 7h.01M7 17h.01" />
                                                    </svg>
                                                </div>
                                                <span className="text-[9px] text-[#4cd7f6] font-bold uppercase tracking-wider">SCAN LIVE</span>
                                            </div>
                                        </div>
                                        {/* Stats summary */}
                                        <div className="grid grid-cols-4 gap-3 mb-5">
                                            {[
                                                { label: 'Total Matches', value: matches.length },
                                                { label: 'Completed', value: completedMatches },
                                                { label: 'Pending', value: pendingMatches },
                                                { label: 'Athletes', value: tournament.tournamentPlayers.length },
                                            ].map(s => (
                                                <div key={s.label} className="text-center p-3 rounded-lg bg-[#0a0e16] border border-[#334155]">
                                                    <div className="text-xl font-black text-[#4cd7f6] font-['Outfit']">{s.value}</div>
                                                    <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider mt-0.5">{s.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Match grid preview */}
                                        <div className="space-y-2">
                                            {isKnockout ? (
                                                roundNums.map(round => {
                                                    const roundMatches = matches.filter(m => m.round === round && !m.isBye)
                                                    return (
                                                        <div key={round}>
                                                            <div className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">{roundLabel(round, maxRound)}</div>
                                                            <div className="space-y-1">
                                                                {roundMatches.map(m => (
                                                                    <div key={m.id} className="flex items-center justify-between p-2 rounded bg-[#0a0e16] border border-[#334155]/50 text-xs">
                                                                        <span className={`font-semibold truncate flex-1 ${m.winnerId === m.player1Id ? 'text-[#4edea3] font-bold' : 'text-[#94A3B8]'}`}>{m.player1Name || 'TBD'}</span>
                                                                        <span className="mx-3 text-[#334155] font-bold">
                                                                            {m.score1 != null ? `${m.score1} - ${m.score2}` : 'vs'}
                                                                        </span>
                                                                        <span className={`font-semibold truncate flex-1 text-right ${m.winnerId === m.player2Id ? 'text-[#4edea3] font-bold' : 'text-[#94A3B8]'}`}>{m.player2Name || 'TBD'}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            ) : (
                                                pools.map(pool => {
                                                    const poolPlayers = tournament.tournamentPlayers.filter(tp => numPools <= 1 || tp.pool === pool).map(tp => ({ id: tp.playerId, name: tp.playerName }))
                                                    const rows = calculateLeagueTable(poolPlayers, matches, numPools > 1 ? pool : undefined)
                                                    return (
                                                        <div key={pool}>
                                                            {numPools > 1 && <div className="text-[10px] font-bold uppercase tracking-wider text-[#4edea3] mb-1">Pool {pool}</div>}
                                                            <div className="space-y-1">
                                                                {rows.map((row, i) => (
                                                                    <div key={row.playerId} className="flex items-center gap-2 p-2 rounded bg-[#0a0e16] border border-[#334155]/50 text-xs">
                                                                        <span className="text-[#94A3B8] w-4 text-center font-bold">{i + 1}</span>
                                                                        <span className={`font-semibold flex-1 truncate ${i === 0 ? 'text-[#4edea3]' : 'text-white'}`}>{row.playerName}</span>
                                                                        <span className="text-[#94A3B8]">W:{row.won} L:{row.lost}</span>
                                                                        <span className={`font-bold ${row.setDiff > 0 ? 'text-[#4edea3]' : 'text-[#94A3B8]'}`}>{row.setDiff > 0 ? '+' : ''}{row.setDiff}</span>
                                                                        <span className="font-black text-[#4edea3] font-['Outfit']">{row.points}pts</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                        {/* Ref block */}
                                        <div className="mt-5 pt-4 border-t border-[#334155] flex items-end justify-between">
                                            <div>
                                                <div className="text-xs text-white font-semibold">Tournament Director</div>
                                                <div className="text-xs text-[#94A3B8]">Generated on {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                                <div className="text-[10px] text-[#334155] font-mono mt-1">Ref ID: SC-{id.slice(0, 8).toUpperCase()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] text-[10px] font-bold uppercase">✓ Certified Authentic</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Modal footer actions */}
                            <div className="px-6 py-4 bg-[#1E293B] border-t border-[#334155] flex items-center justify-between gap-3 flex-shrink-0">
                                <span className="text-xs text-[#94A3B8] flex items-center gap-1.5">
                                    <span className="text-[#4edea3]">✓</span> Bracket data synchronized in print buffer.
                                </span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setPdfModal(false)} className="px-4 py-2 rounded-lg bg-[#0a0e16] hover:bg-[#1E293B] text-white text-sm font-semibold transition-colors">
                                        Close
                                    </button>
                                    <button onClick={() => { setPdfModal(false); setTimeout(() => window.print(), 100) }}
                                        className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-[#262a33] text-white text-sm font-semibold transition-colors flex items-center gap-1.5">
                                        <Printer className="w-4 h-4" /> Print to Venue
                                    </button>
                                    <button onClick={() => { setPdfModal(false); setTimeout(() => window.print(), 100) }}
                                        className="px-5 py-2 rounded-lg bg-[#4cd7f6] text-[#003640] text-sm font-bold shadow-[0_0_20px_rgba(76,215,246,0.35)] hover:bg-[#06b6d4] transition-all flex items-center gap-1.5">
                                        <FileText className="w-4 h-4" /> Export A4 PDF
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ── Tab Button helper ──────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button onClick={onClick}
            className={`px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${active ? 'bg-[#4cd7f6] text-[#003640] shadow-md' : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'}`}>
            {children}
        </button>
    )
}

// ── Bracket Match Card ─────────────────────────────────────────────────────────

function BracketMatchCard({ match, onClick, round, maxRound, cellHeight }: { match: Match; onClick: () => void; round: number; maxRound: number; cellHeight: number }) {
    const canEdit = !match.isBye && !!(match.player1Id && match.player2Id)
    const isCompleted = match.winnerId || match.isBye
    const isReady = canEdit && !match.winnerId
    const showConnector = round < maxRound
    const connectorHeight = cellHeight / 2

    return (
        <div className="relative w-full z-10 flex group bracket-match-card"
            onClick={canEdit ? onClick : undefined}
            style={{ cursor: canEdit ? 'pointer' : 'default' }}>
            <div className={`w-full rounded-xl overflow-hidden border transition-all duration-300 relative z-20
                ${isCompleted ? (canEdit ? 'bg-[#131A26] border-[#334155] hover:border-[#4cd7f6]/50 hover:bg-[#181f2d] hover:-translate-y-0.5 shadow-md' : 'bg-[#131A26] border-[#334155]') : isReady ? 'bg-[#131A26] border-[#4cd7f6]/60 shadow-[0_0_16px_rgba(76,215,246,0.35)] group-hover:border-[#4cd7f6] hover:-translate-y-1' : 'bg-[#0f131c] border-[#334155]/40 opacity-70'}`}>
                {canEdit && isCompleted && (
                    <div className="no-print absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[9px] font-bold text-[#4cd7f6] bg-[#4cd7f6]/15 px-1.5 py-0.5 rounded border border-[#4cd7f6]/30 z-30">
                        <Pencil className="w-2.5 h-2.5" />
                        <span>Edit</span>
                    </div>
                )}
                <BracketPlayerRow name={match.player1Name} score={match.score1} isWinner={match.winnerId === match.player1Id} isLoser={!!match.winnerId && match.winnerId !== match.player1Id} isBye={match.isBye} />
                <div className="h-px w-full bracket-divider border-b border-[#334155]" />
                <BracketPlayerRow name={match.player2Name} score={match.score2} isWinner={match.winnerId === match.player2Id} isLoser={!!match.winnerId && match.winnerId !== match.player2Id} isBye={match.isBye && !match.player2Name} isByeIndicator={match.isBye && !match.player2Name} />
            </div>

            {showConnector && (
                <div className="absolute left-full top-1/2 w-16 -translate-y-1/2 pointer-events-none z-0">
                    <svg className="w-full overflow-visible" height={connectorHeight} style={{ position: 'absolute', top: match.matchNumber % 2 !== 0 ? 0 : -connectorHeight }}>
                        {match.matchNumber % 2 !== 0 ? (
                            <path d={`M 0 0 L 32 0 L 32 ${connectorHeight} L 64 ${connectorHeight}`} fill="none" stroke="currentColor" strokeOpacity={0.25} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        ) : (
                            <path d={`M 0 ${connectorHeight} L 32 ${connectorHeight} L 32 0 L 64 0`} fill="none" stroke="currentColor" strokeOpacity={0.25} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        )}
                    </svg>
                </div>
            )}
        </div>
    )
}

function BracketPlayerRow({ name, score, isWinner, isLoser, isBye, isByeIndicator }: { name: string | null, score: number | null, isWinner: boolean | null, isLoser: boolean | null, isBye?: boolean, isByeIndicator?: boolean }) {
    if (isByeIndicator) return (
        <div className="bracket-bye flex items-center px-3 py-1 bg-[#1E293B]/40 text-[#94A3B8]/60">
            <span className="text-[10px] font-bold tracking-widest uppercase">BYE</span>
        </div>
    )
    return (
        <div className={`bracket-player flex items-center justify-between px-3 py-2 transition-colors ${isWinner ? 'bracket-player-winner bg-[#4cd7f6]/15' : ''}`}>
            <span className={`bracket-player-name font-semibold text-sm truncate pr-2 ${isWinner ? 'text-[#4cd7f6] font-bold' : isLoser ? 'text-[#94A3B8]/50' : name ? 'text-[#dfe2ee]' : 'text-[#94A3B8]/40'}`}>
                {name || 'TBD'}
            </span>
            {score != null && (
                <span className={`bracket-player-score font-black font-['Outfit'] ${isWinner ? 'text-[#4cd7f6]' : isLoser ? 'text-[#94A3B8]/50' : 'text-white'}`}>
                    {score}
                </span>
            )}
        </div>
    )
}

// ── Fixture List ───────────────────────────────────────────────────────────────

function FixtureList({ matches, onClick }: { matches: Match[], onClick: (m: Match) => void }) {
    if (matches.length === 0) return <div className="text-[#94A3B8] py-4 text-sm font-medium">No fixtures yet.</div>
    return (
        <div className="space-y-2.5">
            {matches.map(m => {
                const canEdit = !m.isBye && !!(m.player1Id && m.player2Id)
                const isCompleted = !!m.winnerId
                const isReady = canEdit && !m.winnerId
                return (
                    <div key={m.id}
                        className={`group relative overflow-hidden flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300
                            ${canEdit ? 'cursor-pointer hover:-translate-y-0.5' : 'opacity-40 cursor-default bg-[#0f131c] border-[#334155]/40'}
                            ${isCompleted ? 'bg-[#131A26] border-[#334155] hover:border-[#4cd7f6]/40 hover:bg-[#181f2d]' : isReady ? 'bg-[#131A26]/80 border-[#334155] hover:border-[#4cd7f6]/50' : 'border-[#334155]'}`}
                        onClick={() => canEdit && onClick(m)}>
                        {/* Live indicator stripe for pending matches */}
                        {isReady && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#4cd7f6]/60 to-[#4edea3]/60" />}

                        <div className={`flex-1 font-semibold truncate text-sm ${m.winnerId === m.player1Id ? 'text-[#4edea3] font-bold' : 'text-[#dfe2ee]'}`}>
                            {m.player1Name || 'TBD'}
                        </div>
                        <div className="flex-shrink-0 flex justify-center items-center gap-3 mx-3">
                            {m.score1 != null && m.score2 != null ? (
                                <div className="flex items-center gap-2 bg-[#0f131c] px-4 py-1.5 rounded-full border border-[#334155] group-hover:border-[#4cd7f6]/40 transition-colors shadow-inner">
                                    <span className="font-bold text-lg text-white font-['Outfit']">{m.score1}</span>
                                    <span className="w-1 h-1 rounded-full bg-[#475569]" />
                                    <span className="font-bold text-lg text-white font-['Outfit']">{m.score2}</span>
                                    <Pencil className="w-3 h-3 text-[#94A3B8] group-hover:text-[#4cd7f6] transition-colors ml-1" />
                                </div>
                            ) : (
                                <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest bg-[#1E293B] border border-[#334155] px-2.5 py-1 rounded-md">VS</span>
                            )}
                        </div>
                        <div className={`flex-1 font-semibold truncate text-right text-sm ${m.winnerId === m.player2Id ? 'text-[#4edea3] font-bold' : 'text-[#dfe2ee]'}`}>
                            {m.player2Name || 'TBD'}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
