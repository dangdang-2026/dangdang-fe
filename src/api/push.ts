import { apiClient, type BaseResponse } from '@/api/axios'
import { useNotificationStore } from '@/stores/useNotificationStore'

// 서버(VAPID) 공개키. 없으면 푸시 구독 없이 앱이 열려 있을 때 알림만
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
// 구독 해제 때 쓸 서버 구독 번호
const SUBSCRIPTION_ID_KEY = 'dangdang-push-subscription-id'
// 서버 userAgent 최대 길이
const USER_AGENT_MAX = 255

// 백엔드 PushSubscriptionResponse
type PushSubscriptionResponse = { subscriptionId: number }

// base64url 공개키 → pushManager가 받는 바이트
function toKeyBytes(base64: string) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))
}

// 알림 권한을 받은 뒤 푸시 구독을 만들어 서버에 등록. 같은 기기면 서버가 지금 계정으로 다시 씀
export async function subscribePush() {
  if (!VAPID_PUBLIC_KEY || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null
  }
  const registration = await navigator.serviceWorker.ready
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toKeyBytes(VAPID_PUBLIC_KEY),
    }))
  const { endpoint, keys } = subscription.toJSON()
  const { data } = await apiClient.post<BaseResponse<PushSubscriptionResponse>>(
    '/push-subscriptions',
    { endpoint, keys, userAgent: navigator.userAgent.slice(0, USER_AGENT_MAX) },
  )
  if (data.data) localStorage.setItem(SUBSCRIPTION_ID_KEY, String(data.data.subscriptionId))
  return subscription
}

// 서버에 구독이 등록된 기기인지. 서버 푸시와 기기 알림이 겹치지 않게 씀
export function hasServerPush() {
  return localStorage.getItem(SUBSCRIPTION_ID_KEY) !== null
}

// 로그인·앱 열 때 측정 알림이 켜져 있고 권한이 있으면 구독을 서버에 다시 등록
export function syncPushSubscription() {
  const granted = 'Notification' in window && Notification.permission === 'granted'
  if (!granted || !useNotificationStore.getState().measure) return
  subscribePush().catch(() => {})
}

// 측정 알림을 끄거나 로그아웃하면 서버 구독을 끊고 브라우저 구독도 지움
export async function unsubscribePush() {
  const id = localStorage.getItem(SUBSCRIPTION_ID_KEY)
  if (id) {
    // 이미 끊겼거나 다른 계정 구독이면 404라 그냥 넘어감
    await apiClient.delete(`/push-subscriptions/${id}`).catch(() => {})
    localStorage.removeItem(SUBSCRIPTION_ID_KEY)
  }
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  await subscription?.unsubscribe()
}
