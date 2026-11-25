import { create } from 'zustand'
import type { InboxItem } from '@/types/notification'

// 지금 화면 위에 보이는 앱 안 알림 배너. 새 알림이 오면 앞 배너를 바꿈
export const useAlertBannerStore = create<{ item: InboxItem | null }>()(() => ({ item: null }))

export function showAlertBanner(item: InboxItem) {
  useAlertBannerStore.setState({ item })
}

export function hideAlertBanner() {
  useAlertBannerStore.setState({ item: null })
}
