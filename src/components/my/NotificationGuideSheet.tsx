import BottomSheet from '@/components/common/BottomSheet'

const GUIDES = [
  {
    device: 'iPhone (홈 화면에 추가한 당당)',
    steps: ['설정 앱을 열어요', '알림 › 당당을 눌러요', '알림 허용을 켜요'],
  },
  {
    device: 'Android (Chrome)',
    steps: ['당당 아이콘을 길게 눌러요', '앱 정보 › 알림을 눌러요', '알림 허용을 켜요'],
  },
]

// Figma M-05b 알림 켜는 방법. 설정에서 켜고 돌아오면 알림 화면이 바로 다시 읽음
function NotificationGuideSheet({ onClose }: { onClose: () => void }) {
  return (
    <BottomSheet label="알림 켜는 방법" onClose={onClose}>
      <h2 className="text-t4 text-grey-900">알림 켜는 방법</h2>
      <div className="flex flex-col gap-2">
        {GUIDES.map(({ device, steps }) => (
          <div key={device} className="rounded-key bg-grey-100 flex flex-col gap-2 p-4">
            <p className="text-t6 text-grey-900 font-bold">{device}</p>
            <ol className="text-grey-700 text-sm leading-relaxed">
              {steps.map((step, index) => (
                <li key={step}>
                  {index + 1}. {step}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <p className="text-t6 text-grey-700">켜고 돌아오면 여기서 바로 확인돼요.</p>
      <button
        type="button"
        className="text-subtitle-1 bg-primary h-14 rounded-xl leading-none font-bold text-white"
        onClick={onClose}
      >
        확인
      </button>
    </BottomSheet>
  )
}

export default NotificationGuideSheet
