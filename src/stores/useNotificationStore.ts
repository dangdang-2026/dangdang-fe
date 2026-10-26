import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NotificationSettings = {
  // 식사 시작 후 병원 기준 시간에 측정 알림
  measure: boolean
  // 못 봤을 때 10분 뒤 한 번 더
  remind: boolean
  // 잠금화면에 혈당·식사 내용 안 씀. 기본 켜짐
  hideOnLockScreen: boolean
}

type NotificationState = NotificationSettings & {
  updateSettings: (changes: Partial<NotificationSettings>) => void
}

// 알림 설정값만 기기에 저장. 실제 발송은 푸시 연동 후
export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      measure: true,
      remind: true,
      hideOnLockScreen: true,
      updateSettings: (changes) => set(changes),
    }),
    { name: 'dangdang-notification' },
  ),
)
