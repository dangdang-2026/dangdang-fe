import { apiClient, type BaseResponse } from '@/api/axios'
import type { InboxItem } from '@/types/notification'
import { addDays, toDateKey } from '@/utils/date'

// 백엔드 MeasureSlot · ReminderStatus
type ServerSlot = 'FASTING' | 'BREAKFAST_AFTER' | 'LUNCH_AFTER' | 'DINNER_AFTER' | 'BEDTIME'
type ReminderStatus = 'SCHEDULED' | 'SENT' | 'OPENED' | 'DONE' | 'SKIPPED' | 'PAUSED' | 'CANCELED'

// 백엔드 ReminderResponse
type ReminderResponse = {
  id: number
  mealId: number | null
  readingId: number | null
  slot: ServerSlot
  scheduledAt: string
  status: ReminderStatus
  sentAt: string | null
  openedAt: string | null
  renotified: boolean
}

// 백엔드 ReminderPageResponse. 페이지 번호 방식
type ReminderPageResponse = {
  items: ReminderResponse[]
  page: number
  size: number
  hasNext: boolean
}

const SLOT_LABEL: Record<ServerSlot, string> = {
  FASTING: '공복',
  BREAKFAST_AFTER: '아침 식후',
  LUNCH_AFTER: '점심 식후',
  DINNER_AFTER: '저녁 식후',
  BEDTIME: '자기 전',
}

// 알림함은 최근 한 달만 보여 줌
const INBOX_DAYS = 30
// 한 번에 받을 수 있는 최대 개수(서버 상한 100)
const PAGE_SIZE = 100

// 측정 알림을 눌러 봤다고 알림. 열면 서버가 10분 뒤 재알림을 보내지 않음. 이미 연 알림도 200
export async function openReminder(id: string) {
  await apiClient.post(`/reminders/${id}/open`)
}

// 서버 알림 → 알림함 한 건. 혈당까지 적은 알림(DONE)은 읽은 걸로 봄
function toInboxItem(item: ReminderResponse & { sentAt: string }): InboxItem {
  return {
    id: String(item.id),
    type: 'measure',
    title: `${SLOT_LABEL[item.slot]} 혈당 잴 시간이에요`,
    sentAt: item.sentAt,
    readAt: item.openedAt ?? (item.status === 'DONE' ? item.sentAt : null),
  }
}

// 최근 한 달 동안 실제로 보낸 측정 알림. 서버가 최신순으로 줌
export async function getInboxReminders(now = new Date()) {
  const items: InboxItem[] = []
  let page = 0
  let hasNext = true
  while (hasNext) {
    const { data } = await apiClient.get<BaseResponse<ReminderPageResponse>>('/reminders', {
      params: {
        from: toDateKey(addDays(now, -INBOX_DAYS)),
        to: toDateKey(now),
        page,
        size: PAGE_SIZE,
      },
    })
    if (!data.data) break
    data.data.items.forEach((item) => {
      // 예약만 되고 아직 안 보낸 알림은 알림함에 안 보임
      if (item.sentAt) items.push(toInboxItem({ ...item, sentAt: item.sentAt }))
    })
    hasNext = data.data.hasNext
    page += 1
  }
  return items
}
