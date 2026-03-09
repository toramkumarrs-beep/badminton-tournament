'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Users, Dribbble, ArrowRight, ArrowLeft, Loader2, CheckCircle2, ChevronRight, Hash } from 'lucide-react'

interface Player {
    id: string
    name: string
}

interface SelectedPlayer {
    id: string
    name: string
    seed?: number
}

const STEPS = ['Details', 'Players', 'Seeds & Pools', 'Review']

export default function CreatePage() {
    const router = useRouter()
    const [step, setStep] = useState(0)
    const [userId, setUserId] = useState<string | null>(null)

    // Form state
    const [name, setName] = useState('')
    const [type, setType] = useState<'knockout' | 'league'>('knockout')
    const [poolCount, setPoolCount] = useState(1)

    // Players
    const [allPlayers, setAllPlayers] = useState<Player[]>([])
    const [selected, setSelected] = useState<SelectedPlayer[]>([])
    const [newPlayerName, setNewPlayerName] = useState('')
    const [seeds, setSeeds] = useState<Record<string, number>>({})

    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const uid = localStorage.getItem('userId')
        if (!uid) { router.push('/'); return }
        setUserId(uid)
        fetch(`/api/players?userId=${uid}`)
            .then(r => r.json())
            .then(data => setAllPlayers(Array.isArray(data) ? data : []))
    }, [router])

    const addNewPlayer = async () => {
        if (!newPlayerName.trim() || !userId) return
        const res = await fetch('/api/players', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, name: newPlayerName.trim() }),
        })
        const p = await res.json()
        setAllPlayers(prev => [p, ...prev])
        setNewPlayerName('')
    }

    const togglePlayer = (p: Player) => {
        setSelected(prev =>
            prev.find(s => s.id === p.id)
                ? prev.filter(s => s.id !== p.id)
                : [...prev, { id: p.id, name: p.name }]
        )
    }

    const canNext = () => {
        if (step === 0) return name.trim().length > 0
        if (step === 1) return selected.length >= 2
        return true
    }

    const handleSubmit = async () => {
        setSubmitting(true)
        setError('')
        try {
            const players = selected.map(p => ({
                id: p.id,
                name: p.name,
                seed: seeds[p.id] ?? undefined,
            }))
            const res = await fetch('/api/tournaments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, type, poolCount, players, userId }),
            })
            const data = await res.json()
            if (data.id) {
                router.push(`/tournament/${data.id}`)
            } else {
                setError(data.error || 'Failed to create tournament')
                setSubmitting(false)
            }
        } catch (e) {
            setError('Network error. Please try again.')
            setSubmitting(false)
        }
    }

    const slideVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    }

    return (
        <div className="min-h-screen flex flex-col font-sans text-white">
            <nav className="sticky top-0 z-50 glass border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg group-hover:shadow-primary/50 transition-all">
                            <Dribbble className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-white font-['Outfit']">
                            Shuttle<span className="text-secondary">Court</span>
                        </span>
                    </Link>
                    <Link href="/" className="text-sm font-medium text-white/70 hover:text-white flex items-center gap-2 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Cancel
                    </Link>
                </div>
            </nav>

            <main className="flex-grow max-w-2xl w-full mx-auto px-4 sm:px-6 py-12">
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight font-['Outfit'] mb-3">
                        Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Tournament</span>
                    </h1>
                    <p className="text-white/50">Follow the steps to set up your bracket or league.</p>
                </div>

                {/* Step Progress Bar */}
                <div className="flex items-center justify-between mb-12 relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/5 rounded-full z-0" />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-500 ease-out"
                        style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
                    />

                    {STEPS.map((s, i) => (
                        <div key={s} className="relative z-10 flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300
                                ${i < step ? 'bg-primary border-primary text-background' :
                                    i === step ? 'bg-background border-primary text-primary shadow-[0_0_15px_-3px_rgba(16,185,129,0.5)]' :
                                        'bg-background border-white/10 text-white/30'}`}
                            >
                                {i < step ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                            </div>
                            <span className={`text-xs font-medium absolute -bottom-6 whitespace-nowrap ${i <= step ? 'text-white' : 'text-white/30'}`}>
                                {s}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="glass-card p-6 md:p-10 min-h-[400px] flex flex-col relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            variants={slideVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="flex-grow flex flex-col"
                        >
                            {/* STEP 0: Details */}
                            {step === 0 && (
                                <div className="space-y-8 flex-grow">
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-2 uppercase tracking-wide">Tournament Name</label>
                                        <input
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 flex-grow px-4 text-white text-lg placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all shadow-inner"
                                            placeholder="e.g. Summer Badminton Open 2025"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && canNext() && setStep(1)}
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-3 uppercase tracking-wide">Tournament Type</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setType('knockout')}
                                                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all duration-200
                                                    ${type === 'knockout' ? 'bg-primary/10 border-primary text-primary shadow-[0_0_20px_-5px_rgba(59,130,246,0.4)]' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'}`}
                                            >
                                                <Trophy className={`w-8 h-8 ${type === 'knockout' ? 'text-primary' : 'text-white/30'}`} />
                                                <span className="font-semibold text-lg">Knockout</span>
                                            </button>
                                            <button
                                                onClick={() => setType('league')}
                                                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all duration-200
                                                    ${type === 'league' ? 'bg-secondary/10 border-secondary text-secondary shadow-[0_0_20px_-5px_rgba(139,92,246,0.4)]' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'}`}
                                            >
                                                <Users className={`w-8 h-8 ${type === 'league' ? 'text-secondary' : 'text-white/30'}`} />
                                                <span className="font-semibold text-lg">League</span>
                                            </button>
                                        </div>
                                        <p className="text-white/40 text-sm mt-4 leading-relaxed bg-white/5 p-4 rounded-lg border border-white/5">
                                            <strong className="text-white/70">{type === 'knockout' ? 'Knockout:' : 'League:'}</strong>{' '}
                                            {type === 'knockout'
                                                ? 'Single-elimination bracket. Losers are immediately eliminated. Supports manual seeding and automatic BYE balancing.'
                                                : 'Round-robin format. Every player plays every other player. Scales cleanly across multiple pools with a dynamic leaderboard.'}
                                        </p>
                                    </div>

                                    {type === 'league' && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                            <label className="block text-sm font-medium text-white/70 mb-2 uppercase tracking-wide">Number of Pools</label>
                                            <select
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary/50 transition-all cursor-pointer"
                                                value={poolCount}
                                                onChange={e => setPoolCount(Number(e.target.value))}
                                                style={{ WebkitAppearance: 'none' }}
                                            >
                                                {[1, 2, 3, 4, 6, 8].map(n => (
                                                    <option key={n} value={n} className="bg-background text-white">{n} Pool{n > 1 ? 's' : ''}</option>
                                                ))}
                                            </select>
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {/* STEP 1: Select Players */}
                            {step === 1 && (
                                <div className="flex-grow flex flex-col h-full">
                                    <div className="mb-6">
                                        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 shadow-inner">
                                            <input
                                                className="w-full bg-transparent py-3 px-4 text-white placeholder-white/30 focus:outline-none"
                                                placeholder="Quick add new player..."
                                                value={newPlayerName}
                                                onChange={e => setNewPlayerName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && addNewPlayer()}
                                            />
                                            <button onClick={addNewPlayer} className="px-6 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors border border-white/5">Add</button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-white/80">Select Athletes</h3>
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${selected.length >= 2 ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                            {selected.length} Selected (Min 2)
                                        </span>
                                    </div>

                                    <div className="flex-grow overflow-y-auto hide-scrollbar max-h-[400px] border border-white/5 bg-white/[0.02] rounded-2xl p-4">
                                        {allPlayers.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-white/30 py-10">
                                                <Users className="w-12 h-12 mb-3 opacity-20" />
                                                <p>No players in master roster.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {allPlayers.map(p => {
                                                    const isSelected = selected.find(s => s.id === p.id)
                                                    return (
                                                        <button
                                                            key={p.id}
                                                            className={`flex items-center text-left px-4 py-3 rounded-xl border transition-all duration-200
                                                                ${isSelected ? 'bg-primary/10 border-primary shadow-[0_0_15px_-5px_rgba(59,130,246,0.4)]' : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'}`}
                                                            onClick={() => togglePlayer(p)}
                                                        >
                                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 transition-all
                                                                ${isSelected ? 'bg-primary border-primary text-white' : 'border-white/20'}`}>
                                                                {isSelected && <CheckCircle2 className="w-5 h-5" />}
                                                            </div>
                                                            <span className={`font-medium ${isSelected ? 'text-white font-bold' : 'text-white/60'}`}>{p.name}</span>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Seeds / Pools */}
                            {step === 2 && (
                                <div className="flex-grow">
                                    {type === 'knockout' ? (
                                        <>
                                            <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                                                <Hash className="w-4 h-4 text-primary" />
                                                Assign Player Seeds
                                            </h3>
                                            <p className="text-white/40 text-sm mb-6 pb-4 border-b border-white/10">
                                                Highly ranked seeds are mathematically placed deep in the bracket to prevent early match-ups. Leaving blank results in random placement.
                                            </p>

                                            <div className="space-y-2 max-h-[400px] overflow-y-auto hide-scrollbar pr-2">
                                                {selected.map(p => (
                                                    <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                                        <span className="font-medium text-white">{p.name}</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-semibold uppercase text-white/30 tracking-widest">Seed</span>
                                                            <input
                                                                type="number"
                                                                className="w-20 text-center bg-background border border-white/10 rounded-lg py-2 text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                                min={1}
                                                                max={selected.length}
                                                                placeholder="-"
                                                                value={seeds[p.id] ?? ''}
                                                                onChange={e => {
                                                                    const v = e.target.value
                                                                    setSeeds(prev =>
                                                                        v ? { ...prev, [p.id]: Number(v) } : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== p.id))
                                                                    )
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <h3 className="font-semibold text-white mb-2">League Pool Distribution</h3>
                                            <p className="text-white/40 text-sm mb-6 pb-4 border-b border-white/10">
                                                Players will be evenly distributed across {poolCount} round-robin pool{poolCount > 1 ? 's' : ''}.
                                            </p>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto hide-scrollbar">
                                                {Array.from({ length: poolCount }, (_, pi) => (
                                                    <div key={pi} className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                        <div className="text-sm font-bold text-secondary uppercase tracking-widest mb-3 border-b border-white/10 pb-2">
                                                            Pool {pi + 1}
                                                        </div>
                                                        <div className="space-y-1">
                                                            {selected.filter((_, i) => i % poolCount === pi).map(p => (
                                                                <div key={p.id} className="text-white/80 py-1 flex items-center gap-2">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                                                    {p.name}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* STEP 3: Review */}
                            {step === 3 && (
                                <div className="flex-grow flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary/20 to-secondary/20 flex items-center justify-center mb-6 shadow-inner border border-white/10">
                                        <Trophy className="w-10 h-10 text-white" />
                                    </div>
                                    <h2 className="text-3xl font-extrabold text-white font-['Outfit'] mb-2">{name}</h2>

                                    <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                                        <span className="px-3 py-1 rounded-md bg-white/10 border border-white/10 text-sm font-semibold text-white/80 flex items-center gap-2">
                                            {type === 'knockout' ? <Trophy className="w-4 h-4 text-primary" /> : <Users className="w-4 h-4 text-secondary" />}
                                            <span className="uppercase">{type}</span>
                                        </span>
                                        <span className="px-3 py-1 rounded-md bg-white/10 border border-white/10 text-sm font-semibold text-white/80">
                                            {selected.length} Players
                                        </span>
                                        {type === 'league' && poolCount > 1 && (
                                            <span className="px-3 py-1 rounded-md bg-white/10 border border-white/10 text-sm font-semibold text-white/80">
                                                {poolCount} Pools
                                            </span>
                                        )}
                                    </div>

                                    <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
                                        <h4 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">Confirmed Roster</h4>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {selected.map(p => (
                                                <div key={p.id} className="px-3 py-1 rounded-full bg-white/10 border border-white/5 text-sm text-white flex items-center gap-1.5">
                                                    {seeds[p.id] && <span className="text-primary font-bold">#{seeds[p.id]}</span>}
                                                    {p.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {error && <p className="text-red-400 mt-2 bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20">{error}</p>}
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>

                    {/* Footer Nav Controls */}
                    <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                        <button
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-colors ${step > 0 ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-transparent cursor-default select-none pointer-events-none'}`}
                            onClick={() => step > 0 && setStep(s => s - 1)}
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>

                        {step < STEPS.length - 1 ? (
                            <button
                                className="flex items-center gap-2 px-8 py-3 bg-white text-background hover:bg-white/90 rounded-full font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed group shadow-[0_4px_14px_0_rgba(255,255,255,0.1)]"
                                disabled={!canNext()}
                                onClick={() => setStep(s => s + 1)}
                            >
                                Next Step <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-[#2563eb] text-white rounded-full font-bold transition-all disabled:opacity-50 shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.8)]"
                            >
                                {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating Engine...</> : '🚀 Blast Off'}
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
