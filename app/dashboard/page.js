'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [feedbacks, setFeedbacks] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth')
      setUser(user)

      const { data } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false })

      setFeedbacks(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Chargement...</p>
    </div>
  )

  const sentimentBadge = (sentiment) => {
  const styles = {
    'positif':  { bg: 'bg-green-900', text: 'text-green-400', label: '😊 Positif' },
    'neutre':   { bg: 'bg-gray-800',  text: 'text-gray-400',  label: '😐 Neutre' },
    'négatif':  { bg: 'bg-red-900',   text: 'text-red-400',   label: '😞 Négatif' },
  }
  const s = styles[sentiment] || styles['neutre']
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${s.bg} ${s.text} font-medium`}>
      {s.label}
    </span>
  )
}

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">FeedbackAI 💬</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-400 hover:text-red-300 transition"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Total feedbacks</p>
            <p className="text-3xl font-bold mt-1">{feedbacks.length}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Cette semaine</p>
            <p className="text-3xl font-bold mt-1">
              {feedbacks.filter(f => {
                const d = new Date(f.created_at)
                const now = new Date()
                return (now - d) < 7 * 24 * 60 * 60 * 1000
              }).length}
            </p>
          </div>
<div className="bg-gray-900 rounded-xl p-5">
  <p className="text-gray-400 text-sm">Positifs</p>
  <p className="text-3xl font-bold mt-1 text-green-400">
    {feedbacks.filter(f => f.sentiment === 'positif').length}
  </p>
</div>
<div className="bg-gray-900 rounded-xl p-5">
  <p className="text-gray-400 text-sm">Négatifs</p>
  <p className="text-3xl font-bold mt-1 text-red-400">
    {feedbacks.filter(f => f.sentiment === 'négatif').length}
  </p>
</div>
        </div>
        {/* Graphique */}
        <div className="bg-gray-900 rounded-xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-gray-400 mb-4">Feedbacks sur 30 jours</h2>
        <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={(() => {
            const days = Array.from({ length: 30 }, (_, i) => {
                const d = new Date()
                d.setDate(d.getDate() - (29 - i))
                return {
                date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
                count: feedbacks.filter(f => {
                    const fd = new Date(f.created_at)
                    return fd.toDateString() === d.toDateString()
                }).length
                }
            })
            return days
            })()}>
            <defs>
                <linearGradient id="colorFeedback" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
            </defs>
            <XAxis
                dataKey="date"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={4}
            />
            <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
            />
            <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af', fontSize: 12 }}
                itemStyle={{ color: '#3b82f6', fontSize: 12 }}
                formatter={(value) => [`${value} feedback(s)`, '']}
            />
            <Area
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorFeedback)"
            />
            </AreaChart>
        </ResponsiveContainer>
        </div>

        {/* Liste feedbacks */}
        <h2 className="text-lg font-semibold mb-4">Feedbacks reçus</h2>
        {feedbacks.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-8 text-center text-gray-500">
            Aucun feedback pour l'instant.<br />
            <span className="text-sm">Intégrez le widget sur votre site pour commencer.</span>
          </div>
        ) : (
          <div className="space-y-3">
        {feedbacks.map(f => (
        <div key={f.id} className="bg-gray-900 rounded-xl p-5">

            {/* Étoiles */}
            {f.rating && (
            <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(star => (
                <span key={star} className={`text-lg ${star <= f.rating ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>
                ))}
            </div>
            )}

            {/* Badge sentiment */}
            {f.sentiment && (
            <div className="mb-2">
                {sentimentBadge(f.sentiment)}
            </div>
            )}

            <p className="text-gray-200">{f.content}</p>

            {f.summary ? (
            <p className="text-blue-400 text-sm mt-2">🤖 {f.summary}</p>
            ) : (
            <button
                onClick={async () => {
                const res = await fetch('/api/summarize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ feedbackId: f.id, content: f.content })
                })
                const { summary, sentiment } = await res.json()
                setFeedbacks(prev => prev.map(fb =>
                    fb.id === f.id ? { ...fb, summary, sentiment } : fb
                ))
                }}
                className="text-sm text-blue-500 hover:text-blue-400 mt-2 transition"
            >
                ✨ Résumer avec IA
            </button>
            )}

            <p className="text-gray-600 text-xs mt-2">
            {new Date(f.created_at).toLocaleDateString('fr-FR')}
            </p>
        </div>
        ))}
          </div>
        )}
      </div>
    </div>
  )
}
