import { NextRequest, NextResponse } from 'next/server'

import { chatService } from '@/features/chat'
import { createContextLogger } from '@/shared/utils/logger'
import { createServerClient } from '@/lib/supabase-server'

const logger = createContextLogger('admin-chat-api')

// GET /api/admin/chat/conversations - Get all chat conversations for admin
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

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single() as {
        data: { role: string } | null
        error: any
      }

    if (profileError || userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const response = await chatService.getConversations()

    if (response.success) {
      return NextResponse.json({
        success: true,
        conversations: response.conversations
      })
    } else {
      return NextResponse.json(
        { error: response.error },
        { status: 500 }
      )
    }

  } catch (error) {
    logger.error('Failed to fetch chat conversations', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
