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

// 기기 알림 설정 중 서버에 저장하는 값
export type NotificationPreferences = {
  measure: boolean
  remind: boolean
  hideOnLockScreen: boolean
  fastingTime: string
}

// 서버 알림 설정 → 기기 알림 설정
function toSettings(data: NotificationPreferenceResponse): NotificationPreferences {
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

// 바꾼 칸만 서버에 저장. 안 보낸 칸은 서버가 그대로 둠
export async function updateNotificationPreferences(changes: Partial<NotificationPreferences>) {
  const { data } = await apiClient.patch<BaseResponse<NotificationPreferenceResponse>>(
    '/me/notification-preferences',
    {
      measurementEnabled: changes.measure,
      renotifyEnabled: changes.remind,
      hideContent: changes.hideOnLockScreen,
      fastingAlarmTime: changes.fastingTime,
    },
  )
  if (!data.data) throw new Error('알림 설정 응답이 비어 있음')
  return toSettings(data.data)
}
