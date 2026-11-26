import { useNavigate } from 'react-router'
import { ROUTES } from '@/constants/routes'
import { readInboxItem } from '@/stores/useInboxStore'
import type { InboxItem, InboxType } from '@/types/notification'

// 서버 주소가 없을 때 가는 곳. 측정 알림은 홈에서 혈당 입력 시트를 바로 엶
const TARGET: Record<InboxType, { to: string; state?: object }> = {
  measure: { to: ROUTES.TODAY, state: { openGlucose: true } },
  visitBefore: { to: ROUTES.VISIT_REPORT },
  visitToday: { to: ROUTES.VISIT_REPORT },
  visitNote: { to: ROUTES.VISIT_NOTE },
  postpartum: { to: ROUTES.POSTPARTUM_CHECK },
  // 광고 받기 토글이 있는 알림 설정
  marketing: { to: ROUTES.MY_NOTIFICATIONS },
}

// 알림을 누르면 읽음 표시하고 그 화면으로. 알림함 · 앱 안 배너 같이 씀
export function useOpenInboxItem() {
  const navigate = useNavigate()
  return (item: InboxItem) => {
    readInboxItem(item.id)
    // 서버가 준 주소가 있으면 그리로. 측정 알림은 혈당 입력 시트를 열고 열람 처리까지 됨
    if (item.link) {
      navigate(item.link)
      return
    }
    const { to, state } = TARGET[item.type]
    navigate(to, { state })
  }
}
