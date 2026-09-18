'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, UserPlus, Users, ArrowLeft, Loader2, Dribbble, Trophy } from 'lucide-react'

interface Player {
    id: string
    name: string
    createdAt: string
}

export default function PlayersPage() {
    const [userId, setUserId] = useState<string | null>(null)
    const [players, setPlayers] = useState<Player[]>([])
    const [newName, setNewName] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const uid = localStorage.getItem('userId')
        if (!uid) { setLoading(false); return }
        setUserId(uid)
        fetch(`/api/players?userId=${uid}`)
            .then(r => r.ok ? r.json() : [])
            .then(data => { setPlayers(Array.isArray(data) ? data : []); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const addPlayer = async () => {
        if (!newName.trim() || !userId) return
        const res = await fetch('/api/players', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, name: newName.trim() }),
        })
        if (!res.ok) { alert('Failed to add player. Check the console for details.'); return }
        const p = await res.json()
        setPlayers(prev => [p, ...prev])
        setNewName('')
    }

    const deletePlayer = async (id: string, name: string) => {
        if (!confirm(`Delete ${name}?`)) return
        await fetch(`/api/players?id=${id}`, { method: 'DELETE' })
        setPlayers(prev => prev.filter(p => p.id !== id))
    }

    return (
        <div className="min-h-screen flex flex-col font-sans bg-background text-white">
            <header className="sticky top-0 z-50 bg-[#131A26]/90 backdrop-blur-xl border-b border-[#334155]/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-lg bg-[#1E293B] border border-primary/30 flex items-center justify-center text-primary group-hover:border-primary group-hover:shadow-[0_0_12px_rgba(76,215,246,0.35)] transition-all">
                            <Trophy className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-extrabold text-xl tracking-tight text-white font-['Outfit']">
                            Shuttle<span className="text-primary">Court</span>
                        </span>
                    </Link>
                    <Link href="/" className="text-sm font-semibold text-[#94A3B8] hover:text-white flex items-center gap-2 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Console
                    </Link>
                </div>
            </header>

            <main className="flex-grow max-w-3xl w-full mx-auto px-4 sm:px-6 py-12">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">Athletes Database</span>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight font-['Outfit'] mb-3 flex items-center gap-4">
                        <Users className="w-10 h-10 text-primary" />
                        Player <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#acedff] to-secondary">Roster</span>
                    </h1>
                    <p className="text-base text-[#94A3B8]">Manage your verified athletes. Build your master roster here to easily seed and dispatch tournaments.</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl bg-[#131A26] border border-[#334155] p-6 mb-10 shadow-xl">
                    <h2 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-4">Add New Athlete</h2>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-grow group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <UserPlus className="h-5 w-5 text-[#475569] group-focus-within:text-primary transition-colors" />
                            </div>
                            <input
                                type="text"
                                className="w-full bg-[#0f131c] border border-[#334155] rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-inner text-sm"
                                placeholder="Athlete's full name..."
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addPlayer()}
                                autoFocus
                            />
                        </div>
                        <button
                            onClick={addPlayer}
                            disabled={!newName.trim()}
                            className="bg-primary hover:bg-[#06b6d4] text-[#003640] font-bold py-3.5 px-7 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(76,215,246,0.35)] flex-shrink-0 text-sm"
                        >
                            Add to Roster
                        </button>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-[#94A3B8]">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-center font-medium">Loading roster...</p>
                    </div>
                ) : players.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 px-6 border border-dashed border-[#334155] rounded-3xl bg-[#131A26]/50">
                        <div className="w-16 h-16 rounded-2xl bg-[#1E293B] border border-[#334155] flex items-center justify-center mx-auto mb-4 text-[#94A3B8]">
                            <Users className="w-8 h-8 opacity-40" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">Your roster is empty</h3>
                        <p className="text-[#94A3B8] text-sm">Add some players above to get started with tournament draws.</p>
                    </motion.div>
                ) : (
                    <div>
                        <div className="flex items-center justify-between mb-6 border-b border-[#334155] pb-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-['Outfit']">
                                <span className="w-2 h-2 rounded-full bg-secondary" />
                                Registered Athletes
                            </h2>
                            <span className="text-xs font-bold text-primary bg-[#1E293B] border border-[#334155] px-3 py-1 rounded-full">{players.length} Total</span>
                        </div>

                        <div className="space-y-3">
                            <AnimatePresence>
                                {players.map((p) => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                                        exit={{ opacity: 0, height: 0, marginBottom: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="group"
                                    >
                                        <div className="flex items-center justify-between p-4 bg-[#131A26] hover:bg-[#181f2d] border border-[#334155] hover:border-primary/40 rounded-2xl transition-all shadow-md">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-[#1E293B] border border-[#334155] flex items-center justify-center text-sm font-extrabold text-primary font-['Outfit']">
                                                    {p.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-base font-semibold text-white tracking-wide">{p.name}</span>
                                            </div>
                                            <button
                                                onClick={() => deletePlayer(p.id, p.name)}
                                                className="p-2 text-[#94A3B8] hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
                                                title="Remove athlete"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
