import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getInboxReminders, openReminder } from '@/api/reminders'
import type { InboxItem } from '@/types/notification'

type InboxState = {
  // 최신 순
  items: InboxItem[]
  markRead: (id: string, now?: Date) => void
}

// 서버 측정 알림을 받아 기기에도 저장. 오프라인에서도 마지막 목록을 보여 줌
export const useInboxStore = create<InboxState>()(
  persist(
    (set) => ({
      items: [],
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

// 서버 알림 목록으로 바꿈
export async function syncInbox() {
  const items = await getInboxReminders()
  useInboxStore.setState({ items })
}

// 알림함에서 누르면 읽음 표시하고 서버에도 열람 처리. 실패해도 화면은 읽음으로
export function readInboxItem(id: string) {
  useInboxStore.getState().markRead(id)
  openReminder(id).catch(() => {})
}
