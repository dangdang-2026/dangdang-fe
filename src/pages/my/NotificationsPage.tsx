import { useCallback, useState } from 'react'
import iconAlertMd from '@/assets/icons/alert-md.svg'
import iconCheckBlue from '@/assets/icons/check-blue.svg'
import notificationFace from '@/assets/images/dangdang/notification.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import Switch from '@/components/common/Switch'
import Toast from '@/components/common/Toast'
import { ROUTES } from '@/constants/routes'
import { useCriteria } from '@/hooks/useCriteria'
import { useGoBack } from '@/hooks/useGoBack'
import { useNotificationStore, type NotificationSettings } from '@/stores/useNotificationStore'

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
  const { measure, remind, hideOnLockScreen, updateSettings } = useNotificationStore()
  const { postMealHours } = useCriteria()
  const [permission, setPermission] = useState(readPermission)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])

  const previewText = hideOnLockScreen
    ? '확인할 일이 있어요'
    : `식후 ${postMealHours ?? 1}시간 혈당을 잴 시간이에요`

  const rows: { key: keyof NotificationSettings; title: string; description: string }[] = [
    { key: 'measure', title: '측정 알림', description: '식사 시작 후 병원에서 정한 시간에' },
    { key: 'remind', title: '10분 뒤 다시', description: '못 봤을 때 한 번만 더 알려요' },
    {
      key: 'hideOnLockScreen',
      title: '잠금화면 문구 가리기',
      description: '혈당·식사 내용을 알림에 쓰지 않아요',
    },
  ]
  const values: NotificationSettings = { measure, remind, hideOnLockScreen }

  const sendTest = async () => {
    if (permission === 'unsupported') {
      setToast('이 브라우저는 알림을 지원하지 않아요')
      return
    }
    const next = permission === 'default' ? await Notification.requestPermission() : permission
    setPermission(next)
    if (next !== 'granted') {
      setToast('알림 권한을 켜야 받을 수 있어요')
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
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-30">
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
                onChange={(checked) => updateSettings({ [key]: checked })}
              />
            </li>
          ))}
        </ul>

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
          <button
            type="button"
            className="bg-grey-100 text-grey-900 h-12 rounded-xl text-base leading-none font-bold tracking-tight"
            onClick={sendTest}
          >
            테스트 알림 보내기
          </button>
        </section>
      </div>

      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default NotificationsPage
