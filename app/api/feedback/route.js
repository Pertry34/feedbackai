import { createClient } from '@supabase/supabase-js'

// Utilise la service role key qui bypass le RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { content, source, user_id, rating } = await request.json()

    if (!content || !user_id) {
      return Response.json({ error: 'Champs manquants' }, { status: 400 })
    }

    const { data, error } = await supabase
    .from('feedbacks')
    .insert([{ content, source, user_id, rating: rating ?? null }])
    .select()

    if (error) throw error

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