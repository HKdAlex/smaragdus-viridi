import { NextRequest, NextResponse } from 'next/server'

import { chatService } from '@/features/chat'
import { createContextLogger } from '@/shared/utils/logger'
import { createServerClient } from '@/lib/supabase-server'

const logger = createContextLogger('chat-read-api')

// POST /api/chat/[messageId]/read - Mark a message as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params

    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      )
    }

    const response = await chatService.markAsRead(messageId, user.id)

    if (response.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: response.error },
        { status: 500 }
      )
    }

  } catch (error) {
    logger.error('Failed to mark message as read', error as Error, {
      messageId: (await params).messageId
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
