import { useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import iconInfo from '@/assets/icons/community/info.svg'
import iconCalendar from '@/assets/icons/postpartum/calendar-sm.svg'
import iconChevron from '@/assets/icons/postpartum/chevron-sm.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import ProfileDateSheet from '@/components/my/ProfileDateSheet'
import ChoiceChip from '@/components/postpartum/ChoiceChip'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useProfileStore, type PostpartumCheck } from '@/stores/useProfileStore'
import { parseDateKey, startOfDay, toDateKey } from '@/utils/date'
import { CHECK_PRESETS, REMIND_LABEL, formatDotDate } from '@/utils/postpartum'

type Remind = PostpartumCheck['remind'][number]

type Draft = {
  preset: string | null
  customName: string
  // YYYY-MM-DD
  date: string | null
  remind: Remind[]
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-grey-600 text-sm leading-snug font-medium">{label}</h2>
      {children}
    </section>
  )
}

// Figma E-08 산후 검사 일정 등록. ?id= 이면 날짜 바꾸기
function CheckSchedulePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const goBack = useGoBack(ROUTES.TODAY)
  const [searchParams] = useSearchParams()
  const checks = useProfileStore((state) => state.postpartumChecks)
  const updateProfile = useProfileStore((state) => state.updateProfile)
  const editing = checks.find((check) => check.id === searchParams.get('id'))
  // 참고 정보를 보고 돌아오면 적던 내용 그대로
  const draft = (location.state as { draft?: Draft } | null)?.draft

  const initialName = editing?.name ?? CHECK_PRESETS[0]
  const [preset, setPreset] = useState<string | null>(
    draft ? draft.preset : CHECK_PRESETS.includes(initialName) ? initialName : null,
  )
  const [customName, setCustomName] = useState(
    draft?.customName ?? (CHECK_PRESETS.includes(initialName) ? '' : initialName),
  )
  const [date, setDate] = useState<Date | null>(
    parseDateKey(draft ? draft.date : (editing?.date ?? null)),
  )
  const [remind, setRemind] = useState<Remind[]>(
    draft?.remind ?? editing?.remind ?? ['eve', 'morning'],
  )
  const [picking, setPicking] = useState(false)
  const today = startOfDay(new Date())

  const name = preset ?? customName.trim()
  const canSave = !!date && !!name

  const toggleRemind = (key: Remind) =>
    setRemind((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    )

  const openGuide = () => {
    const current: Draft = { preset, customName, date: date ? toDateKey(date) : null, remind }
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: { draft: current },
    })
    navigate(ROUTES.POSTPARTUM_GUIDE)
  }

  const save = () => {
    if (!date || !name) return
    const check: PostpartumCheck = {
      id: editing?.id ?? crypto.randomUUID(),
      name,
      date: toDateKey(date),
      remind,
      memo: editing?.memo ?? null,
    }
    updateProfile({
      postpartumChecks: editing
        ? checks.map((item) => (item.id === editing.id ? check : item))
        : [...checks, check],
      // 날짜를 적었으니 다시 물어보지 않음
      checkRemindAt: null,
    })
    navigate(ROUTES.TODAY, { replace: true })
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-13 pb-[max(--spacing(9),env(safe-area-inset-bottom))]">
      <SubPageHeader title="산후 검사 일정" onBack={goBack} />

      <div className="mt-3 flex flex-col gap-1.5">
        <h1 className="text-t3 text-grey-900">병원에서 들은 검사 날짜를 적어 주세요</h1>
        <p className="text-grey-600 text-sm leading-relaxed">
          검사 시기는 병원마다 달라요. 당당이 정하지 않아요.
        </p>
      </div>

      <div className="mt-5.5 mb-8 flex flex-col gap-5.5">
        <Section label="어떤 검사인가요?">
          <div className="flex flex-wrap gap-2">
            {CHECK_PRESETS.map((item) => (
              <ChoiceChip key={item} selected={preset === item} onClick={() => setPreset(item)}>
                {item}
              </ChoiceChip>
            ))}
            <ChoiceChip selected={preset === null} onClick={() => setPreset(null)}>
              직접 적기
            </ChoiceChip>
          </div>
          {preset === null && (
            <input
              value={customName}
              maxLength={20}
              aria-label="검사 이름"
              placeholder="검사 이름을 적어 주세요"
              className="bg-grey-50 text-grey-900 placeholder:text-grey-400 rounded-key focus:ring-primary px-4 py-3.5 text-base leading-snug font-medium outline-none focus:ring-2"
              onChange={(event) => setCustomName(event.target.value)}
            />
          )}
        </Section>

        <Section label="날짜">
          <button
            type="button"
            className="bg-grey-50 rounded-key flex items-center justify-between py-3.5 pr-3.5 pl-4 text-left"
            onClick={() => setPicking(true)}
          >
            <span
              className={`text-base leading-snug font-medium ${date ? 'text-grey-900' : 'text-grey-400'}`}
            >
              {date ? formatDotDate(date) : '날짜를 골라 주세요'}
            </span>
            <img src={iconCalendar} alt="" width={20} height={20} />
          </button>
        </Section>

        <Section label="미리 알려 드릴까요?">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(REMIND_LABEL) as Remind[]).map((key) => (
              <ChoiceChip
                key={key}
                selected={remind.includes(key)}
                onClick={() => toggleRemind(key)}
              >
                {REMIND_LABEL[key]}
              </ChoiceChip>
            ))}
            <ChoiceChip selected={remind.length === 0} onClick={() => setRemind([])}>
              안 받을래요
            </ChoiceChip>
          </div>
        </Section>

        <button
          type="button"
          className="border-grey-200 flex items-center justify-between rounded-xl border px-3.5 py-3"
          onClick={openGuide}
        >
          <span className="text-body-3 text-grey-700 flex items-center gap-2">
            <img src={iconInfo} alt="" width={18} height={18} />
            학회 권고 보기 (참고 정보 · 출처 있음)
          </span>
          <img src={iconChevron} alt="" width={14} height={14} />
        </button>
      </div>

      <button
        type="button"
        disabled={!canSave}
        className="bg-primary disabled:bg-grey-100 disabled:text-grey-400 rounded-key mt-auto py-4 text-base leading-snug font-bold text-white"
        onClick={save}
      >
        {remind.length > 0 ? '저장하고 알림 받기' : '저장'}
      </button>

      {picking && (
        <ProfileDateSheet
          title="검사 날짜"
          description="병원에서 들은 날짜를 골라 주세요."
          initialDate={date}
          today={today}
          pick="future"
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

export default CheckSchedulePage
