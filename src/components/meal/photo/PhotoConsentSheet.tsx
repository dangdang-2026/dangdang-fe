import iconCheck from '@/assets/icons/chat/consent-check.svg'
import iconClose from '@/assets/icons/close.svg'
import BottomSheet from '@/components/common/BottomSheet'

const ITEMS = [
  '찾은 이름 중 맞는 것만 골라 저장해요',
  '사진은 이름을 찾은 뒤 바로 지워요',
  '당당 서버(국내)에서만 처리해요',
]

type PhotoConsentSheetProps = {
  onAgree: () => void
  onDecline: () => void
  onClose: () => void
}

// Figma F-02 첫 사진 AI 동의(MEAL-02). 기본 꺼짐, 거절하면 이름으로 적기
function PhotoConsentSheet({ onAgree, onDecline, onClose }: PhotoConsentSheetProps) {
  return (
    <BottomSheet label="사진 음식 찾기 동의" onClose={onClose}>
      <div className="flex items-center justify-between">
        <h2 className="text-t4 text-grey-900">사진으로 음식 이름을 찾을까요?</h2>
        <button type="button" aria-label="닫기" onClick={onClose}>
          <img src={iconClose} alt="" width={22} height={22} />
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {ITEMS.map((item) => (
          <p key={item} className="text-t6 text-grey-800 flex items-start gap-2">
            <img src={iconCheck} alt="" width={20} height={20} className="mt-0.5 shrink-0" />
            {item}
          </p>
        ))}
        <p className="text-t7 text-grey-600">마이 › AI 설정에서 언제든 끌 수 있어요.</p>
      </div>

      <button
        type="button"
        className="bg-primary rounded-key py-4 text-base leading-snug font-bold text-white"
        onClick={onAgree}
      >
        동의하고 사진 찍기
      </button>
      <button
        type="button"
        className="text-grey-600 self-center text-sm leading-snug font-medium underline"
        onClick={onDecline}
      >
        사진 없이 이름으로 적을게요
      </button>
    </BottomSheet>
  )
}

export default PhotoConsentSheet
