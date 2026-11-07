import { apiClient } from '@/api/axios'

// API 확정 전까지 서버로 보내지 않음
const USE_MOCK = true
// 서버(VAPID) 공개키. 없으면 푸시 구독 없이 앱이 열려 있을 때 알림만
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

// base64url 공개키 → pushManager가 받는 바이트
function toKeyBytes(base64: string) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))
}

// 알림 권한을 받은 뒤 푸시 구독을 만들어 서버에 등록. 경로는 API 확정 전 가정
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
  if (!USE_MOCK) await apiClient.post('/push/subscriptions', subscription.toJSON())
  return subscription
}

// 알림을 끄면 구독도 지움
export async function unsubscribePush() {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return
  if (!USE_MOCK) {
    await apiClient.delete('/push/subscriptions', { data: { endpoint: subscription.endpoint } })
  }
  await subscription.unsubscribe()
}
