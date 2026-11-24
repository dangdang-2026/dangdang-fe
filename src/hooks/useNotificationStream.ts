import { useEffect } from 'react'
import { getMe } from '@/api/me'
import { openNotificationStream } from '@/api/notifications'
import { showAlertBanner } from '@/stores/useAlertBannerStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { receiveInboxItem, syncInbox } from '@/stores/useInboxStore'

// 서버가 거절했을 때 다시 붙기까지 기다림. 실패할수록 2배, 최대 1분
const RETRY_MIN_MS = 3000
const RETRY_MAX_MS = 60 * 1000

// 지금 실시간 알림이 붙어 있는지. 서비스 워커가 시스템 알림을 띄울지 물어볼 때 답함
let streamConnected = false

// 실시간 알림이 붙어 있으면 서버 알림이 배너로 뜸. 기기 측정 알림이 겹치지 않게 확인용
export function isNotificationStreamConnected() {
  return streamConnected
}

// 로그인한 동안 새 알림을 실시간으로 받아 알림함에 넣음. 로그아웃 · 계정 바뀌면 끊음
export function useNotificationStream() {
  const accountKey = useAuthStore((state) =>
    state.account ? `${state.account.method}|${state.account.email ?? ''}` : null,
  )

  // 붙어 있으면 배너가 뜨니 서비스 워커는 같은 푸시를 시스템 알림으로 띄우지 않음
  useEffect(() => {
    const container = navigator.serviceWorker
    if (!container) return
    const handleMessage = (event: MessageEvent<{ type?: string } | null>) => {
      if (event.data?.type !== 'notification-stream-status') return
      event.ports[0]?.postMessage({ connected: streamConnected })
    }
    container.addEventListener('message', handleMessage)
    return () => container.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    if (!accountKey) return
    let close: (() => void) | null = null
    let timer: number | undefined
    let retryMs = RETRY_MIN_MS
    let connectedOnce = false
    let stopped = false

    const connect = () => {
      close = openNotificationStream({
        onConnected: () => {
          streamConnected = true
          retryMs = RETRY_MIN_MS
          // 다시 붙었으면 끊긴 사이 온 알림을 알림함으로 맞춤
          if (connectedOnce) syncInbox().catch(() => {})
          connectedOnce = true
        },
        onNotification: (item) => {
          // 처음 받은 알림만, 앱을 보고 있을 때만 배너로. 알림함에는 늘 남음
          if (receiveInboxItem(item) && document.visibilityState === 'visible') {
            showAlertBanner(item)
          }
        },
        onDisconnected: () => {
          streamConnected = false
        },
        // 로그인 만료일 수 있어 서버 확인(만료면 인터셉터가 재발급, 실패면 로그아웃) 뒤 다시 붙음
        onClosed: () => {
          close?.()
          close = null
          timer = window.setTimeout(() => {
            getMe()
              .catch(() => {})
              .finally(() => {
                // 그사이 온라인 복귀로 이미 붙었으면 두 번 붙지 않음
                if (!stopped && !close) connect()
              })
          }, retryMs)
          retryMs = Math.min(retryMs * 2, RETRY_MAX_MS)
        },
      })
    }

    // 오프라인에서 돌아오면 기다리지 않고 바로 다시 붙음
    const handleOnline = () => {
      if (close) return
      window.clearTimeout(timer)
      retryMs = RETRY_MIN_MS
      connect()
    }

    connect()
    window.addEventListener('online', handleOnline)
    return () => {
      stopped = true
      window.clearTimeout(timer)
      window.removeEventListener('online', handleOnline)
      close?.()
      streamConnected = false
    }
  }, [accountKey])
}
