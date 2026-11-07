import iconBellOff from '@/assets/icons/bell-off.svg'

type NotificationBannerProps = {
  onTurnOn: () => void
}

// Figma H-01·H-11 알림 꺼짐 배너. 측정 알림이 꺼졌거나 권한이 없을 때
function NotificationBanner({ onTurnOn }: NotificationBannerProps) {
  return (
    <div className="rounded-banner shadow-banner flex items-center gap-2.5 bg-white px-4 py-3.5">
      <img src={iconBellOff} alt="" width={20} height={20} />
      <p className="text-grey-700 flex-1 text-sm leading-normal font-medium">
        알림이 아직 꺼져 있어요
      </p>
      <button
        type="button"
        className="text-t7 text-grey-800 rounded-full bg-yellow-50 px-3 py-1.5 font-bold"
        onClick={onTurnOn}
      >
        켜기
      </button>
    </div>
  )
}

export default NotificationBanner
