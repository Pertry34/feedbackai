import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { feedbackId, content, rating, user_id } = await request.json()

    if (!feedbackId || !content) {
      return Response.json({ error: 'feedbackId et content requis' }, { status: 400 })
    }

    // ✅ Vérifier si déjà résumé → évite double envoi à RepuAgent
    const { data: existingFeedback } = await supabase
      .from('feedbacks')
      .select('summary, user_id, rating, auteur')
      .eq('id', feedbackId)
      .single()

    const dejaEnvoye = !!existingFeedback?.summary

    // 1. Analyser avec Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Analyse ce feedback client et réponds UNIQUEMENT en JSON avec ce format exact :
{"summary": "résumé en une phrase", "sentiment": "positif" | "neutre" | "négatif"}

Feedback : "${content}"`
      }]
    })

    const raw = message.content[0].text.trim()
    const parsed = JSON.parse(raw)
    const { summary, sentiment } = parsed

    // 2. Mettre à jour Supabase FeedbackAI
    await supabase
      .from('feedbacks')
      .update({ summary, sentiment })
      .eq('id', feedbackId)

    // 3. ✅ Envoyer à RepuAgent UNIQUEMENT si premier envoi
    if (!dejaEnvoye) {
      const uid           = user_id || existingFeedback?.user_id
      const feedbackRating = rating || existingFeedback?.rating || 3

      if (uid && process.env.REPUAGENT_API_KEY) {
        try {
          const { data: userLink } = await supabase
            .from('user_repuagent')
            .select('repuagent_id')
            .eq('user_id', uid)
            .single()

          if (userLink?.repuagent_id) {
            const res = await fetch('https://repuagent.onrender.com/api/feedback', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-API-Key': process.env.REPUAGENT_API_KEY
              },
              body: JSON.stringify({
                client_id:       userLink.repuagent_id,
                texte_brut:      content,
                texte_reformule: summary,
                sentiment:       sentiment,
                score:           feedbackRating,
                auteur:          existingFeedback?.auteur || 'Client FeedbackAI'
              })
            })
            const data = await res.json()
            console.log('✅ Avis envoyé à RepuAgent :', data)
          } else {
            console.log('⚠️ Aucun repuagent_id trouvé pour user_id:', uid)
          }
        } catch (e) {
          console.error('⚠️ Erreur RepuAgent (non bloquant):', e)
        }
      }
    } else {
      console.log('⏭️ Feedback déjà envoyé à RepuAgent — skip')
    }

    return Response.json({ summary, sentiment })

  } catch (error) {
    console.error('Erreur API summarize:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}