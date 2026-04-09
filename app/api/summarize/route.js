import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { feedbackId, content } = await request.json()

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

    const raw = message.content[0].text
    const parsed = JSON.parse(raw)
    const { summary, sentiment } = parsed

    // Mettre à jour Supabase FeedbackAI
    await supabase
      .from('feedbacks')
      .update({ summary, sentiment })
      .eq('id', feedbackId)

    // ✅ Récupérer le feedback complet (user_id + rating)
    const { data: feedback } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('id', feedbackId)
      .single()

    // ✅ Envoyer à RepuAgent
    if (feedback?.user_id) {
      try {
        const { data: userLink } = await supabase
          .from('user_repuagent')
          .select('repuagent_id')
          .eq('user_id', feedback.user_id)
          .single()

        if (userLink?.repuagent_id) {
          await fetch('https://repuagent.onrender.com/api/feedback', {
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
              score:           feedback.rating || 3,
              auteur:          feedback.auteur || 'Client FeedbackAI'
            })
          })
          console.log('✅ Avis envoyé à RepuAgent')
        }
      } catch (e) {
        console.error('⚠️ Erreur RepuAgent (non bloquant):', e)
      }
    }

    return Response.json({ summary, sentiment })

  } catch (error) {
    console.error('Erreur API:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}