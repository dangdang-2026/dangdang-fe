import { useCallback, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { checkEmail, loginWithKakao, signUpWithEmail } from '@/api/auth'
import iconAlert from '@/assets/icons/auth/alert.svg'
import iconInfoBlue from '@/assets/icons/auth/caps-lock.svg'
import iconCheck from '@/assets/icons/auth/check.svg'
import iconClear from '@/assets/icons/auth/clear.svg'
import iconLoading from '@/assets/icons/auth/loading.svg'
import iconToastOffline from '@/assets/icons/auth/toast-offline.svg'
import AuthField, { type FieldHelper } from '@/components/auth/AuthField'
import AuthHeader from '@/components/auth/AuthHeader'
import AuthToast from '@/components/auth/AuthToast'
import EmailVerifyStep from '@/components/auth/EmailVerifyStep'
import NewPasswordFields from '@/components/auth/NewPasswordFields'
import { ROUTES } from '@/constants/routes'
import { useFinishLogin } from '@/hooks/useFinishLogin'
import { useGoBack } from '@/hooks/useGoBack'
import { useProfileStore } from '@/stores/useProfileStore'
import { EMAIL_PATTERN, isNewPasswordValid, replaceDomain, suggestDomain } from '@/utils/auth'

const NAME_MAX = 20
// 가입 → 약관 → 병원 기준
const STEP_COUNT = 3

type EmailStatus =
  { kind: 'empty' | 'format' | 'available' | 'taken' | 'kakao' } | { kind: 'typo'; domain: string }

const INPUT_CLASS =
  'text-grey-900 placeholder:text-grey-500 caret-primary peer min-w-0 flex-1 bg-transparent outline-none'

// Figma J-01~J-12 이메일 회원가입. 다음을 누르면 같은 화면에서 이메일 인증(V)으로
function SignupPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.ONBOARDING)
  const finish = useFinishLogin()
  const updateProfile = useProfileStore((state) => state.updateProfile)

  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  // 어느 이메일을 확인한 결과인지 함께 둠. 그 사이 고치면 결과는 버려짐
  const [emailCheck, setEmailCheck] = useState<{ email: string; status: EmailStatus } | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [offlineToast, setOfflineToast] = useState(false)
  const closeToast = useCallback(() => setOfflineToast(false), [])
  // 인증번호를 보낸 시각. 있으면 인증 단계
  const [sentAt, setSentAt] = useState<number | null>(null)

  const emailStatus = emailCheck?.email === email ? emailCheck.status : null
  const nameEmpty = submitted && !name.trim()

  // 칸을 떠날 때 형식 → 오타 → 중복 순으로 확인
  const inspectEmail = async (value: string) => {
    const trimmed = value.trim()
    const mark = (status: EmailStatus) => setEmailCheck({ email: trimmed, status })
    setEmail(trimmed)
    if (!trimmed || !navigator.onLine) return
    if (!EMAIL_PATTERN.test(trimmed)) return mark({ kind: 'format' })
    const domain = suggestDomain(trimmed)
    if (domain) return mark({ kind: 'typo', domain })

    const owner = await checkEmail(trimmed)
    mark({ kind: owner === 'none' ? 'available' : owner === 'email' ? 'taken' : 'kakao' })
  }

  const loginKakao = async () => {
    if (!navigator.onLine) {
      setOfflineToast(true)
      return
    }
    await loginWithKakao()
    finish('kakao')
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (loading) return

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    setName(trimmedName)
    setEmail(trimmedEmail)
    setSubmitted(true)

    const emailInvalid = !trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)
    if (emailInvalid) {
      setEmailCheck({ email: trimmedEmail, status: { kind: trimmedEmail ? 'format' : 'empty' } })
    }

    const blocked =
      !trimmedName ||
      emailInvalid ||
      emailStatus?.kind === 'taken' ||
      emailStatus?.kind === 'kakao' ||
      !isNewPasswordValid(password, confirm)
    if (blocked) return

    if (!navigator.onLine) {
      setOfflineToast(true)
      return
    }

    setLoading(true)
    const result = await signUpWithEmail(trimmedName, trimmedEmail, password)
    setLoading(false)

    if (result.status === 'ok') setSentAt(result.sentAt)
    else {
      setEmailCheck({
        email: trimmedEmail,
        status: { kind: result.status === 'email' ? 'taken' : 'kakao' },
      })
    }
  }

  if (sentAt !== null) {
    const backToForm = () => setSentAt(null)
    return (
      <EmailVerifyStep
        key={sentAt}
        email={email}
        sentAt={sentAt}
        onBack={backToForm}
        onChangeEmail={() => {
          backToForm()
          window.setTimeout(() => emailRef.current?.focus())
        }}
        onVerified={() => {
          updateProfile({ name })
          finish('email', email)
        }}
      />
    )
  }

  const emailHelper: FieldHelper | null =
    emailStatus?.kind === 'empty'
      ? { icon: iconAlert, text: '이메일을 입력해 주세요', tone: 'error' }
      : emailStatus?.kind === 'format'
        ? {
            icon: iconAlert,
            text: '이메일 형식을 확인해 주세요 (예: name@email.com)',
            tone: 'error',
          }
        : emailStatus?.kind === 'typo'
          ? {
              icon: iconInfoBlue,
              text: `혹시 ${emailStatus.domain}인가요?`,
              tone: 'info',
              action: {
                label: '바꾸기',
                onClick: () => void inspectEmail(replaceDomain(email, emailStatus.domain)),
              },
            }
          : emailStatus?.kind === 'available'
            ? { icon: iconCheck, text: '사용할 수 있는 이메일이에요', tone: 'success' }
            : emailStatus?.kind === 'taken'
              ? {
                  icon: iconAlert,
                  text: '이미 가입된 이메일이에요.',
                  tone: 'error',
                  action: { label: '로그인하기', onClick: () => navigate(ROUTES.LOGIN) },
                }
              : emailStatus?.kind === 'kakao'
                ? {
                    icon: iconAlert,
                    text: '카카오로 가입된 이메일이에요.',
                    tone: 'error',
                    action: { label: '카카오로 로그인', onClick: () => void loginKakao() },
                  }
                : null
  const emailInvalid = ['empty', 'format', 'taken', 'kakao'].includes(emailStatus?.kind ?? '')

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-14.5 pb-[max(--spacing(9),env(safe-area-inset-bottom))]">
      <AuthHeader onBack={goBack}>
        <p aria-label={`${STEP_COUNT}단계 중 1단계`} className="flex gap-1.5">
          {Array.from({ length: STEP_COUNT }, (_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full ${index === 0 ? 'bg-primary w-7' : 'bg-grey-200 w-2.5'}`}
            />
          ))}
        </p>
      </AuthHeader>

      <div className="mt-5.5 flex flex-col gap-1.5">
        <h1 className="text-title-2 text-grey-900">계정을 만들어 주세요</h1>
        <p className="text-grey-500 text-sm leading-normal">
          건강 정보는 다음 단계에서 따로 동의를 받아요
        </p>
      </div>

      <form noValidate className="mt-8 flex flex-1 flex-col" onSubmit={submit}>
        <div className="mb-6 flex flex-col gap-4">
          <AuthField
            label="이름"
            inputId="signup-name"
            invalid={nameEmpty}
            helper={
              nameEmpty ? { icon: iconAlert, text: '이름을 입력해 주세요', tone: 'error' } : null
            }
          >
            <input
              ref={nameRef}
              id="signup-name"
              autoComplete="name"
              placeholder="이름을 입력해 주세요"
              maxLength={NAME_MAX}
              value={name}
              aria-invalid={nameEmpty}
              className={`text-input ${INPUT_CLASS}`}
              onChange={(event) => setName(event.target.value)}
            />
            {name && (
              <button
                type="button"
                aria-label="이름 지우기"
                className="hidden shrink-0 peer-focus:block"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setName('')
                  nameRef.current?.focus()
                }}
              >
                <img src={iconClear} alt="" width={20} height={20} />
              </button>
            )}
          </AuthField>

          <AuthField
            label="이메일"
            inputId="signup-email"
            invalid={emailInvalid}
            helper={emailHelper}
          >
            <input
              ref={emailRef}
              id="signup-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="name@email.com"
              value={email}
              aria-invalid={emailInvalid}
              aria-describedby={emailHelper ? 'signup-email-helper' : undefined}
              className={`text-input ${INPUT_CLASS}`}
              onChange={(event) => {
                setEmail(event.target.value)
              }}
              onBlur={(event) => void inspectEmail(event.target.value)}
            />
            {email && (
              <button
                type="button"
                aria-label="이메일 지우기"
                className="hidden shrink-0 peer-focus:block"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setEmail('')
                  emailRef.current?.focus()
                }}
              >
                <img src={iconClear} alt="" width={20} height={20} />
              </button>
            )}
          </AuthField>

          <NewPasswordFields
            idPrefix="signup"
            password={password}
            confirm={confirm}
            onPasswordChange={setPassword}
            onConfirmChange={setConfirm}
            submitted={submitted}
          />
        </div>

        <button
          type="submit"
          aria-busy={loading}
          className="text-subtitle-1 bg-primary relative mt-auto h-14 shrink-0 rounded-xl leading-none text-white"
        >
          <span className={loading ? 'opacity-0' : undefined}>다음</span>
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

export default SignupPage
