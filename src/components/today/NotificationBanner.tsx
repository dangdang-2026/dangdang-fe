import iconBellOff from '@/assets/icons/bell-off.svg'

function NotificationBanner() {
  return (
    <div className="rounded-banner shadow-banner flex items-center gap-2.5 bg-white px-4 py-3.5">
      <img src={iconBellOff} alt="" width={20} height={20} />
      <p className="text-grey-700 flex-1 text-sm leading-normal font-medium">
        알림이 아직 꺼져 있어요
      </p>
      <button
        type="button"
        className="text-t7 text-grey-800 rounded-full bg-yellow-50 px-3 py-1.5 font-bold"
      >
        켜기
      </button>
    </div>
  )
}

export default NotificationBanner
