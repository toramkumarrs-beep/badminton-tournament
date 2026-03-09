'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, UserPlus, Users, ArrowLeft, Loader2, Dribbble } from 'lucide-react'

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
            .then(r => r.json())
            .then(data => { setPlayers(Array.isArray(data) ? data : []); setLoading(false) })
    }, [])

    const addPlayer = async () => {
        if (!newName.trim() || !userId) return
        const res = await fetch('/api/players', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, name: newName.trim() }),
        })
        const p = await res.json()
        setPlayers(prev => [p, ...prev]) // Add to top for better UX
        setNewName('')
    }

    const deletePlayer = async (id: string, name: string) => {
        if (!confirm(`Delete ${name}?`)) return
        await fetch(`/api/players?id=${id}`, { method: 'DELETE' })
        setPlayers(prev => prev.filter(p => p.id !== id))
    }

    return (
        <div className="min-h-screen flex flex-col font-sans">
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
                        Back to Home
                    </Link>
                </div>
            </nav>

            <main className="flex-grow max-w-3xl w-full mx-auto px-4 sm:px-6 py-12">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight font-['Outfit'] mb-4 flex items-center gap-4">
                        <Users className="w-10 h-10 text-primary" />
                        Player <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Roster</span>
                    </h1>
                    <p className="text-lg text-white/50">Manage your athletes. Build your master roster here to easily select them during tournament creation.</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 mb-12">
                    <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Add New Player</h2>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-grow group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <UserPlus className="h-5 w-5 text-white/30 group-focus-within:text-primary transition-colors" />
                            </div>
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all shadow-inner"
                                placeholder="Player's full name..."
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addPlayer()}
                                autoFocus
                            />
                        </div>
                        <button
                            onClick={addPlayer}
                            disabled={!newName.trim()}
                            className="bg-primary hover:bg-[#2563eb] text-white font-semibold py-4 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_0_20px_-5px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.6)] flex-shrink-0"
                        >
                            Add to Roster
                        </button>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="flexjustify-center py-12 text-white/50">
                        <Loader2 className="w-8 h-8 animate-spin text-secondary mx-auto mb-4" />
                        <p className="text-center">Loading players...</p>
                    </div>
                ) : players.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 px-6 border border-dashed border-white/10 rounded-3xl bg-white/5">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                            <Users className="w-8 h-8 text-white/20" />
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">Your roster is empty</h3>
                        <p className="text-white/50">Add some players above to get started.</p>
                    </motion.div>
                ) : (
                    <div>
                        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary" />
                                Registered Players
                            </h2>
                            <span className="text-sm font-medium text-white/40 bg-white/5 px-3 py-1 rounded-full">{players.length} Total</span>
                        </div>

                        <div className="space-y-3">
                            <AnimatePresence>
                                {players.map((p, i) => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                                        exit={{ opacity: 0, height: 0, marginBottom: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="group"
                                    >
                                        <div className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/[0.08] border border-white/5 hover:border-white/10 rounded-2xl transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-sm font-bold text-white/50 group-hover:text-white group-hover:from-secondary/20 group-hover:to-primary/20 transition-all">
                                                    {p.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-lg font-medium text-white tracking-wide">{p.name}</span>
                                            </div>
                                            <button
                                                onClick={() => deletePlayer(p.id, p.name)}
                                                className="p-2 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
                                                title="Remove player"
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
