// Secure server action example for Next.js App Router (typescript)
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    // Only server-side environment variables (service role) used here
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { user_id, pickup, dropoff, fare } = body

    // Validate inputs server-side
    if (!user_id || !pickup || !dropoff) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Insert ride using service_role key on the server only
    const { data, error } = await supabase
      .from('rides')
      .insert([{ user_id, pickup, dropoff, fare }])
      .select()

    if (error) {
      console.error('Supabase insert error', error)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, ride: data })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
