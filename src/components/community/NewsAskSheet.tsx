import { useState } from 'react'
import iconCheck from '@/assets/icons/check.svg'
import iconInfoSm from '@/assets/icons/info-sm.svg'
import iconPlus from '@/assets/icons/plus-sm.svg'
import BottomSheet from '@/components/common/BottomSheet'

type NewsAskSheetProps = {
  questions: string[]
  onSubmit: (questions: string[]) => void
  onClose: () => void
}

// Figma U-28 카드뉴스 → 물어볼 것에 적기. 첫 질문은 골라 둔 채로 시작
function NewsAskSheet({ questions, onSubmit, onClose }: NewsAskSheetProps) {
  const [picked, setPicked] = useState<string[]>(questions.slice(0, 1))

  const toggle = (question: string) =>
    setPicked((prev) =>
      prev.includes(question) ? prev.filter((item) => item !== question) : [...prev, question],
    )

  return (
    <BottomSheet label="물어볼 것에 적기" onClose={onClose}>
      <div className="flex flex-col gap-1">
        <h2 className="text-t4 text-grey-900">물어볼 것에 적기</h2>
        <p className="text-grey-600 text-sm leading-normal">
          카드에서 나온 질문이에요. 진료 탭에서 내 말로 고쳐도 돼요.
        </p>
      </div>
      <ul className="flex flex-col gap-2.5">
        {questions.map((question) => {
          const selected = picked.includes(question)
          return (
            <li key={question}>
              <button
                type="button"
                aria-pressed={selected}
                className={`rounded-key flex w-full items-start gap-3 border px-4 py-3.5 text-left text-base leading-normal font-medium ${
                  selected
                    ? 'border-primary text-grey-900 bg-yellow-50'
                    : 'border-grey-200 text-grey-800'
                }`}
                onClick={() => toggle(question)}
              >
                <img
                  src={selected ? iconCheck : iconPlus}
                  alt=""
                  width={14}
                  height={14}
                  className="mt-1.5 shrink-0"
                />
                {question}
              </button>
            </li>
          )
        })}
      </ul>
      <p className="text-t7 text-grey-500 flex items-center gap-1.5">
        <img src={iconInfoSm} alt="" width={14} height={14} />
        진료 탭 물어볼 것 목록에 들어가요
      </p>
      <button
        type="button"
        disabled={picked.length === 0}
        className="bg-primary text-grey-900 disabled:bg-grey-100 disabled:text-grey-400 rounded-key py-4 text-base leading-snug font-bold"
        onClick={() => onSubmit(picked)}
      >
        고른 {picked.length}개 진료 탭에 추가
      </button>
    </BottomSheet>
  )
}

export default NewsAskSheet
