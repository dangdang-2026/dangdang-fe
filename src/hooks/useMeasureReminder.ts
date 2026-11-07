import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { ROUTES } from '@/constants/routes'
import { useCriteria } from '@/hooks/useCriteria'
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

const canNotify = () => 'Notification' in window && Notification.permission === 'granted'

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
    data: { url: `${ROUTES.TODAY}?measure=1`, tag: `measure-${meal.id}` },
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
  const { postMealHours } = useCriteria()
  const { measure, remind, hideOnLockScreen } = useNotificationStore()
  const paused = useProfileStore((state) => state.hospitalized || !!state.deliveryDate)

  useEffect(() => {
    const pending = getPendingMeal(meals, records, postMealHours, new Date())
    if (!pending || !measure || paused) return
    const { meal, dueAt } = pending
    const timers: number[] = []

    const schedule = (key: string, at: number) => {
      const delay = at - Date.now()
      if (fired.has(key) || delay < -LATE_LIMIT_MS) return
      timers.push(
        window.setTimeout(
          () => {
            // 그사이 혈당을 적었으면 띄우지 않음
            const state = useGlucoseStore.getState()
            const still = getPendingMeal(state.meals, state.records, postMealHours, new Date())
            if (fired.has(key) || still?.meal.id !== meal.id || !canNotify()) return
            fired.add(key)
            void showMeasureNotification(meal, postMealHours, hideOnLockScreen)
          },
          Math.max(delay, 0),
        ),
      )
    }

    schedule(`${meal.id}:first`, dueAt.getTime())
    if (remind) schedule(`${meal.id}:remind`, dueAt.getTime() + REMIND_AFTER_MS)

    // 알림의 10분 뒤 다시 버튼
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'measure-snooze') {
        schedule(`${meal.id}:snooze`, Date.now() + REMIND_AFTER_MS)
      }
    }
    navigator.serviceWorker?.addEventListener('message', handleMessage)
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
    }
  }, [meals, records, postMealHours, measure, remind, hideOnLockScreen, paused])

  // 알림을 누르면 오늘 탭 혈당 입력 시트로
  useEffect(() => {
    const open = () => navigate(ROUTES.TODAY, { state: { openGlucose: true } })
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'measure-open') open()
    }
    navigator.serviceWorker?.addEventListener('message', handleMessage)
    window.addEventListener('measure-open', open)
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
      window.removeEventListener('measure-open', open)
    }
  }, [navigate])
}
