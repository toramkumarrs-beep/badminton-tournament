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
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
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
          <div className="flex items-center gap-4">
            {userId && (
              <Link href="/create" className="text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 px-4 py-2 rounded-full transition-colors">
                New Tournament
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden min-h-[600px] flex items-center justify-center">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0 bg-background print:hidden">
          <div className="absolute inset-0 bg-background/30 z-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background z-10" />
          <img src="/hero-bg.webp" alt="Badminton Action" className="w-full h-[60%] md:h-full object-cover object-top md:object-center opacity-100" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-white/70 uppercase tracking-wider">Tournament Manager 2.0</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-extrabold text-white tracking-tight font-['Outfit'] leading-tight mb-6"
          >
            Dominate the <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Badminton Court
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-white/60 leading-relaxed font-light"
          >
            Build Knockout brackets and League round-robins instantly. Track live scores, auto-advance winners, and share highly visual results.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/create" className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full shadow-[0_0_40px_-10px_rgba(124,58,237,0.8)] hover:shadow-[0_0_60px_-15px_rgba(124,58,237,1)] transition-all duration-300 hover:scale-105 overflow-hidden">
              <div className="absolute inset-0 w-full h-full bg-white/20 blur-md group-hover:translate-x-full transition-transform duration-700 -translate-x-full" />
              <Trophy className="w-5 h-5" />
              Create Tournament
            </Link>
            <Link href="/players" className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-full backdrop-blur-md transition-all duration-300 hover:scale-[1.02]">
              <Users className="w-5 h-5 text-white/70 group-hover:text-white" />
              Manage Players
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Tournaments Grid */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 w-full">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <h2 className="text-2xl font-semibold text-white font-['Outfit'] flex items-center gap-3">
            <span className="w-2 h-8 rounded-full bg-secondary" />
            My Tournaments
          </h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/50">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p>Loading your dashboard...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden glass-card p-12 text-center flex flex-col items-center"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <div className="w-20 h-20 mb-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white/30" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Tournaments Yet</h3>
            <p className="text-white/50 mb-8 max-w-md">You haven't created any tournaments. Click the button below to set up your first knockout or league.</p>
            <Link href="/create" className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white font-medium transition-colors">
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
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/tournament/${t.id}`} className="block group">
                  <div className="glass-card p-6 h-full flex flex-col justify-between glass-hover relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />

                    <div>
                      <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className="bg-white/10 p-2.5 rounded-xl border border-white/5 group-hover:bg-primary/20 group-hover:border-primary/30 transition-colors">
                          <Trophy className={`w-5 h-5 ${t.type === 'knockout' ? 'text-primary' : 'text-secondary'}`} />
                        </div>
                        {t.status === 'active' ? (
                          <span className="px-2.5 py-1 rounded-md bg-secondary/10 text-secondary border border-secondary/20 text-xs font-semibold tracking-wide uppercase">Active</span>
                        ) : t.status === 'complete' ? (
                          <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-semibold tracking-wide uppercase">Complete</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md bg-white/5 text-white/50 border border-white/10 text-xs font-semibold tracking-wide uppercase">Draft</span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                        {t.name}
                      </h3>
                      <p className="text-sm font-medium text-white/50 mb-6 uppercase tracking-wider">
                        {t.type === 'knockout' ? 'Knockout Bracket' : 'League Round-Robin'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-4 text-sm text-white/40">
                      <span>{new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="flex items-center gap-1 group-hover:text-white transition-colors">
                        View
                        <MoveRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
