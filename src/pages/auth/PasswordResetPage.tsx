import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { checkResetToken, resetPassword } from '@/api/auth'
import iconLoading from '@/assets/icons/auth/loading.svg'
import iconResultDone from '@/assets/icons/auth/result-done.svg'
import iconResultExpired from '@/assets/icons/auth/result-expired.svg'
import iconToastOffline from '@/assets/icons/auth/toast-offline.svg'
import AuthHeader from '@/components/auth/AuthHeader'
import AuthResultScreen from '@/components/auth/AuthResultScreen'
import AuthToast from '@/components/auth/AuthToast'
import NewPasswordFields from '@/components/auth/NewPasswordFields'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { isNewPasswordValid } from '@/utils/auth'

type ResetStep =
  | { kind: 'checking' }
  | { kind: 'form'; email: string }
  | { kind: 'expired' }
  | { kind: 'done' }

// Figma R-05~R-10 메일 링크로 들어와 새 비밀번호 정하기
function PasswordResetPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.LOGIN)
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [step, setStep] = useState<ResetStep>({ kind: 'checking' })
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [sameAsBefore, setSameAsBefore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [offlineToast, setOfflineToast] = useState(false)
  const closeToast = useCallback(() => setOfflineToast(false), [])

  // 링크를 열면 먼저 만료·사용 여부부터 확인
  useEffect(() => {
    let active = true
    checkResetToken(token).then((result) => {
      if (!active) return
      setStep(result.status === 'ok' ? { kind: 'form', email: result.email } : { kind: 'expired' })
    })
    return () => {
      active = false
    }
  }, [token])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (loading) return
    setSubmitted(true)
    if (!isNewPasswordValid(password, confirm)) return
    if (!navigator.onLine) {
      setOfflineToast(true)
      return
    }

    setLoading(true)
    const result = await resetPassword(token, password)
    setLoading(false)

    if (result.status === 'same') setSameAsBefore(true)
    else setStep({ kind: result.status === 'ok' ? 'done' : 'expired' })
  }

  if (step.kind === 'checking') return <main className="min-h-dvh bg-white" aria-busy />

  if (step.kind === 'expired') {
    return (
      <AuthResultScreen
        headerTitle="비밀번호 재설정"
        title="링크가 만료됐어요"
        description={
          <>
            보안을 위해 링크는 30분 동안만 쓸 수 있어요.
            <br />
            다시 받아 주세요.
          </>
        }
        icon={iconResultExpired}
        iconClassName="bg-grey-100"
        onBack={goBack}
        action={{
          label: '링크 다시 받기',
          onClick: () => navigate(ROUTES.PASSWORD_FIND, { replace: true }),
        }}
      />
    )
  }

  if (step.kind === 'done') {
    return (
      <AuthResultScreen
        headerTitle="비밀번호 재설정"
        title="비밀번호를 바꿨어요"
        description={
          <>
            새 비밀번호로 로그인해 주세요.
            <br />
            다른 기기에서는 자동으로 로그아웃돼요.
          </>
        }
        icon={iconResultDone}
        iconClassName="bg-green-50"
        onBack={goBack}
        action={{ label: '로그인하기', onClick: () => navigate(ROUTES.LOGIN, { replace: true }) }}
      />
    )
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-14.5 pb-[max(--spacing(9),env(safe-area-inset-bottom))]">
      <AuthHeader onBack={goBack}>
        <p className="text-subtitle-1 text-grey-900">비밀번호 재설정</p>
      </AuthHeader>

      <div className="mt-7 flex flex-col gap-1.5">
        <h1 className="text-title-2 text-grey-900">
          새 비밀번호를
          <br />
          정해 주세요
        </h1>
        <p className="text-grey-500 text-sm leading-normal">{step.email} 계정</p>
      </div>

      <form noValidate className="mt-8 flex flex-1 flex-col" onSubmit={submit}>
        <div className="mb-6 flex flex-col gap-4">
          <NewPasswordFields
            idPrefix="reset"
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

export default PasswordResetPage
