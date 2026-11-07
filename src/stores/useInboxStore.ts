import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createMockInbox } from '@/mocks/notifications'
import type { InboxItem } from '@/types/notification'

type InboxState = {
  // 최신 순
  items: InboxItem[]
  markRead: (id: string, now?: Date) => void
}

// API 연동 전까지 기기(localStorage)에 저장
export const useInboxStore = create<InboxState>()(
  persist(
    (set) => ({
      items: createMockInbox(),
      markRead: (id, now = new Date()) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id && !item.readAt ? { ...item, readAt: now.toISOString() } : item,
          ),
        })),
    }),
    { name: 'dangdang-inbox' },
  ),
)
