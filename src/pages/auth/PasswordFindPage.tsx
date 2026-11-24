import { useCallback, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { VERIFY_MAX_SENDS, requestPasswordReset } from '@/api/auth'
import iconAlert from '@/assets/icons/auth/alert.svg'
import iconClear from '@/assets/icons/auth/clear.svg'
import iconLock from '@/assets/icons/auth/lock.svg'
import iconLoading from '@/assets/icons/auth/loading.svg'
import iconNoticeInfo from '@/assets/icons/auth/notice-info.svg'
import iconResultMail from '@/assets/icons/auth/result-mail.svg'
import iconToastAlert from '@/assets/icons/auth/toast-alert.svg'
import iconToastInfo from '@/assets/icons/auth/toast-info.svg'
import iconToastOffline from '@/assets/icons/auth/toast-offline.svg'
import AuthField, { type FieldHelper } from '@/components/auth/AuthField'
import AuthHeader from '@/components/auth/AuthHeader'
import AuthResultScreen from '@/components/auth/AuthResultScreen'
import AuthToast from '@/components/auth/AuthToast'
import { SUPPORT_EMAIL } from '@/constants/contact'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useNow } from '@/hooks/useNow'
import { EMAIL_PATTERN } from '@/utils/auth'

type EmailError = 'empty' | 'format'
type ToastKind = 'offline' | 'resent' | 'failed' | 'spam'

const TOAST: Record<ToastKind, { icon: string; message: string }> = {
  offline: {
    icon: iconToastOffline,
    message: '인터넷 연결이 불안정해요. 연결을 확인하고 다시 시도해 주세요.',
  },
  resent: { icon: iconToastInfo, message: '메일을 다시 보냈어요' },
  failed: { icon: iconToastAlert, message: '메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요' },
  spam: { icon: iconToastInfo, message: '메일이 안 보이면 스팸함 · 프로모션함도 확인해 주세요' },
}

// 예: 0:42
const formatWait = (ms: number) => {
  const seconds = Math.ceil(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

// Figma R-01~R-04 · R-11 비밀번호 찾기: 이메일 → 재설정 링크 메일 보냄, 다시 보내기는 60초 뒤
function PasswordFindPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.LOGIN)
  const emailRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<EmailError | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  // 다시 보낼 수 있는 시각 · 오늘 횟수를 다 썼는지
  const [resendAt, setResendAt] = useState(0)
  const [limit, setLimit] = useState(false)
  const now = useNow(1000).getTime()
  const waitMs = Math.max(0, resendAt - now)
  const [toast, setToast] = useState<ToastKind | null>(null)
  const closeToast = useCallback(() => setToast(null), [])

  // 가입 여부와 상관없이 늘 보냈다고 안내. 'wait'면 60초 안이라 앞서 보낸 메일 그대로
  const send = async (): Promise<'sent' | 'wait' | null> => {
    if (!navigator.onLine) {
      setToast('offline')
      return null
    }
    setLoading(true)
    try {
      const result = await requestPasswordReset(email.trim())
      // 다 쓰면 입력 화면에서 막고 문의하기를 남김
      if (result.status === 'limit') {
        setLimit(true)
        setSent(false)
        return null
      }
      setResendAt(result.resendAt)
      return result.status === 'ok' ? 'sent' : 'wait'
    } catch {
      setToast('failed')
      return null
    } finally {
      setLoading(false)
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (loading || limit) return
    const trimmed = email.trim()
    setEmail(trimmed)
    const error: EmailError | null = !trimmed
      ? 'empty'
      : EMAIL_PATTERN.test(trimmed)
        ? null
        : 'format'
    setEmailError(error)
    if (error) return
    if (await send()) setSent(true)
  }

  const toastView = toast && <AuthToast {...TOAST[toast]} onClose={closeToast} />

  if (sent) {
    return (
      <>
        <AuthResultScreen
          headerTitle="비밀번호 찾기"
          title="메일을 보냈어요"
          description={
            <>
              {email} 으로 보냈어요.
              <br />
              가입된 이메일이면 재설정 링크가 도착해요.
              <br />
              링크는 30분 동안 쓸 수 있어요.
            </>
          }
          icon={iconResultMail}
          iconClassName="bg-yellow-50"
          onBack={() => setSent(false)}
          action={{ label: '로그인으로 돌아가기', onClick: () => navigate(ROUTES.LOGIN) }}
          extra={
            <p className="text-grey-600 flex items-center justify-center gap-3 text-sm leading-normal">
              <button type="button" className="underline" onClick={() => setToast('spam')}>
                메일이 안 와요
              </button>
              <span aria-hidden className="text-grey-300 text-xs">
                |
              </span>
              {/* 보낸 뒤 60초는 남은 시간만 */}
              <button
                type="button"
                disabled={waitMs > 0 || loading}
                className="disabled:text-grey-500"
                onClick={async () => {
                  if ((await send()) === 'sent') setToast('resent')
                }}
              >
                {waitMs > 0 ? `${formatWait(waitMs)} 후 다시 받기` : '다시 받기'}
              </button>
            </p>
          }
        />
        {toastView}
      </>
    )
  }

  const helper: FieldHelper | null = limit
    ? {
        icon: iconLock,
        text: `오늘 보낼 수 있는 횟수(${VERIFY_MAX_SENDS}번)를 다 썼어요.\n내일 다시 받아 주세요.`,
        tone: 'error',
      }
    : emailError === 'empty'
      ? { icon: iconAlert, text: '이메일을 입력해 주세요', tone: 'error' }
      : emailError === 'format'
        ? {
            icon: iconAlert,
            text: '이메일 형식을 확인해 주세요 (예: name@email.com)',
            tone: 'error',
          }
        : null

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-14.5 pb-[max(--spacing(9),env(safe-area-inset-bottom))]">
      <AuthHeader onBack={goBack}>
        <p className="text-subtitle-1 text-grey-900">비밀번호 찾기</p>
      </AuthHeader>

      <div className="mt-7 flex flex-col gap-1.5">
        <h1 className="text-title-2 text-grey-900">
          가입한 이메일을
          <br />
          알려 주세요
        </h1>
        <p className="text-grey-500 text-sm leading-normal">
          비밀번호를 다시 정하는 링크를 보내 드려요
        </p>
      </div>

      <form noValidate className="flex flex-1 flex-col" onSubmit={submit}>
        {/* 안내 한 줄 자리까지 잡아 두어 아래 안내 상자가 흔들리지 않게 */}
        <div className="mt-8 min-h-27.5">
          <AuthField label="이메일" inputId="find-email" invalid={!!emailError} helper={helper}>
            <input
              ref={emailRef}
              id="find-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="name@email.com"
              value={email}
              aria-invalid={!!emailError}
              aria-describedby={helper ? 'find-email-helper' : undefined}
              className="text-input text-grey-900 placeholder:text-grey-500 caret-primary peer min-w-0 flex-1 bg-transparent outline-none"
              onChange={(event) => {
                setEmail(event.target.value)
                setEmailError(null)
                // 횟수는 이메일마다라 다른 이메일이면 다시 보낼 수 있음
                setLimit(false)
                setResendAt(0)
              }}
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
        </div>

        <p className="bg-grey-50 text-t7 text-grey-700 mt-0.5 flex items-start gap-2.5 rounded-2xl px-4 py-3.5">
          <img src={iconNoticeInfo} alt="" width={18} height={18} className="shrink-0" />
          <span>
            카카오로 가입하셨다면 비밀번호 없이
            <br />
            카카오 로그인을 이용해 주세요.
          </span>
        </p>
        {limit && (
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-grey-700 mt-4 self-center text-sm leading-normal underline"
          >
            문의하기
          </a>
        )}

        <button
          type="submit"
          disabled={limit}
          aria-busy={loading}
          className="text-subtitle-1 bg-primary disabled:bg-grey-100 disabled:text-grey-400 relative mt-auto h-14 shrink-0 rounded-xl leading-none text-white"
        >
          <span className={loading ? 'opacity-0' : undefined}>
            {limit ? '내일 다시 받을 수 있어요' : '재설정 링크 보내기'}
          </span>
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

      {toastView}
    </main>
  )
}

export default PasswordFindPage
