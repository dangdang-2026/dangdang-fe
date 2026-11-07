// 당당 Service Worker: 화면 파일 캐시 · 측정 알림(Web Push) 받기 · 알림 누르면 혈당 입력으로
// R8 건강정보는 캐시하지 않음 → /api/ 는 항상 네트워크만

const CACHE = 'dangdang-shell-v1'
const SHELL = ['/', '/manifest.webmanifest', '/icons/app-icon.svg', '/icons/icon-192.png']
// 알림을 누르면 열 주소. 오늘 탭이 혈당 입력 시트를 바로 엶
const MEASURE_URL = '/?measure=1'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  // 건강정보 응답은 캐시 금지
  if (url.pathname.startsWith('/api/')) return

  // 화면 이동: 네트워크 먼저, 끊기면 저장해 둔 첫 화면
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')))
    return
  }

  // 빌드 파일(이름에 해시)은 한 번 받으면 캐시에서
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone()
              caches.open(CACHE).then((cache) => cache.put(request, copy))
            }
            return response
          }),
      ),
    )
  }
})

// 서버 푸시. 잠금화면 가리기는 서버가 사용자 설정을 보고 문구를 정해 보냄
// payload 예: { title, body, tag, url }
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  event.waitUntil(
    self.registration.showNotification(data.title || '당당', {
      body: data.body || '확인할 일이 있어요',
      tag: data.tag || 'measure',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || MEASURE_URL, tag: data.tag },
      actions: [
        { action: 'input', title: '지금 입력' },
        { action: 'snooze', title: '10분 뒤 다시' },
      ],
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const { url = MEASURE_URL, tag } = event.notification.data || {}

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // 10분 뒤 다시: 열린 화면에 알려 다시 예약(앱이 닫혀 있으면 서버가 다시 보냄)
      if (event.action === 'snooze') {
        clients.forEach((client) => client.postMessage({ type: 'measure-snooze', tag }))
        return undefined
      }
      const client = clients.find((item) => 'focus' in item)
      if (client) {
        client.postMessage({ type: 'measure-open', url })
        return client.focus()
      }
      return self.clients.openWindow(url)
    }),
  )
})
