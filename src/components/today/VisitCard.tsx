import iconArrowRightWhite from '@/assets/icons/arrow-right-white.svg'
import { MOCK_HOSPITAL } from '@/mocks/hospital'
import { formatMeridiemTime } from '@/utils/date'
import type { HomeVisitCard } from '@/utils/visit'

type VisitCardProps = {
  card: HomeVisitCard
  questionCount: number
  onOpen: () => void
}

function getCardText({ kind, at }: HomeVisitCard, questionCount: number) {
  const questions =
    questionCount > 0
      ? `물어볼 것 ${questionCount}개를 적어 두셨어요`
      : '물어볼 것을 적어 두면 리포트에 함께 들어가요'
  if (kind === 'tomorrow') {
    return {
      when: `내일 ${formatMeridiemTime(at)}`,
      title: '진료 리포트가 준비됐어요',
      footer: questions,
    }
  }
  if (kind === 'today') {
    return {
      when: `오늘 ${formatMeridiemTime(at)}`,
      title: '진료실에서 리포트를 보여 주세요',
      footer: questions,
    }
  }
  return {
    when: '어제',
    title: '진료에서 기준이 바뀌었나요?',
    footer: '바뀐 게 있으면 직접 적어 주세요',
  }
}

// Figma H-08·H-09·H-10 진료 전날·당일·다음 날 카드
function VisitCard({ card, questionCount, onOpen }: VisitCardProps) {
  const { when, title, footer } = getCardText(card, questionCount)

  return (
    <section className="overflow-hidden rounded-3xl bg-linear-to-r from-yellow-500 to-yellow-400">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-5 py-4.5 text-left"
        onClick={onOpen}
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-grey-800 text-xs leading-normal font-medium">
            {when} · {MOCK_HOSPITAL.name}
          </span>
          <span className="text-subtitle-1 text-grey-900">{title}</span>
        </span>
        <span className="bg-grey-900 shrink-0 rounded-full p-3">
          <img src={iconArrowRightWhite} alt="" width={18} height={18} />
        </span>
      </button>
      <p className="text-body-3 text-grey-800 bg-white px-5 py-2.5 text-center">{footer}</p>
    </section>
  )
}

export default VisitCard
