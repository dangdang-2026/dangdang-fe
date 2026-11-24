import { useEffect, useState } from 'react'
import notificationFace from '@/assets/images/dangdang/notification.svg'
import { useOpenInboxItem } from '@/hooks/useOpenInboxItem'
import { hideAlertBanner, useAlertBannerStore } from '@/stores/useAlertBannerStore'
import type { InboxItem } from '@/types/notification'

// Figma 앱 안 알림 배너: 4초 뒤 위로 사라지고 알림함에는 남음
const SHOW_MS = 4000
// 사라지는 애니메이션(alert-out 0.25s)이 끝난 뒤 내림
const LEAVE_MS = 250

// 보낸 지 1분 안이면 방금, 그 뒤는 N분 전
function formatSentAt(sentAt: string) {
  const minutes = Math.floor((Date.now() - new Date(sentAt).getTime()) / 60000)
  return minutes < 1 ? '방금' : `${minutes}분 전`
}

type BannerProps = {
  item: InboxItem
  onOpen: () => void
}

function Banner({ item, onOpen }: BannerProps) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setLeaving(true), SHOW_MS)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!leaving) return
    const timer = window.setTimeout(hideAlertBanner, LEAVE_MS)
    return () => window.clearTimeout(timer)
  }, [leaving])

  return (
    <button
      type="button"
      className={`border-divider shadow-alert rounded-banner pointer-events-auto flex w-full flex-col gap-2 border bg-white px-4 pt-3.5 pb-4 text-left motion-reduce:animate-none ${
        leaving ? 'animate-alert-out' : 'animate-alert-in'
      }`}
      onClick={onOpen}
    >
      <span className="flex items-center gap-1.5">
        <span className="flex size-5.5 items-center justify-center rounded-md bg-yellow-50">
          <img src={notificationFace} alt="" width={16} height={16} />
        </span>
        <span className="text-t7 text-grey-900 font-bold">당당</span>
        <span className="text-grey-600 text-xs leading-normal">{formatSentAt(item.sentAt)}</span>
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-t6 text-grey-900 font-bold">{item.title}</span>
        {item.body && <span className="text-grey-700 text-sm leading-normal">{item.body}</span>}
      </span>
    </button>
  )
}

// 앱이 열려 있을 때 새 알림을 화면 위에서 보여 줌. 누르면 그 화면으로 + 읽음
function AlertBanner() {
  const item = useAlertBannerStore((state) => state.item)
  const openItem = useOpenInboxItem()
  if (!item) return null

  return (
    <div
      role="status"
      className="pointer-events-none fixed top-[max(--spacing(3),env(safe-area-inset-top))] left-1/2 z-60 w-full max-w-107.5 -translate-x-1/2 px-3"
    >
      {/* 새 알림이 오면 key로 새 배너를 띄워 4초를 다시 셈 */}
      <Banner
        key={item.id}
        item={item}
        onOpen={() => {
          hideAlertBanner()
          openItem(item)
        }}
      />
    </div>
  )
}

export default AlertBanner
