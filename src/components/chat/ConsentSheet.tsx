import { useState } from 'react'
import iconCheckDark from '@/assets/icons/check-dark.svg'
import iconClose from '@/assets/icons/close.svg'
import BottomSheet from '@/components/common/BottomSheet'

type ConsentSheetProps = {
  // 지금 기록 보기 동의. 다시 열어도 고른 적 없는 값으로 바뀌지 않게
  initialRecords: boolean
  // records: 기록 보고 답하기(선택). 해외로 보내기는 필수라 고르면 늘 같이 동의
  onSubmit: (records: boolean) => void
  onClose: () => void
}

const ITEMS = {
  records: {
    title: '내 혈당·식사 기록을 보고 답하기 (선택)',
    description: '기록은 앱이 보여 줘요. 숫자는 해외로 보내지 않아요',
  },
  overseas: {
    title: '해외 전송 · 미국 OpenAI (필수)',
    description: '질문 글과 바로 앞 대화 · 30일 보관 후 삭제',
  },
}

// Figma Q-01 당당이 동의. 일반 질문만 골라도 해외로 보내기는 동의로 저장
function ConsentSheet({ initialRecords, onSubmit, onClose }: ConsentSheetProps) {
  const [records, setRecords] = useState(initialRecords)
  const [overseas, setOverseas] = useState(true)

  const row = (key: keyof typeof ITEMS, checked: boolean, toggle: () => void) => (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      className="flex items-start gap-3 text-left"
      onClick={toggle}
    >
      {checked ? (
        <span className="bg-primary mt-0.5 flex size-5.5 shrink-0 items-center justify-center rounded-md">
          <img src={iconCheckDark} alt="" width={14} height={14} />
        </span>
      ) : (
        <span className="border-grey-300 mt-0.5 size-5.5 shrink-0 rounded-md border-2" />
      )}
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-t6 text-grey-900 font-bold">{ITEMS[key].title}</span>
        <span className="text-t7 text-grey-700">{ITEMS[key].description}</span>
      </span>
    </button>
  )

  return (
    <BottomSheet label="당당이 동의" onClose={onClose}>
      <div className="flex items-center justify-between">
        <h2 className="text-t4 text-grey-900">당당이에게 물어보기 전에</h2>
        <button type="button" aria-label="닫기" onClick={onClose}>
          <img src={iconClose} alt="" width={22} height={22} />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {row('records', records, () => setRecords((value) => !value))}
        {row('overseas', overseas, () => setOverseas((value) => !value))}
      </div>
      <p className="text-t7 text-grey-600">
        AI 답은 틀릴 수 있어요.
        <br />
        마이 › AI 설정에서 언제든 끌 수 있어요.
      </p>

      {/* 해외로 보내기 없이는 당당이가 답할 수 없어 필수 */}
      <button
        type="button"
        disabled={!overseas}
        className="bg-primary disabled:bg-grey-100 disabled:text-grey-500 rounded-key py-4 text-base leading-snug font-bold text-white"
        onClick={() => onSubmit(records)}
      >
        시작하기
      </button>
      <button
        type="button"
        disabled={!overseas}
        className="text-grey-700 disabled:text-grey-400 self-center text-sm leading-snug font-medium underline"
        onClick={() => onSubmit(false)}
      >
        일반 질문만 할게요
      </button>
    </BottomSheet>
  )
}

export default ConsentSheet
