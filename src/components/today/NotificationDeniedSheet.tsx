import BottomSheet from '@/components/common/BottomSheet'

// iPhone은 Figma 단계, 그 밖은 M-05b Android 단계
const STEPS = /iPhone|iPad|iPod/.test(navigator.userAgent)
  ? ['iPhone 설정 앱을 열어요', "'당당' › '알림'을 눌러요", "'알림 허용'을 켜요"]
  : ['당당 아이콘을 길게 눌러요', "'앱 정보' › '알림'을 눌러요", "'알림 허용'을 켜요"]

// Figma H-11b 알림을 거절해서 앱이 다시 물어볼 수 없을 때 설정에서 켜는 법
function NotificationDeniedSheet({ onClose }: { onClose: () => void }) {
  return (
    <BottomSheet label="알림이 꺼져 있어요" onClose={onClose}>
      <div className="flex flex-col gap-2">
        <h2 className="text-t4 text-grey-900">알림이 꺼져 있어요</h2>
        <p className="text-t6 text-grey-700">
          전에 &apos;허용 안 함&apos;을 눌러서
          <br />
          앱에서 다시 물어볼 수 없어요.
        </p>
      </div>
      <ol className="bg-grey-50 flex flex-col gap-4 rounded-2xl p-5">
        {STEPS.map((step, index) => (
          <li key={step} className="flex items-center gap-3">
            <span className="bg-grey-200 text-t7 text-grey-800 flex size-6.5 shrink-0 items-center justify-center rounded-full font-bold">
              {index + 1}
            </span>
            <span className="text-t6 text-grey-800 font-medium">{step}</span>
          </li>
        ))}
      </ol>
      <div className="mt-1 flex flex-col gap-2">
        <button
          type="button"
          className="text-subtitle-1 bg-primary h-14 rounded-xl leading-none font-bold text-white"
          onClick={onClose}
        >
          설정에서 켤게요
        </button>
        <button
          type="button"
          className="text-subtitle-1 bg-grey-100 text-grey-900 h-14 rounded-xl leading-none font-bold"
          onClick={onClose}
        >
          나중에 할게요
        </button>
      </div>
    </BottomSheet>
  )
}

export default NotificationDeniedSheet
