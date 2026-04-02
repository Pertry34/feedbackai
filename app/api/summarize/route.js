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

    await supabase
      .from('feedbacks')
      .update({ summary, sentiment })
      .eq('id', feedbackId)

    return Response.json({ summary, sentiment })

  } catch (error) {
    console.error('Erreur API:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}