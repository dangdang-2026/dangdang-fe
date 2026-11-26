import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { getConsents, saveMarketingConsent } from '@/api/consent'
import { hasServerPush, sendTestPush, syncPushSubscription, unsubscribePush } from '@/api/push'
import iconAlertMd from '@/assets/icons/alert-md.svg'
import iconCheckBlue from '@/assets/icons/check-blue.svg'
import notificationFace from '@/assets/images/dangdang/notification.svg'
import ConfirmSheet from '@/components/common/ConfirmSheet'
import SubPageHeader from '@/components/common/SubPageHeader'
import NotificationGuideSheet from '@/components/my/NotificationGuideSheet'
import Switch from '@/components/common/Switch'
import Toast from '@/components/common/Toast'
import { ROUTES } from '@/constants/routes'
import { useCriteria } from '@/hooks/useCriteria'
import { useGoBack } from '@/hooks/useGoBack'
import {
  saveNotificationSettings,
  useNotificationStore,
  type NotificationSettings,
} from '@/stores/useNotificationStore'
import { marketingResultText } from '@/utils/consent'
import { formatDuration } from '@/utils/criteria'

type Permission = NotificationPermission | 'unsupported'

const readPermission = (): Permission =>
  'Notification' in window ? Notification.permission : 'unsupported'

// 홈 화면에 설치한 PWA로 열었는지
const isInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

const PERMISSION_LABEL: Record<Permission, string> = {
  granted: '알림 권한 허용됨',
  denied: '알림 권한이 꺼져 있어요 · 설정에서 켜 주세요',
  default: '알림 권한을 아직 안 정했어요',
  unsupported: '이 브라우저는 알림을 지원하지 않아요',
}

// 권한을 못 받았을 때 안내. 거절이면 켜는 방법 시트로
const PERMISSION_TOAST: Record<Exclude<Permission, 'granted' | 'denied'>, string> = {
  default: '알림 권한을 켜야 받을 수 있어요',
  unsupported: '이 브라우저는 알림을 지원하지 않아요',
}

function StatusRow({ ok, warn, text }: { ok: boolean; warn?: boolean; text: string }) {
  return (
    <li className="flex items-center gap-2">
      <img src={ok ? iconCheckBlue : iconAlertMd} alt="" width={16} height={16} />
      <span className={`text-sm leading-normal ${warn ? 'text-red-500' : 'text-grey-800'}`}>
        {text}
      </span>
    </li>
  )
}

// Figma M-04 알림 · M-05 권한 꺼짐
function NotificationsPage() {
  const goBack = useGoBack(ROUTES.MY)
  const navigate = useNavigate()
  // 광고성 정보 받기. 서버 동의 값을 못 받으면 줄을 안 보여 줌
  const [marketing, setMarketing] = useState<boolean | null>(null)
  useEffect(() => {
    getConsents()
      .then((items) =>
        setMarketing(items.find((item) => item.type === 'MARKETING')?.granted ?? false),
      )
      .catch(() => {})
  }, [])
  const { measure, remind, hideOnLockScreen } = useNotificationStore()
  const { postMealHours } = useCriteria()
  const [permission, setPermission] = useState(readPermission)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])
  // 측정 알림 끄기 확인 · 알림 켜는 방법
  const [confirmOff, setConfirmOff] = useState(false)
  const [guide, setGuide] = useState(false)
  const closeGuide = useCallback(() => setGuide(false), [])

  const previewText = hideOnLockScreen
    ? '확인할 일이 있어요'
    : `식후 ${formatDuration(postMealHours ?? 1)} 혈당을 잴 시간이에요`

  const rows: { key: keyof NotificationSettings; title: string; description: string }[] = [
    { key: 'measure', title: '측정 알림', description: '식사 시작 후 병원에서 정한 시간에' },
    { key: 'remind', title: '10분 뒤 다시', description: '못 봤을 때 한 번만 더 알려요' },
    {
      key: 'hideOnLockScreen',
      title: '잠금화면 문구 가리기',
      description: '혈당·식사 내용을 알림에 쓰지 않아요',
    },
  ]
  // 권한이 없으면 측정 알림이 실제로 안 와서 꺼진 걸로 보여 줌. 홈 알림 꺼짐 배너와 같은 기준
  const values: NotificationSettings = {
    measure: measure && permission === 'granted',
    remind,
    hideOnLockScreen,
  }

  // 설정 앱에서 권한을 바꾸고 돌아오면 다시 읽음
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') setPermission(readPermission())
    }
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  // 아직 안 정했으면 권한을 물어봄. 거절·미지원이면 안내 토스트
  const askPermission = async () => {
    const next = permission === 'default' ? await Notification.requestPermission() : permission
    setPermission(next)
    if (next === 'denied') setGuide(true)
    else if (next !== 'granted') setToast(PERMISSION_TOAST[next])
    return next === 'granted'
  }

  const changeSetting = async (key: keyof NotificationSettings, checked: boolean) => {
    // 권한 없이 측정 알림을 켜면 알림이 안 와서 권한부터 받음
    if (key === 'measure' && checked && !(await askPermission())) return
    // 측정 알림을 끄면 진료 기록이 빌 수 있어 한 번 더 확인
    if (key === 'measure' && !checked && !confirmOff) {
      setConfirmOff(true)
      return
    }
    setConfirmOff(false)
    try {
      await saveNotificationSettings({ [key]: checked })
    } catch {
      setToast('알림 설정을 저장하지 못했어요. 잠시 후 다시 시도해 주세요')
      return
    }
    // 측정 알림을 끄면 서버도 이 기기로 안 보내게 구독 끊음
    if (key === 'measure') {
      if (checked) syncPushSubscription()
      else unsubscribePush().catch(() => {})
    }
  }

  // 켤 때는 안내 문서를 읽고 동의, 끌 땐 바로 거부하고 처리 결과를 알림(정보통신망법 제50조)
  const changeMarketing = async (checked: boolean) => {
    if (checked) {
      navigate(ROUTES.LEGAL_MARKETING, { state: { save: true } })
      return
    }
    setMarketing(false)
    try {
      await saveMarketingConsent(false)
      setToast(marketingResultText(false))
    } catch {
      setMarketing(true)
      setToast('설정을 저장하지 못했어요. 잠시 후 다시 시도해 주세요')
    }
  }

  const sendTest = async () => {
    if (!(await askPermission())) return
    // 서버 푸시를 받는 기기는 실제 측정 알림과 같은 길(서버 → 푸시)로 보내 봄
    if (hasServerPush()) {
      try {
        await sendTestPush()
        setToast('테스트 알림을 보냈어요')
      } catch {
        setToast('테스트 알림을 보내지 못했어요. 잠시 후 다시 시도해 주세요')
      }
      return
    }
    // 안드로이드 크롬은 서비스 워커 없이 new Notification이 막혀 있음
    try {
      new Notification('당당', { body: previewText })
      setToast('테스트 알림을 보냈어요')
    } catch {
      setToast('앱 설치 후 테스트 알림을 받을 수 있어요')
    }
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-2 pb-30">
      <SubPageHeader title="알림" onBack={goBack} />

      <div className="mt-2.5 flex flex-col gap-3.5">
        <ul className="bg-grey-50 flex flex-col rounded-3xl px-4.5 py-2">
          {rows.map(({ key, title, description }) => (
            <li key={key} className="flex items-center gap-3 py-2.5">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-t6 text-grey-900 font-bold">{title}</p>
                <p className="text-t7 text-grey-500">{description}</p>
              </div>
              <Switch
                checked={values[key]}
                label={title}
                onChange={(checked) => void changeSetting(key, checked)}
              />
            </li>
          ))}
        </ul>

        {marketing !== null && (
          <ul className="bg-grey-50 flex flex-col rounded-3xl px-4.5 py-2">
            <li className="flex items-center gap-3 py-2.5">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-t6 text-grey-900 font-bold">광고성 정보 받기</p>
                <p className="text-t7 text-grey-500">
                  혜택·이벤트 소식 · 밤 9시~아침 8시엔 안 보내요
                </p>
              </div>
              <Switch
                checked={marketing}
                label="광고성 정보 받기"
                onChange={(checked) => void changeMarketing(checked)}
              />
            </li>
          </ul>
        )}

        <section className="bg-grey-100 rounded-banner flex flex-col gap-2.5 p-4.5">
          <h2 className="text-t7 text-grey-600 font-bold">잠금화면에서는 이렇게 보여요</h2>
          <div className="shadow-notification flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-3">
            <span className="rounded-tag flex size-9 shrink-0 items-center justify-center bg-yellow-50">
              <img src={notificationFace} alt="" width={26} height={26} />
            </span>
            <div className="flex min-w-0 flex-col gap-px">
              <p className="flex items-center gap-1.5">
                <span className="text-t7 text-grey-900 font-bold">당당</span>
                <span className="text-grey-400 text-xs leading-normal">지금</span>
              </p>
              <p className="text-grey-800 text-sm leading-normal">{previewText}</p>
            </div>
          </div>
        </section>

        <section className="bg-grey-50 rounded-banner flex flex-col gap-2.5 p-4.5">
          <h2 className="text-t6 text-grey-900 font-bold">알림 상태 점검</h2>
          <ul className="flex flex-col gap-2.5">
            <StatusRow
              ok={permission === 'granted'}
              warn={permission === 'denied'}
              text={PERMISSION_LABEL[permission]}
            />
            <StatusRow
              ok={isInstalled()}
              text={isInstalled() ? '홈 화면에 설치됨' : '홈 화면에 추가하면 알림을 더 잘 받아요'}
            />
            <StatusRow ok={false} text="저전력 모드에서는 알림이 늦을 수 있어요" />
          </ul>
          {/* 권한을 거절했으면 브라우저가 다시 안 물어봐서 켜는 방법부터 */}
          <button
            type="button"
            className="bg-grey-100 text-grey-900 h-12 rounded-xl text-base leading-none font-bold tracking-tight"
            onClick={permission === 'denied' ? () => setGuide(true) : sendTest}
          >
            {permission === 'denied' ? '켜는 방법 보기' : '테스트 알림 보내기'}
          </button>
        </section>
      </div>

      {confirmOff && (
        <ConfirmSheet
          title="측정 알림을 끌까요?"
          description={
            '끄면 식사 뒤 측정 알림이 오지 않아요.\n진료 때 볼 기록이 비어 있을 수 있어요.'
          }
          confirmLabel="알림 끄기"
          onConfirm={() => void changeSetting('measure', false)}
          onClose={() => setConfirmOff(false)}
        />
      )}
      {guide && <NotificationGuideSheet onClose={closeGuide} />}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default NotificationsPage
