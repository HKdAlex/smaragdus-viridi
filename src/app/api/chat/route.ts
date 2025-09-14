import { NextRequest, NextResponse } from 'next/server'

import { chatService } from '@/features/chat'
import { createServerClient } from '@/lib/supabase-server'
import { createContextLogger } from '@/shared/utils/logger'
import { z } from 'zod'

const logger = createContextLogger('chat-api')

// GET /api/chat - Get user's chat messages
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    const response = await chatService.getMessages(user.id, limit, offset)

    if (response.success) {
      return NextResponse.json({
        success: true,
        messages: response.messages,
        hasMore: response.hasMore
      })
    } else {
      return NextResponse.json(
        { error: response.error },
        { status: 500 }
      )
    }

  } catch (error) {
    logger.error('Failed to fetch chat messages', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/chat - Send a new chat message
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate request body
    const messageSchema = z.object({
      content: z.string().min(1).max(2000),
      attachments: z.array(z.instanceof(File)).optional(),
    })

    const validationResult = messageSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { content, attachments } = validationResult.data

    const response = await chatService.sendMessage(user.id, {
      content,
      attachments
    })

    if (response.success) {
      return NextResponse.json({
        success: true,
        message: response.message
      }, { status: 201 })
    } else {
      return NextResponse.json(
        { error: response.error },
        { status: 500 }
      )
    }

  } catch (error) {
    logger.error('Failed to send chat message', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
