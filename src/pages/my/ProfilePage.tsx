import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { startKakaoLogin } from '@/api/auth'
import { getErrorCode } from '@/api/axios'
import { getMe, saveDueDate, updateName, type Me } from '@/api/me'
import iconConnected from '@/assets/icons/my/check-connected.svg'
import iconInfoSm from '@/assets/icons/info-sm.svg'
import ConfirmSheet from '@/components/common/ConfirmSheet'
import SubPageHeader from '@/components/common/SubPageHeader'
import Toast from '@/components/common/Toast'
import ProfileDateSheet from '@/components/my/ProfileDateSheet'
import BirthOrHospitalSheet from '@/components/postpartum/BirthOrHospitalSheet'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  saveDiagnosisDate,
  saveHospitalized,
  savePaused,
  undoDelivery,
  useProfileStore,
} from '@/stores/useProfileStore'
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

// 진단일 · 예정일 · 출산일 앞뒤가 안 맞을 때
const DATE_ERROR: Record<string, string> = {
  PREGNANCY_40003: '오늘 뒤 날짜는 고를 수 없어요',
  PREGNANCY_40004: '진단일은 출산예정일보다 뒤일 수 없어요',
  PREGNANCY_40005: '진단일은 출산일보다 뒤일 수 없어요',
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

function Connected() {
  return (
    <span className="text-t7 flex items-center gap-0.5 font-medium text-green-700">
      <img src={iconConnected} alt="" width={24} height={24} />
      연결됨
    </span>
  )
}

// Figma M-02 · M-02b 내 정보
function ProfilePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const goBack = useGoBack(ROUTES.MY)
  const loginMethod = useAuthStore((state) => state.account?.method)
  // 서버의 로그인 방식별 연결 여부. 못 받거나 운영 서버에 아직 없으면 로그인한 방식만 보여 줌
  const [loginMethods, setLoginMethods] = useState<Me['loginMethods'] | null>(null)
  useEffect(() => {
    getMe()
      .then((me) => setLoginMethods(me.loginMethods ?? null))
      .catch(() => {})
  }, [])
  const methods = loginMethods ?? { email: loginMethod === 'email', kakao: loginMethod === 'kakao' }
  const { name, dueDate, diagnosisDate, deliveryDate, updateProfile } = useProfileStore()
  const [nameDraft, setNameDraft] = useState(name)
  const [editing, setEditing] = useState<DateField | null>(null)
  const [birthSheet, setBirthSheet] = useState(false)
  const [undoSheet, setUndoSheet] = useState(false)
  const [undoing, setUndoing] = useState(false)
  // 비밀번호를 바꾸고 돌아오면 알림
  const [toast, setToast] = useState<string | null>(
    () => (location.state as { toast?: string } | null)?.toast ?? null,
  )
  const closeToast = useCallback(() => setToast(null), [])
  const closeSheet = useCallback(() => setEditing(null), [])
  const today = startOfDay(new Date())

  // 비우면 원래 이름으로 되돌림. 화면엔 바로 바꾸고 서버에 저장
  const saveName = async () => {
    const trimmed = nameDraft.trim()
    if (!trimmed) {
      setNameDraft(name)
      return
    }
    setNameDraft(trimmed)
    if (trimmed === name) return
    updateProfile({ name: trimmed })
    try {
      const result = await updateName(trimmed)
      updateProfile({ name: result.name })
      setNameDraft(result.name)
      setToast(
        result.status === 'saved'
          ? '이름을 바꿨어요'
          : '다른 기기에서 이름을 먼저 바꿨어요. 다시 적어 주세요',
      )
    } catch {
      updateProfile({ name })
      setNameDraft(name)
      setToast('이름을 저장하지 못했어요. 잠시 후 다시 시도해 주세요')
    }
  }

  // 화면엔 바로 바꾸고 서버에 저장. 실패하면 되돌림
  const saveDate = async (field: DateField, date: Date) => {
    const key = toDateKey(date)
    setEditing(null)
    try {
      if (field === 'dueDate') {
        updateProfile({ dueDate: key })
        await saveDueDate(key).catch((error: unknown) => {
          updateProfile({ dueDate })
          throw error
        })
      } else {
        await saveDiagnosisDate(key)
      }
    } catch (error) {
      setToast(
        DATE_ERROR[getErrorCode(error) ?? ''] ??
          `${DATE_SHEET[field].title}을 저장하지 못했어요. 잠시 후 다시 시도해 주세요`,
      )
      return
    }
    setToast(`${DATE_SHEET[field].title}을 저장했어요`)
  }

  // 잘못 눌러 산후 모드가 됐으면 임신 중으로 되돌림
  const confirmUndo = () => {
    if (undoing) return
    setUndoing(true)
    undoDelivery()
      .then(() => setToast('출산 전으로 되돌렸어요'))
      .catch(() => setToast('되돌리지 못했어요. 잠시 후 다시 시도해 주세요'))
      .finally(() => {
        setUndoing(false)
        setUndoSheet(false)
      })
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
            onBlur={() => void saveName()}
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

      {/* 산후 모드로 바뀐 뒤엔 되돌리기만 */}
      {deliveryDate ? (
        <section className="bg-grey-50 mt-6 flex flex-col gap-2.5 rounded-3xl p-4.5">
          <h2 className="text-subtitle-1 text-grey-900">출산일을 잘못 적으셨나요?</h2>
          <p className="text-grey-700 text-sm leading-normal">
            출산 전으로 되돌리면 임신 중 홈과 측정 알림으로 돌아가요.
          </p>
          <button
            type="button"
            className="border-grey-200 text-grey-900 h-12 rounded-xl border bg-white text-base leading-none font-bold"
            onClick={() => setUndoSheet(true)}
          >
            출산 전으로 되돌리기
          </button>
        </section>
      ) : (
        <section className="mt-6 flex flex-col gap-2.5 rounded-3xl bg-yellow-50 p-4.5">
          <h2 className="text-subtitle-1 text-grey-900">출산·입원하셨나요?</h2>
          <p className="text-grey-700 text-sm leading-normal">
            입원하면 알림만 잠시 멈추고, 출산일을 적으면
            <br />
            산후 모드로 바뀌어요.
          </p>
          <button
            type="button"
            className="bg-grey-900 h-12 rounded-xl text-base leading-none font-bold text-white"
            onClick={() => setBirthSheet(true)}
          >
            출산·입원했어요
          </button>
        </section>
      )}

      <div className="mt-6">
        <Field label="로그인 방식">
          <div className="bg-grey-50 flex flex-col rounded-2xl pr-3 pl-4">
            {methods.email && (
              <div className="flex h-13 items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="text-grey-900 text-base font-medium">이메일</span>
                  <Connected />
                </span>
                <button
                  type="button"
                  className="text-grey-700 flex h-11 items-center pr-1 pl-2 text-sm font-medium"
                  onClick={() => navigate(ROUTES.MY_PASSWORD)}
                >
                  비밀번호 바꾸기 ›
                </button>
              </div>
            )}
            {methods.email && (methods.kakao || loginMethods) && (
              <div className="bg-grey-200 h-px" />
            )}
            {methods.kakao ? (
              <div className="flex h-13 items-center gap-2">
                <span className="text-grey-900 text-base font-medium">카카오</span>
                <Connected />
              </div>
            ) : (
              // 연결하기는 서버가 연결 여부를 알려 줄 때만
              loginMethods && (
                <div className="flex h-13 items-center justify-between">
                  <span className="text-grey-900 text-base font-medium">카카오</span>
                  <button
                    type="button"
                    className="border-grey-200 text-grey-900 rounded-tag flex h-9 items-center border bg-white px-3.5 text-sm font-bold"
                    onClick={() =>
                      startKakaoLogin({ purpose: 'link', returnTo: ROUTES.MY_PROFILE })
                    }
                  >
                    연결하기
                  </button>
                </div>
              )
            )}
          </div>
          {!methods.email && (
            <p className="text-t7 text-grey-600">카카오로 로그인해서 비밀번호가 없어요</p>
          )}
        </Field>
      </div>

      {editing && (
        <ProfileDateSheet
          {...DATE_SHEET[editing]}
          initialDate={dates[editing]}
          today={today}
          onSave={(date) => void saveDate(editing, date)}
          onClose={closeSheet}
        />
      )}
      {birthSheet && (
        <BirthOrHospitalSheet
          onNext={(choice) => {
            if (choice === 'birth') {
              navigate(ROUTES.POSTPARTUM_DELIVERY)
              return
            }
            // 입원 · 다른 상황은 서버가 알림만 멈추고 홈에서 바로 보여 줌
            ;(choice === 'other' ? savePaused(true) : saveHospitalized(true))
              .then(() => navigate(ROUTES.TODAY))
              .catch(() => {
                setBirthSheet(false)
                setToast('상황을 저장하지 못했어요. 잠시 후 다시 시도해 주세요')
              })
          }}
          onClose={() => setBirthSheet(false)}
        />
      )}
      {undoSheet && (
        <ConfirmSheet
          title="출산 전으로 되돌릴까요?"
          description="산후 홈 대신 임신 중 홈이 보여요. 적어 둔 산후 검사 일정은 다시 출산일을 적으면 돌아와요."
          confirmLabel="되돌리기"
          loading={undoing}
          onConfirm={confirmUndo}
          onClose={() => setUndoSheet(false)}
        />
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default ProfilePage
