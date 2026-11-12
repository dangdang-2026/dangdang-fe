import { apiClient, type BaseResponse } from '@/api/axios'

// 백엔드 NotificationPreferenceResponse. 시각은 HH:mm
type NotificationPreferenceResponse = {
  measurementEnabled: boolean
  scheduleEnabled: boolean
  hideContent: boolean
  renotifyEnabled: boolean
  fastingAlarmTime: string
  bedtimeAlarmTime: string
  updatedAt: string
}

// 서버 알림 설정 → 기기 알림 설정
function toSettings(data: NotificationPreferenceResponse) {
  return {
    measure: data.measurementEnabled,
    remind: data.renotifyEnabled,
    hideOnLockScreen: data.hideContent,
    fastingTime: data.fastingAlarmTime,
  }
}

// 내 알림 설정 조회. 한 번도 안 바꾼 계정은 서버 기본값(모두 켜짐, 공복 07:00)
export async function getNotificationPreferences() {
  const { data } = await apiClient.get<BaseResponse<NotificationPreferenceResponse>>(
    '/me/notification-preferences',
  )
  if (!data.data) throw new Error('알림 설정 응답이 비어 있음')
  return toSettings(data.data)
}
