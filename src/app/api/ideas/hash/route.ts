import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

/* ---------------------------
   Supabase server client
--------------------------- */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/* ---------------------------
   Type for idea row
--------------------------- */

type IdeaRow = {
  id: string
  user_id: string
  title: string | null
  tagline: string | null
  impact: string | null
  category: string | null
  verification_code: string | null
  evidence_version: number | null
  feature_requested: boolean | null
  ppa_requested: boolean | null
  protected: boolean | null
  created_at: string | null
  submitted_at: string | null
  idea_hash: string | null
}

/* ---------------------------
   Stable stringify
--------------------------- */

function stableStringify(value: any): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }

  const keys = Object.keys(value).sort()
  const props = keys.map(
    (k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`
  )

  return `{${props.join(',')}}`
}

/* ---------------------------
   SHA256 helper
--------------------------- */

function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex')
}

/* ---------------------------
   API Route
--------------------------- */

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const ideaId = body?.ideaId

    if (!ideaId) {
      return NextResponse.json(
        { ok: false, error: 'Missing ideaId' },
        { status: 400 }
      )
    }

    /* ---------------------------
       1️⃣ Load idea
    --------------------------- */

    const { data: idea, error: ideaErr } = await supabase
      .from('ideas')
      .select(`
        id,
        user_id,
        title,
        tagline,
        impact,
        category,
        submitted_at,
        created_at,
        verification_code,
        evidence_version,
        feature_requested,
        ppa_requested,
        protected,
        idea_hash
      `)
      .eq('id', ideaId)
      .single<IdeaRow>()

    if (ideaErr || !idea) {
      return NextResponse.json(
        { ok: false, error: 'Idea not found' },
        { status: 404 }
      )
    }

    /* ---------------------------
       2️⃣ Prevent re-hash
    --------------------------- */

    if (idea.idea_hash) {
      return NextResponse.json({
        ok: true,
        alreadyHashed: true,
        ideaHash: idea.idea_hash
      })
    }

    /* ---------------------------
       3️⃣ Build canonical payload
    --------------------------- */

    const payload = {
      payload_version: 1,
      idea_id: idea.id,
      user_id: idea.user_id,

      title: idea.title ?? '',
      tagline: idea.tagline ?? '',
      impact: idea.impact ?? '',
      category: idea.category ?? 'General',

      protected: !!idea.protected,

      verification_code: idea.verification_code ?? null,
      evidence_version: idea.evidence_version ?? 1,

      feature_requested: !!idea.feature_requested,
      ppa_requested: !!idea.ppa_requested,

      submitted_at:
        idea.submitted_at ??
        idea.created_at ??
        new Date().toISOString()
    }

    const canonical = stableStringify(payload)
    const hash = sha256Hex(canonical)

    /* ---------------------------
       4️⃣ Store hash
    --------------------------- */

    const { error: updateErr } = await supabase
      .from('ideas')
      .update({
        idea_hash: hash,
        hash_alg: 'sha256',
        hashed_at: new Date().toISOString(),
        hash_payload_version: 1
      })
      .eq('id', ideaId)

    if (updateErr) {
      throw updateErr
    }

    await supabase
  .from('idea_audit_log')
  .insert({
    idea_id: idea.id,
    user_id: idea.user_id,
    event_type: 'idea_hash_generated',
    event_data: {
      hash: hash,
      algorithm: 'sha256'
    }
  });

    /* ---------------------------
       5️⃣ Success
    --------------------------- */

    return NextResponse.json({
      ok: true,
      ideaHash: hash
    })

  } catch (error: any) {
    console.error('Hash generation error:', error)

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'Hashing failed'
      },
      { status: 500 }
    )
  }
}