'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Trophy, Users, MoveRight, Loader2, Dribbble } from 'lucide-react'

interface Tournament {
  id: string
  name: string
  type: string
  status: string
  createdAt: string
}

export default function HomePage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      let deviceId = localStorage.getItem('deviceId')
      if (!deviceId) {
        deviceId = crypto.randomUUID()
        localStorage.setItem('deviceId', deviceId)
      }
      try {
        const res = await fetch(`/api/user?deviceId=${deviceId}`)
        const user = await res.json()
        setUserId(user.id)
        localStorage.setItem('userId', user.id)
        const tRes = await fetch(`/api/tournaments?userId=${user.id}`)
        const tData = await tRes.json()
        setTournaments(Array.isArray(tData) ? tData : [])
      } catch (_) { }
      setLoading(false)
    }
    init()
  }, [])

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Kinetic Apex Navigation */}
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

          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/players" className="text-sm font-semibold text-[#94A3B8] hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">Players</span>
            </Link>
            <Link href="/create" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-[#003640] font-bold text-sm shadow-[0_0_16px_rgba(76,215,246,0.35)] hover:bg-[#06b6d4] hover:shadow-[0_0_24px_rgba(76,215,246,0.55)] transition-all">
              <span>+ Create</span>
              <span className="hidden sm:inline">Tournament</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Kinetic Apex Hero Section */}
      <section className="relative overflow-hidden">

        {/* ── MOBILE LAYOUT: image on top, text below ── */}
        <div className="lg:hidden">
          {/* Player image */}
          <div className="relative w-full h-56 overflow-hidden">
            <img
              src="/hero-bg.jpg"
              alt="Badminton Action"
              className="w-full h-full object-cover"
              style={{ objectPosition: '38% 35%' }}
            />
            {/* subtle bottom fade into content */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f131c] via-transparent to-[#0f131c]/40" />
          </div>
          {/* Text content */}
          <div className="px-5 pt-5 pb-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E293B] border border-[#334155] shadow-lg mb-4">
              <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
              <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Pro Circuit Tournament OS</span>
              <span className="text-[#475569] text-xs">•</span>
              <span className="text-[10px] text-[#94A3B8] font-semibold">v3.4</span>
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight font-['Outfit'] leading-tight mb-3">
              Tournament <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#acedff] to-secondary">Manager</span>
            </h1>
            <p className="text-sm text-[#94A3B8] leading-relaxed mb-6">
              Build Knockout brackets and League round-robins instantly. Track live scores, auto-advance winners.
            </p>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Link href="/create" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-[#003640] font-bold text-sm shadow-[0_0_20px_rgba(76,215,246,0.4)] hover:bg-[#06b6d4] transition-all">
                <Trophy className="w-4 h-4" /> Create Tournament
              </Link>
              <Link href="/players" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1E293B] text-white font-bold text-sm border border-[#334155] transition-all">
                <Users className="w-4 h-4 text-primary" /> Manage Players
              </Link>
            </div>
            {/* Stats strip */}
            <div className="mt-6 grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#131A26]/80 border border-[#334155]">
              <div className="flex flex-col items-center p-2 rounded-xl bg-[#0f131c]">
                <span className="text-[10px] uppercase text-[#94A3B8] font-semibold mb-0.5">Tourneys</span>
                <span className="text-xl font-black text-white font-['Outfit']">{tournaments.length}</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-xl bg-[#0f131c]">
                <span className="text-[10px] uppercase text-[#94A3B8] font-semibold mb-0.5">Formats</span>
                <span className="text-xs font-bold text-secondary mt-0.5">KO + RR</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-xl bg-[#0f131c]">
                <span className="text-[10px] uppercase text-[#94A3B8] font-semibold mb-0.5">Draw</span>
                <span className="text-xs font-bold text-primary mt-0.5">Auto BYE</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── DESKTOP LAYOUT: full background image ── */}
        <div className="hidden lg:block relative pt-28 pb-20 min-h-[480px] flex items-center justify-center">
          {/* Background Image */}
          <div className="absolute inset-0 z-0 bg-background print:hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f131c]/30 via-transparent to-[#0f131c]/70 z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f131c] via-transparent to-[#0f131c]/40 z-10" />
            <img src="/hero-bg.jpg" alt="Badminton Action" className="w-full h-full object-cover" style={{ objectPosition: '50% 40%' }} />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1E293B] border border-[#334155] shadow-lg mb-6">
              <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
              <span className="text-xs uppercase tracking-widest text-primary font-bold">Pro Circuit Tournament OS</span>
              <span className="text-[#475569]">•</span>
              <span className="text-xs text-[#94A3B8] font-semibold">v3.4 Automated Brackets</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="text-5xl md:text-7xl font-extrabold text-white tracking-tight font-['Outfit'] leading-tight mb-6 drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
              Tournament <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#acedff] to-secondary">Manager</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="max-w-2xl mx-auto text-lg md:text-xl text-[#94A3B8] leading-relaxed font-normal mb-8">
              Build Knockout brackets and League round-robins instantly. Track live scores, auto-advance winners, and share highly visual results.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="flex flex-wrap items-center justify-center gap-4 max-w-md mx-auto mb-12">
              <Link href="/create" className="flex-1 min-w-[190px] inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-primary text-[#003640] font-bold text-base shadow-[0_0_24px_rgba(76,215,246,0.45)] hover:shadow-[0_0_36px_rgba(76,215,246,0.65)] hover:bg-[#06b6d4] transition-all">
                <Trophy className="w-5 h-5" /><span>Create Tournament</span>
              </Link>
              <Link href="/players" className="flex-1 min-w-[170px] inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#1E293B] hover:bg-[#262a33] text-white font-bold text-base border border-[#334155] shadow-md transition-all">
                <Users className="w-5 h-5 text-primary" /><span>Manage Players</span>
              </Link>
            </motion.div>
            <div className="w-full max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#131A26]/80 border border-[#334155] shadow-2xl backdrop-blur-md">
              <div className="flex flex-col items-center p-3 rounded-xl bg-[#0f131c]">
                <span className="text-xs uppercase text-[#94A3B8] font-semibold mb-1">Your Tourneys</span>
                <span className="text-2xl font-black text-white font-['Outfit']">{tournaments.length}</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-[#0f131c]">
                <span className="text-xs uppercase text-[#94A3B8] font-semibold mb-1">Engines Supported</span>
                <span className="text-sm font-bold text-secondary flex items-center gap-1 mt-1">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> Knockout &amp; League
                </span>
              </div>
              <div className="col-span-2 md:col-span-1 flex flex-col items-center p-3 rounded-xl bg-[#0f131c]">
                <span className="text-xs uppercase text-[#94A3B8] font-semibold mb-1">Automated Draw</span>
                <span className="text-sm font-bold text-primary mt-1">Smart BYE Balancing</span>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Tournaments Grid */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 w-full">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#334155]/60">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary block mb-1">Control Console</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
              My Tournaments
            </h2>
          </div>
          <Link href="/create" className="text-xs sm:text-sm font-bold text-primary hover:text-white transition-colors">
            + New Tournament
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#94A3B8]">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="font-medium">Loading your console...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-2xl bg-[#131A26] border border-[#334155] p-12 text-center flex flex-col items-center"
          >
            <div className="w-20 h-20 mb-6 rounded-2xl bg-[#1E293B] border border-[#334155] flex items-center justify-center text-primary shadow-inner">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-white font-['Outfit'] mb-2">No Tournaments Yet</h3>
            <p className="text-[#94A3B8] mb-8 max-w-md">You haven't created any tournaments. Click below to launch your first Knockout or League bracket.</p>
            <Link href="/create" className="px-6 py-3 bg-primary hover:bg-[#06b6d4] rounded-xl text-[#003640] font-bold transition-all shadow-[0_0_16px_rgba(76,215,246,0.35)]">
              + Create Tournament
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link href={`/tournament/${t.id}`} className="block group h-full">
                  <div className="rounded-2xl bg-[#131A26] border border-[#334155] p-6 h-full flex flex-col justify-between hover:border-primary/50 hover:bg-[#181f2d] hover:shadow-[0_12px_32px_rgba(0,0,0,0.6)] transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none group-hover:bg-primary/20 transition-all" />

                    <div>
                      <div className="flex items-start justify-between mb-4 relative z-10">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${t.type === 'knockout' ? 'bg-primary/15 text-primary border border-primary/25' : 'bg-secondary/15 text-secondary border border-secondary/25'}`}>
                          {t.type === 'knockout' ? 'Knockout' : 'League'}
                        </span>
                        {t.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/10 text-secondary border border-secondary/20 text-xs font-bold uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" /> Active
                          </span>
                        ) : t.status === 'complete' ? (
                          <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase">Complete</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md bg-white/5 text-[#94A3B8] border border-[#334155] text-xs font-bold uppercase">Draft</span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-snug font-['Outfit']">
                        {t.name}
                      </h3>
                      <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-6">
                        {t.type === 'knockout' ? 'Single Elimination Bracket' : 'Round-Robin Standings'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#334155] pt-4 mt-4 text-xs font-medium text-[#94A3B8]">
                      <span>{new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="flex items-center gap-1 text-primary font-bold group-hover:translate-x-1 transition-transform">
                        Enter Arena
                        <MoveRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="lg:hidden fixed bottom-0 w-full z-40 pb-safe bg-[#131A26]/90 backdrop-blur-xl border-t border-[#334155]/60">
        <div className="flex justify-around items-center h-16 px-2">
          <Link href="/" className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-11 text-[#4cd7f6]">
            <span className="text-lg">⊟</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Events</span>
          </Link>
          <Link href="/create" className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-11 text-[#94A3B8] hover:text-white transition-colors">
            <span className="text-lg">⊕</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">New</span>
          </Link>
          <Link href="/players" className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-11 text-[#94A3B8] hover:text-white transition-colors">
            <span className="text-lg">⊞</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Players</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
