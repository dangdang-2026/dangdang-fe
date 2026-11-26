import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { hasServerPush } from '@/api/push'
import { ROUTES } from '@/constants/routes'
import { useCriteria } from '@/hooks/useCriteria'
import { canShowAlertBanner } from '@/hooks/useNotificationStream'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { useProfileStore } from '@/stores/useProfileStore'
import type { Meal } from '@/types/glucose'
import { getPendingMeal, getSlotLabel } from '@/utils/glucose'

const MINUTE = 60 * 1000
// 못 보면 10분 뒤 1번만 다시(TODAY-03)
const REMIND_AFTER_MS = 10 * MINUTE
// 앱을 늦게 열었을 때 이만큼 지난 알림까지만 띄움
const LATE_LIMIT_MS = MINUTE

// 같은 끼니 알림을 두 번 띄우지 않게. 예: m1:first, m1:remind
const fired = new Set<string>()

// 앱 안에서 누른 10분 뒤 다시. 화면이 바뀌어도 이 시각에 다시 알림
let snoozed: { mealId: string; at: number } | null = null

const canNotify = () => 'Notification' in window && Notification.permission === 'granted'

// 앱 안 10분 뒤 다시. 서버에 못 맡기면 이 기기에서 다시 알림. 알림을 못 띄우면 false
export function snoozeOnDevice(mealId: string) {
  const { hospitalized, deliveryDate } = useProfileStore.getState()
  if (!canNotify() || !useNotificationStore.getState().measure || hospitalized || deliveryDate) {
    return false
  }
  snoozed = { mealId, at: Date.now() + REMIND_AFTER_MS }
  window.dispatchEvent(new Event('measure-snooze'))
  return true
}

// Figma E-05 측정 알림. 가리기면 수치·끼니 없이
async function showMeasureNotification(meal: Meal, hours: number | null, hide: boolean) {
  const body = hide
    ? '확인할 일이 있어요'
    : `${getSlotLabel('post-meal', meal.type, hours)} 혈당 잴 시간이에요`
  const options: NotificationOptions & { actions?: { action: string; title: string }[] } = {
    body,
    tag: `measure-${meal.id}`,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: `${ROUTES.TODAY_LINK}?sheet=glucose`, tag: `measure-${meal.id}` },
    actions: [
      { action: 'input', title: '지금 입력' },
      { action: 'snooze', title: '10분 뒤 다시' },
    ],
  }
  const registration = await navigator.serviceWorker?.getRegistration()
  if (registration) return registration.showNotification('당당', options)
  // Service Worker가 없으면(개발 서버) 버튼 없이 기본 알림
  const notification = new Notification('당당', { body, tag: options.tag, icon: options.icon })
  notification.onclick = () => {
    window.focus()
    window.dispatchEvent(new CustomEvent('measure-open'))
  }
}

// 앱이 열려 있는 동안 측정 시각에 기기에서 알림. 앱이 닫혀 있을 땐 서버 푸시가 대신함
export function useMeasureReminder() {
  const navigate = useNavigate()
  const meals = useGlucoseStore((state) => state.meals)
  const records = useGlucoseStore((state) => state.records)
  const { postMealHours, measureSlots } = useCriteria()
  const { measure, remind, hideOnLockScreen } = useNotificationStore()
  const paused = useProfileStore(
    (state) => state.hospitalized || state.paused || !!state.deliveryDate,
  )

  useEffect(() => {
    const pending = getPendingMeal(meals, records, postMealHours, new Date(), measureSlots)
    if (!pending || !measure || paused) return
    const { meal, dueAt } = pending
    // 서버에 있는 식사이고 이 기기가 푸시를 받으면 서버가 알림·재알림을 보내 기기 알림은 안 띄움
    const serverPush = !meal.pending && hasServerPush()
    const timers: number[] = []

    const schedule = (key: string, at: number) => {
      const delay = at - Date.now()
      if (fired.has(key) || delay < -LATE_LIMIT_MS) return undefined
      const timer = window.setTimeout(
        () => {
          // 그사이 혈당을 적었으면 띄우지 않음
          const state = useGlucoseStore.getState()
          const still = getPendingMeal(
            state.meals,
            state.records,
            postMealHours,
            new Date(),
            measureSlots,
          )
          if (fired.has(key) || still?.meal.id !== meal.id || !canNotify()) return
          // 서버에 있는 식사이고 실시간 알림이 붙어 있고 화면을 보고 있으면 서버 알림이 배너로 뜨니 기기 알림은 안 띄움
          // 기기 10분 뒤 다시는 서버에 못 맡긴 것이라 그대로 띄움
          const deviceSnooze = key.includes(':snooze:')
          if (!deviceSnooze && !still.meal.pending && canShowAlertBanner()) return
          fired.add(key)
          void showMeasureNotification(meal, postMealHours, hideOnLockScreen)
        },
        Math.max(delay, 0),
      )
      timers.push(timer)
      return timer
    }

    const isSnoozed = () => snoozed?.mealId === meal.id
    let remindTimer: number | undefined
    let snoozeTimer: number | undefined
    // 10분 뒤 다시를 눌렀으면 그 시각에 한 번만. 이전 미루기 · 원래 재알림은 취소
    const scheduleSnooze = () => {
      if (!snoozed || !isSnoozed()) return
      window.clearTimeout(remindTimer)
      window.clearTimeout(snoozeTimer)
      snoozeTimer = schedule(`${meal.id}:snooze:${snoozed.at}`, snoozed.at)
    }

    if (!serverPush) {
      schedule(`${meal.id}:first`, dueAt.getTime())
      if (remind && !isSnoozed()) {
        remindTimer = schedule(`${meal.id}:remind`, dueAt.getTime() + REMIND_AFTER_MS)
      }
    }
    scheduleSnooze()
    window.addEventListener('measure-snooze', scheduleSnooze)

    // 기기 알림의 10분 뒤 다시 버튼. 서버 알림은 서비스 워커가 서버에 미뤄 여기로 안 옴
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'measure-snooze') snoozeOnDevice(meal.id)
    }
    navigator.serviceWorker?.addEventListener('message', handleMessage)
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      window.removeEventListener('measure-snooze', scheduleSnooze)
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
    }
  }, [meals, records, postMealHours, measureSlots, measure, remind, hideOnLockScreen, paused])

  // 알림을 누르면 오늘 탭 혈당 입력 시트로. 서버 알림은 주소(reminderId 포함) 그대로 열어 열람 처리
  useEffect(() => {
    const open = () => navigate(ROUTES.TODAY, { state: { openGlucose: true } })
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'measure-open') return
      const url: unknown = event.data.url
      if (typeof url === 'string' && url.includes('reminderId=')) navigate(url)
      else open()
    }
    navigator.serviceWorker?.addEventListener('message', handleMessage)
    window.addEventListener('measure-open', open)
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
      window.removeEventListener('measure-open', open)
    }
  }, [navigate])
}
