import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { LOGIN_MAX_FAILURES, loginWithEmail, loginWithKakao } from '@/api/auth'
import iconAlert from '@/assets/icons/auth/alert.svg'
import iconCapsLock from '@/assets/icons/auth/caps-lock.svg'
import iconClear from '@/assets/icons/auth/clear.svg'
import iconEyeOff from '@/assets/icons/auth/eye-off.svg'
import iconEye from '@/assets/icons/auth/eye.svg'
import iconInfo from '@/assets/icons/auth/info.svg'
import iconLoading from '@/assets/icons/auth/loading.svg'
import iconLock from '@/assets/icons/auth/lock.svg'
import iconToastAlert from '@/assets/icons/auth/toast-alert.svg'
import iconToastInfo from '@/assets/icons/auth/toast-info.svg'
import iconToastOffline from '@/assets/icons/auth/toast-offline.svg'
import iconKakao from '@/assets/icons/onboarding/kakao.svg'
import loginCharacter from '@/assets/images/auth/login-character.svg'
import AuthField, { type FieldHelper } from '@/components/auth/AuthField'
import AuthHeader from '@/components/auth/AuthHeader'
import AuthToast from '@/components/auth/AuthToast'
import KakaoAccountSheet from '@/components/auth/KakaoAccountSheet'
import { ROUTES } from '@/constants/routes'
import { useFinishLogin } from '@/hooks/useFinishLogin'
import { useGoBack } from '@/hooks/useGoBack'
import { useAuthStore } from '@/stores/useAuthStore'
import { EMAIL_PATTERN } from '@/utils/auth'

type EmailError = 'empty' | 'format'
type PasswordError =
  { kind: 'empty' } | { kind: 'wrong'; failures: number } | { kind: 'locked'; minutes: number }
type ToastKind = 'kakaoCancel' | 'kakaoFail' | 'offline'

const TOAST: Record<ToastKind, { icon: string; message: string }> = {
  kakaoCancel: { icon: iconToastInfo, message: '카카오 로그인을 취소했어요' },
  kakaoFail: {
    icon: iconToastAlert,
    message: '카카오 로그인에 실패했어요. 잠시 후 다시 시도해 주세요',
  },
  offline: {
    icon: iconToastOffline,
    message: '인터넷 연결이 불안정해요. 연결을 확인하고 다시 시도해 주세요',
  },
}

// 카카오 인가 후 돌아올 때 붙는 error. 사용자가 취소하면 access_denied
function kakaoToast(error: string | null): ToastKind | null {
  if (!error) return null
  return error === 'access_denied' ? 'kakaoCancel' : 'kakaoFail'
}

function RecentChip() {
  return (
    <span className="bg-grey-900 text-caption absolute -top-3 right-2.5 rounded-full px-2.5 py-1 leading-normal font-bold text-white">
      최근 로그인
    </span>
  )
}

// Figma L-01~L-10 이메일 로그인 · K-05·K-06 카카오 취소·실패 후 돌아옴
function LoginPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.ONBOARDING)
  const [searchParams, setSearchParams] = useSearchParams()
  const lastMethod = useAuthStore((state) => state.lastMethod)
  const finish = useFinishLogin()

  const emailRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<EmailError | null>(null)
  const [passwordError, setPasswordError] = useState<PasswordError | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [loading, setLoading] = useState(false)
  const [kakaoSheet, setKakaoSheet] = useState(false)
  const [toast, setToast] = useState<ToastKind | null>(() => kakaoToast(searchParams.get('error')))
  const closeToast = useCallback(() => setToast(null), [])

  // 토스트로 한 번 알렸으면 주소의 error는 지움
  useEffect(() => {
    if (searchParams.has('error')) setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  const locked = passwordError?.kind === 'locked'

  const findPassword = () => navigate(ROUTES.PASSWORD_FIND)
  const signUp = () => navigate(ROUTES.SIGNUP)

  const loginKakao = async () => {
    setKakaoSheet(false)
    if (!navigator.onLine) {
      setToast('offline')
      return
    }
    await loginWithKakao()
    finish('kakao')
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (loading || locked) return

    const trimmed = email.trim()
    const nextEmailError: EmailError | null = !trimmed
      ? 'empty'
      : EMAIL_PATTERN.test(trimmed)
        ? null
        : 'format'
    setEmail(trimmed)
    setEmailError(nextEmailError)
    setPasswordError(password ? null : { kind: 'empty' })
    if (nextEmailError || !password) return

    if (!navigator.onLine) {
      setToast('offline')
      return
    }

    setLoading(true)
    const result = await loginWithEmail(trimmed, password)
    setLoading(false)

    if (result.status === 'ok') finish('email', trimmed)
    else if (result.status === 'kakao') setKakaoSheet(true)
    else if (result.status === 'wrong')
      setPasswordError({ kind: 'wrong', failures: result.failures })
    else setPasswordError({ kind: 'locked', minutes: result.minutes })
  }

  const trackCapsLock = (event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState('CapsLock'))
  }

  const emailHelper: FieldHelper | null =
    emailError === 'empty'
      ? { icon: iconAlert, text: '이메일을 입력해 주세요', tone: 'error' }
      : emailError === 'format'
        ? {
            icon: iconAlert,
            text: '이메일 형식을 확인해 주세요 (예: name@email.com)',
            tone: 'error',
          }
        : null

  const findAction = { label: '비밀번호 찾기', onClick: findPassword }
  // 계정 노출을 막으려고 이메일·비밀번호 중 어느 쪽이 틀렸는지 밝히지 않음
  const passwordHelper: FieldHelper | null =
    passwordError?.kind === 'empty'
      ? { icon: iconAlert, text: '비밀번호를 입력해 주세요', tone: 'error' }
      : passwordError?.kind === 'wrong'
        ? {
            icon: iconAlert,
            text: `이메일 또는 비밀번호가 맞지 않아요 (${passwordError.failures}/${LOGIN_MAX_FAILURES})`,
            tone: 'error',
            action: findAction,
          }
        : passwordError?.kind === 'locked'
          ? {
              icon: iconLock,
              text: `${LOGIN_MAX_FAILURES}번 틀려서 ${passwordError.minutes}분 동안 로그인할 수 없어요.`,
              tone: 'error',
              action: findAction,
            }
          : passwordFocused && capsLock
            ? { icon: iconCapsLock, text: 'Caps Lock이 켜져 있어요', tone: 'info' }
            : null

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-14.5 pb-[max(--spacing(9),env(safe-area-inset-bottom))]">
      <AuthHeader onBack={goBack} />

      <div className="mt-3.5 flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-t2 text-grey-900">로그인</h1>
          <p className="text-grey-500 text-sm leading-normal">
            지난 기록을 그대로 이어서 볼 수 있어요
          </p>
        </div>
        <img src={loginCharacter} alt="" width={70} height={70} />
      </div>

      <form noValidate className="mt-6 flex flex-col" onSubmit={submit}>
        <div className="flex flex-col gap-4">
          <AuthField
            label="이메일"
            inputId="login-email"
            invalid={!!emailError}
            helper={emailHelper}
          >
            <input
              ref={emailRef}
              id="login-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="name@email.com"
              value={email}
              aria-invalid={!!emailError}
              aria-describedby={emailHelper ? 'login-email-helper' : undefined}
              className="text-input text-grey-900 placeholder:text-grey-500 caret-primary peer min-w-0 flex-1 bg-transparent outline-none"
              onChange={(event) => {
                setEmail(event.target.value)
                setEmailError(null)
                // 다른 계정이면 틀린 횟수·잠금 안내도 지움
                if (passwordError?.kind !== 'empty') setPasswordError(null)
              }}
              // 형식은 타이핑 중이 아니라 칸을 떠날 때 검사
              onBlur={() => {
                const trimmed = email.trim()
                setEmail(trimmed)
                if (trimmed && !EMAIL_PATTERN.test(trimmed)) setEmailError('format')
              }}
            />
            {email && (
              <button
                type="button"
                aria-label="이메일 지우기"
                className="hidden shrink-0 peer-focus:block"
                // 누르는 순간 입력칸 포커스가 빠지지 않게
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

          <AuthField
            label="비밀번호"
            inputId="login-password"
            invalid={!!passwordError && !locked}
            helper={passwordHelper}
          >
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="8자 이상, 영문·숫자"
              value={password}
              disabled={locked}
              aria-invalid={!!passwordError}
              aria-describedby={passwordHelper ? 'login-password-helper' : undefined}
              className={`text-grey-900 placeholder:text-grey-500 caret-primary disabled:text-grey-400 placeholder:text-input min-w-0 flex-1 bg-transparent outline-none ${
                password && !showPassword ? 'text-t4 font-medium' : 'text-input'
              }`}
              onChange={(event) => {
                setPassword(event.target.value)
                if (passwordError?.kind !== 'locked') setPasswordError(null)
              }}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              onKeyDown={trackCapsLock}
              onKeyUp={trackCapsLock}
            />
            <button
              type="button"
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              aria-pressed={showPassword}
              className="shrink-0"
              onClick={() => setShowPassword((shown) => !shown)}
            >
              <img src={showPassword ? iconEye : iconEyeOff} alt="" width={20} height={20} />
            </button>
          </AuthField>
        </div>

        <button
          type="submit"
          disabled={locked}
          aria-busy={loading}
          className="text-subtitle-1 bg-primary disabled:bg-grey-100 disabled:text-grey-400 relative mt-2 h-14 rounded-xl leading-none text-white"
        >
          <span className={loading ? 'opacity-0' : undefined}>로그인</span>
          {loading && (
            <img
              src={iconLoading}
              alt=""
              width={31}
              height={7}
              className="absolute top-1/2 left-1/2 -translate-1/2"
            />
          )}
          {lastMethod === 'email' && <RecentChip />}
        </button>
      </form>

      <p className="mt-5 flex items-center justify-center gap-3.5">
        <button
          type="button"
          className="text-grey-600 text-sm leading-normal font-medium"
          onClick={findPassword}
        >
          비밀번호 찾기
        </button>
        <span aria-hidden className="text-grey-300 text-xs leading-normal">
          |
        </span>
        <button
          type="button"
          className="text-grey-900 text-sm leading-normal font-bold"
          onClick={signUp}
        >
          이메일로 회원가입
        </button>
      </p>

      <p className="text-t7 text-grey-400 mt-11 flex items-center gap-3">
        <span className="bg-grey-200 h-px flex-1" />
        또는
        <span className="bg-grey-200 h-px flex-1" />
      </p>

      <button
        type="button"
        className="bg-kakao text-kakao-label text-subtitle-1 relative mt-10.5 flex h-14 items-center justify-center gap-1 rounded-xl leading-none"
        onClick={loginKakao}
      >
        <img src={iconKakao} alt="" width={20} height={20} />
        카카오로 로그인
        {lastMethod === 'kakao' && <RecentChip />}
      </button>

      <p className="text-grey-500 mt-8 flex items-center justify-center gap-1.5 text-xs leading-normal">
        <img src={iconInfo} alt="" width={14} height={14} />
        같은 계정으로 가입한 방법을 선택해 주세요
      </p>

      {kakaoSheet && (
        <KakaoAccountSheet onKakao={loginKakao} onClose={() => setKakaoSheet(false)} />
      )}
      {toast && <AuthToast {...TOAST[toast]} onClose={closeToast} />}
    </main>
  )
}

export default LoginPage
