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
  // 공복 측정 알림 시각. 식사 시작이 없어 정한 시각에 알림. 예: 07:00
  fastingTime: string
  updateSettings: (changes: Partial<NotificationSettings>) => void
  setFastingTime: (time: string) => void
}

// 알림 설정값만 기기에 저장. 실제 발송은 푸시 연동 후
export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      measure: true,
      remind: true,
      hideOnLockScreen: true,
      fastingTime: '07:00',
      updateSettings: (changes) => set(changes),
      setFastingTime: (fastingTime) => set({ fastingTime }),
    }),
    { name: 'dangdang-notification' },
  ),
)
