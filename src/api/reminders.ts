import { apiClient, isRetryableError } from '@/api/axios'

// 열람을 못 보낸 측정 알림 번호. 다음 동기화 때 다시 보냄
export const PENDING_OPENS_KEY = 'dangdang-reminder-opens'

// 측정 알림을 눌러 봤다고 알림. 열면 서버가 10분 뒤 재알림을 보내지 않음. 이미 연 알림도 200
export async function openReminder(id: string) {
  await apiClient.post(`/reminders/${id}/open`)
}

function readPendingOpens(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(PENDING_OPENS_KEY) ?? '[]')
    return Array.isArray(saved) ? saved.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

function writePendingOpens(ids: string[]) {
  try {
    if (ids.length > 0) localStorage.setItem(PENDING_OPENS_KEY, JSON.stringify(ids))
    else localStorage.removeItem(PENDING_OPENS_KEY)
  } catch {
    // 저장소를 못 쓰면 다시 보내기만 못 함
  }
}

// 열람 보내기. 끊김 · 서버 오류면 남겨 두고 다음에 다시(재알림이 또 울리지 않게)
export function openReminderLater(id: string) {
  openReminder(id).catch((error: unknown) => {
    if (isRetryableError(error)) writePendingOpens([...new Set([...readPendingOpens(), id])])
  })
}

// 남겨 둔 열람을 다시 보냄. 보낸 것만 지움
export async function retryPendingOpens() {
  const ids = readPendingOpens()
  if (ids.length === 0) return
  const results = await Promise.allSettled(ids.map((id) => openReminder(id)))
  // 보냈거나 다시 해도 안 될 것(지운 알림 등)은 지움
  const done = new Set(
    ids.filter((_, index) => {
      const result = results[index]
      return result.status === 'fulfilled' || !isRetryableError(result.reason)
    }),
  )
  writePendingOpens(readPendingOpens().filter((id) => !done.has(id)))
}

// 측정 알림 10분 뒤 다시. 서버가 10분 뒤 한 번 더 보냄
export async function snoozeReminder(id: string) {
  await apiClient.post(`/reminders/${id}/snooze`)
}
