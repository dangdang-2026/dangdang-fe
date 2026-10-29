import { useState } from 'react'
import iconCheck from '@/assets/icons/chat/consent-check.svg'
import iconClose from '@/assets/icons/close.svg'
import BottomSheet from '@/components/common/BottomSheet'

const ITEMS = [
  '필요한 기록만 골라 보내요 (혈당 숫자·날짜)',
  '이름이나 연락처는 보내지 않아요',
  '해외 AI 서비스를 써요 (국외 이전)',
]

type ConsentSheetProps = {
  onAgree: () => void
  onDecline: () => void
  onClose: () => void
}

// Figma Q-01 기록 보기 동의(ASK-01). 거절하면 일반 질문만
function ConsentSheet({ onAgree, onDecline, onClose }: ConsentSheetProps) {
  const [showTransfer, setShowTransfer] = useState(false)

  return (
    <BottomSheet label="기록 보기 동의" onClose={onClose}>
      <div className="flex items-center justify-between">
        <h2 className="text-t4 text-grey-900">내 기록을 당당이에게 보여 줄까요?</h2>
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
        <button
          type="button"
          aria-expanded={showTransfer}
          className="text-body-3 self-start pl-7 text-blue-700"
          onClick={() => setShowTransfer((value) => !value)}
        >
          받는 곳·보관 기간 보기 {showTransfer ? '⌃' : '›'}
        </button>
        {showTransfer && (
          // TODO: AI 업체 계약 후 받는 곳·나라·보관 기간 확정해서 교체
          <p className="text-t7 text-grey-700 bg-grey-50 rounded-tag ml-7 px-3 py-2.5">
            보내는 것: 질문, 고른 기록의 혈당 숫자·날짜
            <br />
            받는 곳·보관 기간: AI 서비스 연결 때 이곳에 안내해요
          </p>
        )}
        <p className="text-t7 text-grey-600">마이 › AI 설정에서 언제든 끌 수 있어요.</p>
      </div>

      <button
        type="button"
        className="bg-primary rounded-key py-4 text-base leading-snug font-bold text-white"
        onClick={onAgree}
      >
        동의하고 다음
      </button>
      <button
        type="button"
        className="text-grey-600 self-center text-sm leading-snug font-medium underline"
        onClick={onDecline}
      >
        기록 없이 일반 질문만 할게요
      </button>
    </BottomSheet>
  )
}

export default ConsentSheet
