import { useCallback, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { changePassword } from '@/api/auth'
import iconAlert from '@/assets/icons/auth/alert.svg'
import iconEyeOff from '@/assets/icons/auth/eye-off.svg'
import iconEye from '@/assets/icons/auth/eye.svg'
import iconLoading from '@/assets/icons/auth/loading.svg'
import iconToastOffline from '@/assets/icons/auth/toast-offline.svg'
import AuthField, { type FieldHelper } from '@/components/auth/AuthField'
import AuthToast from '@/components/auth/AuthToast'
import NewPasswordFields from '@/components/auth/NewPasswordFields'
import SubPageHeader from '@/components/common/SubPageHeader'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useAuthStore } from '@/stores/useAuthStore'
import { isNewPasswordValid } from '@/utils/auth'

type CurrentError = 'empty' | 'wrong'

// Figma M-09 비밀번호 바꾸기. 이메일로 가입한 계정만
function PasswordChangePage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.MY_PROFILE)
  const account = useAuthStore((state) => state.account)

  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [currentError, setCurrentError] = useState<CurrentError | null>(null)
  const [sameAsBefore, setSameAsBefore] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [offlineToast, setOfflineToast] = useState(false)
  const closeToast = useCallback(() => setOfflineToast(false), [])

  // 카카오 계정은 비밀번호가 없음
  if (account?.method !== 'email' || !account.email) {
    return <Navigate to={ROUTES.MY_PROFILE} replace />
  }
  const email = account.email

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (loading) return
    setSubmitted(true)
    setCurrentError(current ? null : 'empty')
    if (!current || !isNewPasswordValid(password, confirm)) return
    if (!navigator.onLine) {
      setOfflineToast(true)
      return
    }

    setLoading(true)
    const result = await changePassword(email, current, password)
    setLoading(false)

    if (result.status === 'wrong') setCurrentError('wrong')
    else if (result.status === 'same') setSameAsBefore(true)
    else navigate(ROUTES.MY_PROFILE, { replace: true, state: { toast: '비밀번호를 바꿨어요' } })
  }

  const currentHelper: FieldHelper | null =
    currentError === 'empty'
      ? { icon: iconAlert, text: '현재 비밀번호를 입력해 주세요', tone: 'error' }
      : currentError === 'wrong'
        ? { icon: iconAlert, text: '현재 비밀번호가 맞지 않아요', tone: 'error' }
        : null

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-13 pb-[max(--spacing(9),env(safe-area-inset-bottom))]">
      <SubPageHeader title="비밀번호 바꾸기" onBack={goBack} />

      <div className="mt-5.5 flex flex-col gap-1.5">
        <h1 className="text-title-2 text-grey-900">
          새 비밀번호를
          <br />
          정해 주세요
        </h1>
        <p className="text-grey-600 text-sm leading-normal">{email} 계정</p>
      </div>

      <form noValidate className="mt-8 flex flex-1 flex-col" onSubmit={submit}>
        <div className="mb-6 flex flex-col gap-4">
          <AuthField
            label="현재 비밀번호"
            inputId="change-current"
            invalid={!!currentError}
            helper={currentHelper}
          >
            <input
              id="change-current"
              type={showCurrent ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="지금 쓰는 비밀번호"
              value={current}
              aria-invalid={!!currentError}
              aria-describedby={currentHelper ? 'change-current-helper' : undefined}
              className={`text-grey-900 placeholder:text-grey-500 placeholder:text-input caret-primary min-w-0 flex-1 bg-transparent outline-none ${
                current && !showCurrent ? 'text-t4 font-medium' : 'text-input'
              }`}
              onChange={(event) => {
                setCurrent(event.target.value)
                setCurrentError(null)
              }}
            />
            <button
              type="button"
              aria-label={showCurrent ? '현재 비밀번호 숨기기' : '현재 비밀번호 보기'}
              aria-pressed={showCurrent}
              className="shrink-0"
              onClick={() => setShowCurrent((shown) => !shown)}
            >
              <img src={showCurrent ? iconEye : iconEyeOff} alt="" width={20} height={20} />
            </button>
          </AuthField>

          <NewPasswordFields
            idPrefix="change"
            passwordLabel="새 비밀번호"
            password={password}
            confirm={confirm}
            onPasswordChange={(value) => {
              setPassword(value)
              setSameAsBefore(false)
            }}
            onConfirmChange={setConfirm}
            submitted={submitted}
            passwordError={sameAsBefore ? '전에 쓰던 비밀번호와 달라야 해요' : null}
          />
        </div>

        <button
          type="submit"
          aria-busy={loading}
          className="text-subtitle-1 bg-primary relative mt-auto h-14 shrink-0 rounded-xl leading-none text-white"
        >
          <span className={loading ? 'opacity-0' : undefined}>비밀번호 바꾸기</span>
          {loading && (
            <img
              src={iconLoading}
              alt=""
              width={31}
              height={7}
              className="absolute top-1/2 left-1/2 -translate-1/2"
            />
          )}
        </button>
      </form>

      {offlineToast && (
        <AuthToast
          icon={iconToastOffline}
          message="인터넷 연결이 불안정해요. 입력한 내용은 그대로 있어요"
          onClose={closeToast}
        />
      )}
    </main>
  )
}

export default PasswordChangePage
