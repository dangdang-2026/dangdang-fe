import { useState } from 'react'
import { useNavigate } from 'react-router'
import iconCheckDark from '@/assets/icons/check-dark.svg'
import iconCheckYellow from '@/assets/icons/community/promise-check.svg'
import deliveryCharacter from '@/assets/images/postpartum/delivery-character.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import ProfileDateSheet from '@/components/my/ProfileDateSheet'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useProfileStore } from '@/stores/useProfileStore'
import { addDays, isSameDay, startOfDay, toDateKey } from '@/utils/date'

const CHANGES = [
  '측정·인슐린 알림을 바로 멈춰요',
  '임신 중 기록은 보관함에 그대로 남아요',
  '산후 혈당 검사일은 병원에서 들은 날짜로 직접 적어 주세요',
]

// 예: 10/14
const formatSlash = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`

// Figma E-06 출산일 입력 → 산후 모드 · E-06b 직접 고르기
function DeliveryPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.MY_PROFILE)
  const updateProfile = useProfileStore((state) => state.updateProfile)
  const today = startOfDay(new Date())
  const yesterday = addDays(today, -1)
  const [date, setDate] = useState(today)
  const [picking, setPicking] = useState(false)

  const picked = !isSameDay(date, today) && !isSameDay(date, yesterday)
  const chips = [
    {
      label: `오늘 · ${formatSlash(today)}`,
      selected: isSameDay(date, today),
      onClick: () => setDate(today),
    },
    { label: '어제', selected: isSameDay(date, yesterday), onClick: () => setDate(yesterday) },
    {
      label: picked ? formatSlash(date) : '직접 고르기',
      selected: picked,
      onClick: () => setPicking(true),
    },
  ]

  const switchToPostpartum = () => {
    updateProfile({ deliveryDate: toDateKey(date), hospitalized: false, checkRemindAt: null })
    navigate(ROUTES.TODAY, { replace: true })
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-13 pb-[max(--spacing(9),env(safe-area-inset-bottom))]">
      <SubPageHeader title="출산일 입력" onBack={goBack} />

      <div className="mt-2.5 flex items-center justify-between">
        <h1 className="text-title-2 text-grey-900">
          출산을 축하해요
          <br />
          출산일을 알려 주세요
        </h1>
        <img src={deliveryCharacter} alt="" width={84} height={84} />
      </div>

      <div className="mt-8.5 flex gap-2">
        {chips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            aria-pressed={chip.selected}
            className={`text-t6 flex items-center gap-1 rounded-full border px-4 py-2.5 font-bold ${
              chip.selected
                ? 'border-primary text-grey-900 bg-yellow-50'
                : 'bg-grey-100 text-grey-700 border-transparent'
            }`}
            onClick={chip.onClick}
          >
            {chip.selected && <img src={iconCheckDark} alt="" width={14} height={14} />}
            {chip.label}
          </button>
        ))}
      </div>

      <section className="rounded-banner bg-grey-50 mt-7 flex flex-col gap-2.5 p-4.5">
        <h2 className="text-t6 text-grey-900 font-bold">바뀌는 것</h2>
        <ul className="flex flex-col gap-2.5">
          {CHANGES.map((change) => (
            <li
              key={change}
              className="text-grey-800 flex items-start gap-2.5 text-sm leading-normal"
            >
              <img src={iconCheckYellow} alt="" width={18} height={18} className="shrink-0" />
              {change}
            </li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        className="text-subtitle-1 bg-primary mt-auto h-14 rounded-xl leading-none text-white"
        onClick={switchToPostpartum}
      >
        산후 모드로 바꾸기
      </button>

      {picking && (
        <ProfileDateSheet
          title="출산일"
          description="아기가 태어난 날을 골라 주세요."
          initialDate={date}
          today={today}
          pick="past"
          submitLabel="이 날로 할게요"
          onSave={(next) => {
            setDate(next)
            setPicking(false)
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </main>
  )
}

export default DeliveryPage
