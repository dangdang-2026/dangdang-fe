import { useCallback, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import iconInfoSm from '@/assets/icons/info-sm.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import Toast from '@/components/common/Toast'
import ProfileDateSheet from '@/components/my/ProfileDateSheet'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useAuthStore } from '@/stores/useAuthStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { parseDateKey, startOfDay, toDateKey } from '@/utils/date'

type DateField = 'dueDate' | 'diagnosisDate'

const DATE_SHEET: Record<
  DateField,
  { title: string; description: string; pick: 'future' | 'past' }
> = {
  dueDate: {
    title: '출산예정일',
    description: '병원에서 알려준 날짜를 골라 주세요. 임신 주수가 이 날짜로 계산돼요.',
    pick: 'future',
  },
  diagnosisDate: {
    title: '임신성 당뇨 진단일',
    description: '처음 진단받은 날을 골라 주세요.',
    pick: 'past',
  },
}

// 예: 2027. 1. 17
const formatDot = (date: Date) => `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-t7 text-grey-700 font-bold">{label}</p>
      {children}
    </div>
  )
}

// Figma M-02 내 정보
function ProfilePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const goBack = useGoBack(ROUTES.MY)
  // 비밀번호는 이메일로 가입한 계정만 있음
  const hasPassword = useAuthStore((state) => state.account?.method === 'email')
  const { name, dueDate, diagnosisDate, updateProfile } = useProfileStore()
  const [nameDraft, setNameDraft] = useState(name)
  const [editing, setEditing] = useState<DateField | null>(null)
  // 비밀번호를 바꾸고 돌아오면 알림
  const [toast, setToast] = useState<string | null>(
    () => (location.state as { toast?: string } | null)?.toast ?? null,
  )
  const closeToast = useCallback(() => setToast(null), [])
  const closeSheet = useCallback(() => setEditing(null), [])
  const today = startOfDay(new Date())

  // 비우면 원래 이름으로 되돌림
  const saveName = () => {
    const trimmed = nameDraft.trim()
    if (!trimmed) {
      setNameDraft(name)
      return
    }
    setNameDraft(trimmed)
    if (trimmed !== name) {
      updateProfile({ name: trimmed })
      setToast('이름을 바꿨어요')
    }
  }

  const dates: Record<DateField, Date | null> = {
    dueDate: parseDateKey(dueDate),
    diagnosisDate: parseDateKey(diagnosisDate),
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-30">
      <SubPageHeader title="내 정보" onBack={goBack} />

      <div className="mt-3.5 flex flex-col gap-4">
        <Field label="이름">
          <input
            value={nameDraft}
            maxLength={10}
            aria-label="이름"
            className="bg-grey-50 text-grey-900 h-13 rounded-2xl px-4 text-base font-medium tracking-tight outline-none"
            onChange={(event) => setNameDraft(event.target.value)}
            onBlur={saveName}
            onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
          />
        </Field>

        {(Object.keys(DATE_SHEET) as DateField[]).map((field) => (
          <Field key={field} label={DATE_SHEET[field].title}>
            <button
              type="button"
              className="bg-grey-50 flex h-13 items-center gap-2 rounded-2xl px-4 text-left"
              onClick={() => setEditing(field)}
            >
              <span
                className={`flex-1 text-base font-medium tracking-tight ${dates[field] ? 'text-grey-900' : 'text-grey-400'}`}
              >
                {dates[field] ? formatDot(dates[field]) : '아직 안 적었어요'}
              </span>
              <span className="text-grey-700 text-sm leading-normal font-bold">
                {dates[field] ? '바꾸기' : '적기'}
              </span>
            </button>
          </Field>
        ))}

        <p className="text-grey-500 flex items-center gap-1.5 text-xs leading-normal">
          <img src={iconInfoSm} alt="" width={14} height={14} />
          임신 주수는 출산예정일로 계산해요
        </p>
      </div>

      <section className="mt-6 flex flex-col gap-2.5 rounded-3xl bg-yellow-50 p-4.5">
        <h2 className="text-subtitle-1 text-grey-900">출산·입원하셨나요?</h2>
        <p className="text-grey-700 text-sm leading-normal">
          입원하면 알림만 잠시 멈추고, 출산일을 적으면
          <br />
          산후 모드로 바뀌어요.
        </p>
        {/* 산후 모드(M-02 전환) 구현 전이라 안내만 */}
        <button
          type="button"
          className="bg-grey-900 h-12 rounded-xl text-base leading-none font-bold text-white"
          onClick={() => setToast('산후 모드는 준비 중이에요')}
        >
          출산·입원했어요
        </button>
      </section>

      {hasPassword && (
        <button
          type="button"
          className="text-body-2 text-grey-700 mt-21 leading-normal"
          onClick={() => navigate(ROUTES.MY_PASSWORD)}
        >
          비밀번호 바꾸기 ›
        </button>
      )}

      {editing && (
        <ProfileDateSheet
          {...DATE_SHEET[editing]}
          initialDate={dates[editing]}
          today={today}
          onSave={(date) => {
            updateProfile({ [editing]: toDateKey(date) })
            setEditing(null)
            setToast(`${DATE_SHEET[editing].title}을 저장했어요`)
          }}
          onClose={closeSheet}
        />
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default ProfilePage
