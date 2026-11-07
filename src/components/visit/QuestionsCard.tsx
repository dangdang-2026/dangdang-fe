import iconPlusSm from '@/assets/icons/plus-sm.svg'
import iconRemove from '@/assets/icons/remove.svg'
import type { Question } from '@/types/visit'

type QuestionsCardProps = {
  questions: Question[]
  onAdd: () => void
  onRemove: (question: Question) => void
}

// Figma C-02 물어볼 것 카드
function QuestionsCard({ questions, onAdd, onRemove }: QuestionsCardProps) {
  return (
    <section className="shadow-card flex flex-col gap-2.5 rounded-3xl bg-white p-4.5">
      <div className="flex items-center justify-between">
        <h2 className="text-grey-900 text-base leading-normal font-bold">
          물어볼 것 {questions.length}개
        </h2>
        <button
          type="button"
          className="bg-grey-100 text-grey-700 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs leading-normal font-bold"
          onClick={onAdd}
        >
          <img src={iconPlusSm} alt="" width={14} height={14} />
          추가
        </button>
      </div>

      {questions.length === 0 ? (
        <p className="text-t7 text-grey-500">진료 때 물어보고 싶은 걸 적어 두세요</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {questions.map((question) => (
            <li key={question.id} className="flex items-center gap-2">
              <span aria-hidden className="text-sm leading-normal font-bold text-yellow-600">
                •
              </span>
              <p className="text-grey-800 flex-1 text-sm leading-normal">{question.text}</p>
              <button
                type="button"
                aria-label={`${question.text} 지우기`}
                onClick={() => onRemove(question)}
              >
                <img src={iconRemove} alt="" width={16} height={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default QuestionsCard
