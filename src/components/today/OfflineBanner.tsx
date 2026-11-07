import iconWifiOff from '@/assets/icons/offline/wifi-off.svg'

// Figma H-12 오프라인 배너. 연결이 끊기면 오늘 탭 맨 위
function OfflineBanner() {
  return (
    <div role="status" className="bg-grey-900 rounded-bubble flex items-center gap-2.5 px-4 py-3.5">
      <img src={iconWifiOff} alt="" width={20} height={20} />
      <div className="flex flex-col gap-0.5">
        <p className="text-sm leading-normal font-bold text-white">인터넷 연결이 없어요</p>
        <p className="text-grey-300 text-xs leading-normal">측정 알림이 아직 예약되지 않았어요</p>
      </div>
    </div>
  )
}

export default OfflineBanner
