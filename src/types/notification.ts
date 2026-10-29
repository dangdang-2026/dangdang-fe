// 받은 알림 종류. 인슐린 알림은 없음
export type InboxType = 'measure' | 'visitBefore' | 'visitToday' | 'visitNote' | 'postpartum'

// 알림함에 쌓인 받은 알림 한 건
export type InboxItem = {
  id: string
  type: InboxType
  title: string
  body?: string
  sentAt: string
  // 안 읽었으면 null
  readAt: string | null
}
