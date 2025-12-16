import { NextResponse } from 'next/server'
import { env } from '@/env'

/**
 * API route to securely provide the Simpel Kredit API token to the client
 * This keeps the token out of client-side code and environment variables
 */
export async function GET() {
  try {
    const token = env.SIMPEL_KREDIT_TOKEN

    if (!token) {
      return NextResponse.json({ error: 'API token not configured' }, { status: 500 })
    }

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Failed to retrieve API token:', error)
    return NextResponse.json({ error: 'Failed to retrieve API token' }, { status: 500 })
  }
}

