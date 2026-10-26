import { useState } from 'react'
import { useNavigate } from 'react-router'
import iconCalendar from '@/assets/icons/calendar.svg'
import iconCheckGreen from '@/assets/icons/community/check-green.svg'
import ProfileDateSheet from '@/components/my/ProfileDateSheet'
import OnboardingHeader from '@/components/onboarding/OnboardingHeader'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useCriteriaStore } from '@/stores/useCriteriaStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { parseDateKey, startOfDay, toDateKey } from '@/utils/date'
import { formatPregnancyAge } from '@/utils/pregnancy'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 예: 2027년 1월 18일 (월)
const formatFullDate = (date: Date) =>
  `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`

// Figma A-03 출산 예정일(선택). 마치면 프로필·병원 기준을 만들고 홈으로
function DueDatePage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.ONBOARDING_SLOTS)
  const answers = useOnboardingStore()
  const startCriteria = useCriteriaStore((state) => state.startCriteria)
  const updateProfile = useProfileStore((state) => state.updateProfile)
  const [dueDate, setDueDate] = useState(answers.dueDate)
  const [sheetOpen, setSheetOpen] = useState(false)
  const today = startOfDay(new Date())
  const date = parseDateKey(dueDate)
  const pregnancyLabel = formatPregnancyAge(dueDate, today)

  // 목표는 병원에서 들은 값만 쓰므로 비워 두고, 진료 후 기준 바꾸기에서 적음
  const finish = (finalDueDate: string | null) => {
    updateProfile({ dueDate: finalDueDate })
    startCriteria({
      source: '첫 진입 때 입력',
      postMealHours: answers.postMealHours,
      measureSlots: answers.measureSlots,
      targets: { fasting: null, postMeal: null },
    })
    answers.setAnswers({ dueDate: finalDueDate })
    answers.complete()
    navigate(ROUTES.TODAY, { replace: true })
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-13 pb-[max(--spacing(9),env(safe-area-inset-bottom))]">
      <OnboardingHeader step={2} onBack={goBack} />

      <div className="mt-4.5 flex flex-col gap-6">
        <h1 className="text-title-2 text-grey-900">
          출산 예정일을
          <br />
          알려 주세요
        </h1>
        <p className="text-grey-500 text-sm leading-normal">
          임신 주수를 보여 드리고, 출산 뒤 산후 모드로 넘어갈 때 써요.
        </p>
      </div>

      <button
        type="button"
        className={`mt-6 flex h-13 items-center gap-2 rounded-xl border-2 px-4 text-left text-base leading-snug font-medium ${
          date ? 'border-primary text-grey-900' : 'border-grey-200 text-grey-400'
        }`}
        onClick={() => setSheetOpen(true)}
      >
        <img src={iconCalendar} alt="" width={20} height={20} />
        {date ? formatFullDate(date) : '날짜 고르기'}
      </button>
      {pregnancyLabel && (
        <p className="text-t7 text-grey-800 mt-3 flex items-center gap-1.5 font-medium">
          <img src={iconCheckGreen} alt="" width={14} height={14} />
          오늘은 {pregnancyLabel}이에요
        </p>
      )}
      <p className="text-grey-500 mt-6 text-xs leading-normal">
        아직 모르면 건너뛰어도 돼요. 마이 › 내 정보에서 언제든 적을 수 있어요.
      </p>

      <div className="mt-auto flex flex-col gap-4">
        <button
          type="button"
          className="text-grey-500 self-center text-sm leading-snug font-medium underline"
          onClick={() => finish(null)}
        >
          나중에 적을게요
        </button>
        <button
          type="button"
          disabled={!date}
          className="text-subtitle-1 disabled:bg-grey-100 disabled:text-grey-400 bg-primary h-14 rounded-xl leading-none text-white"
          onClick={() => finish(dueDate)}
        >
          이 기준으로 시작하기
        </button>
      </div>

      {sheetOpen && (
        <ProfileDateSheet
          title="출산예정일"
          description="병원에서 알려 준 날짜를 골라 주세요."
          initialDate={date}
          today={today}
          pick="future"
          onSave={(picked) => {
            setDueDate(toDateKey(picked))
            setSheetOpen(false)
          }}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </main>
  )
}

export default DueDatePage
