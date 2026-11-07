import iconInfo from '@/assets/icons/community/source-info.svg'
import iconBell from '@/assets/icons/notice/bell.svg'
import iconPlusSquare from '@/assets/icons/notice/plus-square.svg'
import iconShield from '@/assets/icons/notice/shield.svg'
import noticeCharacter from '@/assets/images/notice/character.svg'
import BottomSheet from '@/components/common/BottomSheet'

const STEPS = [
  {
    icon: iconPlusSquare,
    title: '1  홈 화면에 추가',
    body: 'Safari 아래 공유 버튼 → ‘홈 화면에 추가’',
  },
  { icon: iconBell, title: '2  알림 허용', body: '다음 창에서 ‘허용’을 눌러 주세요' },
]

const NOTES = [
  { icon: iconInfo, text: 'iPhone은 홈 화면에 추가해야 알림을 받을 수 있어요.' },
  {
    icon: iconShield,
    text: '알림에는 ‘확인할 일이 있어요’만 보여요. 혈당·식사 내용은 쓰지 않아요.',
  },
]

type NotificationPermissionSheetProps = {
  onAllow: () => void
  onSkip: () => void
}

// Figma E-01 첫 식사 시작 때 한 번만: 홈 화면 추가 → 알림 허용 안내
function NotificationPermissionSheet({ onAllow, onSkip }: NotificationPermissionSheetProps) {
  return (
    <BottomSheet label="알림 허용" onClose={onSkip}>
      <div className="flex items-center justify-between">
        <h2 className="text-t4 text-grey-900">
          측정 시간에 알려 드리려면
          <br />두 가지가 필요해요
        </h2>
        <img src={noticeCharacter} alt="" width={72} height={72} />
      </div>

      {STEPS.map((step) => (
        <div key={step.title} className="rounded-banner bg-grey-50 flex items-center gap-3.5 p-4">
          <span className="shadow-card flex size-11 shrink-0 items-center justify-center rounded-full bg-white">
            <img src={step.icon} alt="" width={22} height={22} />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-grey-900 text-base leading-normal font-bold whitespace-pre">
              {step.title}
            </span>
            <span className="text-t7 text-grey-700">{step.body}</span>
          </span>
        </div>
      ))}

      {NOTES.map((note) => (
        <p
          key={note.text}
          className="text-grey-600 flex items-start gap-2 px-1 text-xs leading-normal"
        >
          <img src={note.icon} alt="" width={16} height={16} className="shrink-0" />
          {note.text}
        </p>
      ))}

      <button
        type="button"
        className="text-subtitle-1 bg-primary h-14 rounded-xl leading-none text-white"
        onClick={onAllow}
      >
        알림 허용하기
      </button>
      <button
        type="button"
        className="text-subtitle-1 bg-grey-100 text-grey-900 h-14 rounded-xl leading-none"
        onClick={onSkip}
      >
        나중에 할게요 · 알림 없이 기록만
      </button>
    </BottomSheet>
  )
}

export default NotificationPermissionSheet
