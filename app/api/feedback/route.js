import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { content, source, user_id, rating, auteur } = await request.json()

    if (!content || !user_id) {
      return Response.json({ error: 'Champs manquants' }, { status: 400 })
    }

    // 1. Sauvegarder dans Supabase FeedbackAI
    const { data, error } = await supabase
      .from('feedbacks')
      .insert([{
        content,
        source,
        user_id,
        rating: rating ?? null,
        auteur: auteur || 'Client anonyme'   // ✅ Sauvegarder le nom
      }])
      .select()

    if (error) throw error

    const feedback = data[0]

    // 2. ✅ Déclencher automatiquement summarize + envoi RepuAgent
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://feedbackai-git-main-percys.vercel.app'
      await fetch(`${appUrl}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackId: feedback.id,
          content:    feedback.content,
          rating:     feedback.rating,
          user_id:    feedback.user_id,
        })
      })
      console.log('✅ Summarize déclenché automatiquement')
    } catch (e) {
      console.error('⚠️ Erreur summarize (non bloquant):', e)
    }

    return Response.json({ success: true, data })

  } catch (error) {
    console.error('Erreur:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}