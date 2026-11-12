// 받은 알림 종류. 인슐린 알림은 없음
export type InboxType = 'measure' | 'visitBefore' | 'visitToday' | 'visitNote' | 'postpartum'

// 알림함에 쌓인 받은 알림 한 건
export type InboxItem = {
  id: string
  type: InboxType
  title: string
  body?: string
  // 누르면 갈 앱 안 주소. 예: /today?sheet=glucose&reminderId=1
  link?: string
  sentAt: string
  // 안 읽었으면 null
  readAt: string | null
}
