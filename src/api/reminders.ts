import { apiClient } from '@/api/axios'

// 측정 알림을 눌러 봤다고 알림. 열면 서버가 10분 뒤 재알림을 보내지 않음. 이미 연 알림도 200
export async function openReminder(id: string) {
  await apiClient.post(`/reminders/${id}/open`)
}
