'use client'
import { useState } from 'react'

export default function Widget() {
  const [content, setContent] = useState('')
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const USER_ID = '857905ee-7a2d-4b1f-af6f-2eca5cfa5a8a'

  const handleSubmit = async () => {
    if (!content.trim() || rating === 0) return
    setLoading(true)

    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        source: 'widget',
        user_id: USER_ID,
        rating
      })
    })

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-xl">
        {sent ? (
          <div className="text-center py-4">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-white font-semibold">Merci pour ton feedback !</p>
            <p className="text-gray-400 text-sm mt-1">On en prend bonne note.</p>
            <button
              onClick={() => { setSent(false); setContent(''); setRating(0) }}
              className="mt-4 text-blue-400 text-sm hover:underline"
            >
              Envoyer un autre
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-white font-semibold mb-1">Votre avis compte 💬</h2>
            <p className="text-gray-400 text-sm mb-4">Dites-nous ce que vous pensez</p>

            {/* Étoiles */}
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="text-3xl transition-transform hover:scale-110 focus:outline-none"
                >
                  <span className={
                    star <= (hovered || rating)
                      ? 'text-yellow-400'
                      : 'text-gray-600'
                  }>
                    ★
                  </span>
                </button>
              ))}
            </div>

            {/* Label dynamique */}
            {rating > 0 && (
              <p className="text-sm mb-3 text-gray-400">
                {['', '😞 Très déçu', '😕 Pas satisfait', '😐 Moyen', '😊 Satisfait', '🤩 Excellent !'][rating]}
              </p>
            )}

            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Partagez votre expérience..."
              rows={4}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />

            <button
              onClick={handleSubmit}
              disabled={loading || !content.trim() || rating === 0}
              className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Envoyer mon feedback'}
            </button>

            {rating === 0 && content.trim() && (
              <p className="text-yellow-500 text-xs text-center mt-2">
                ⚠️ Merci de donner une note avant d'envoyer
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}