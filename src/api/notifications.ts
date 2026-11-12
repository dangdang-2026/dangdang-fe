import { apiClient, type BaseResponse } from '@/api/axios'
import type { InboxItem, InboxType } from '@/types/notification'
import { addDays } from '@/utils/date'

// 백엔드 NotificationType
type ServerType = 'MEASURE' | 'VISIT_BEFORE' | 'VISIT_TODAY' | 'VISIT_NOTE' | 'POSTPARTUM'

// 백엔드 NotificationResponse
type NotificationResponse = {
  id: number
  type: ServerType
  title: string
  body: string | null
  deepLink: string
  sentAt: string
  readAt: string | null
}

// 백엔드 NotificationPageResponse. 페이지 번호 방식, 최신순
type NotificationPageResponse = {
  items: NotificationResponse[]
  page: number
  size: number
  hasNext: boolean
}

const TYPE: Record<ServerType, InboxType> = {
  MEASURE: 'measure',
  VISIT_BEFORE: 'visitBefore',
  VISIT_TODAY: 'visitToday',
  VISIT_NOTE: 'visitNote',
  POSTPARTUM: 'postpartum',
}

// 알림함은 최근 한 달만 보여 줌
const INBOX_DAYS = 30
// 한 번에 받을 수 있는 최대 개수(서버 상한 100)
const PAGE_SIZE = 100

function toInboxItem(item: NotificationResponse): InboxItem {
  return {
    id: String(item.id),
    type: TYPE[item.type],
    title: item.title,
    body: item.body ?? undefined,
    link: item.deepLink,
    sentAt: item.sentAt,
    readAt: item.readAt,
  }
}

// 최근 한 달 받은 알림. 최신순이라 한 달보다 오래된 알림이 나오면 그만 받음
export async function getNotifications(now = new Date()) {
  const since = addDays(now, -INBOX_DAYS).getTime()
  const items: InboxItem[] = []
  let page = 0
  let hasNext = true
  while (hasNext) {
    const { data } = await apiClient.get<BaseResponse<NotificationPageResponse>>('/notifications', {
      params: { page, size: PAGE_SIZE },
    })
    if (!data.data) break
    const recent = data.data.items.filter((item) => new Date(item.sentAt).getTime() >= since)
    // 앱이 모르는 새 종류는 그릴 아이콘이 없어 빼 둠
    items.push(...recent.filter((item) => item.type in TYPE).map(toInboxItem))
    hasNext = data.data.hasNext && recent.length === data.data.items.length
    page += 1
  }
  return items
}

// 알림함 알림 읽음 처리. 이미 읽은 알림도 처음 읽은 시각 그대로 200
export async function readNotification(id: string) {
  await apiClient.patch(`/notifications/${id}/read`)
}
