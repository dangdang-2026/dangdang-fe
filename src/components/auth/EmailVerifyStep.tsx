import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  VERIFY_CODE_LENGTH,
  VERIFY_MAX_FAILURES,
  VERIFY_MAX_SENDS,
  VERIFY_TTL_MS,
  sendVerifyCode,
  verifyEmailCode,
  type CodeSent,
} from '@/api/auth'
import iconAlert from '@/assets/icons/auth/alert.svg'
import iconCheck from '@/assets/icons/auth/check.svg'
import iconClock from '@/assets/icons/auth/clock.svg'
import iconLoading from '@/assets/icons/auth/loading.svg'
import iconLock from '@/assets/icons/auth/lock.svg'
import iconMail from '@/assets/icons/auth/mail.svg'
import iconNoticeInfo from '@/assets/icons/auth/notice-info.svg'
import iconToastAlert from '@/assets/icons/auth/toast-alert.svg'
import iconToastOffline from '@/assets/icons/auth/toast-offline.svg'
import iconVerified from '@/assets/icons/auth/verified.svg'
import AuthField, { type FieldHelper } from '@/components/auth/AuthField'
import AuthHeader from '@/components/auth/AuthHeader'
import AuthToast from '@/components/auth/AuthToast'
import MailHelpSheet from '@/components/auth/MailHelpSheet'
import { SUPPORT_EMAIL } from '@/constants/contact'
import { useNow } from '@/hooks/useNow'

// 남은 시간이 이만큼 이하면 타이머를 빨갛게
const TIMER_WARN_MS = 60 * 1000

type VerifyStatus = 'idle' | 'wrong' | 'digits' | 'tooMany' | 'resent' | 'verified'

type ToastKind = 'offline' | 'verifyFailed' | 'sendFailed' | 'signUpFailed'

const TOAST: Record<ToastKind, { icon: string; message: string }> = {
  offline: {
    icon: iconToastOffline,
    message: '인터넷 연결이 불안정해요. 연결을 확인하고 다시 시도해 주세요.',
  },
  verifyFailed: {
    icon: iconToastAlert,
    message: '인증번호를 확인하지 못했어요. 잠시 후 다시 시도해 주세요',
  },
  sendFailed: {
    icon: iconToastAlert,
    message: '인증번호를 보내지 못했어요. 잠시 후 다시 시도해 주세요',
  },
  signUpFailed: {
    icon: iconToastAlert,
    message: '가입하지 못했어요. 잠시 후 다시 시도해 주세요',
  },
}

// 가입 화면에서 처음 보낸 결과. 메일을 못 보냈으면 mailFailed
export type FirstSend = ({ status: 'sent' } & CodeSent) | { status: 'mailFailed'; resendAt: number }

type EmailVerifyStepProps = {
  email: string
  firstSend: FirstSend
  onBack: () => void
  onChangeEmail: () => void
  // 가입까지 마침. 인증 유효 시간(30분)이 지났으면 'expired'
  onVerified: () => Promise<'expired' | void>
}

// 예: 09:59
function formatRemaining(ms: number) {
  const seconds = Math.ceil(ms / 1000)
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

// 예: 0:42
const formatWait = (ms: number) => {
  const seconds = Math.ceil(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

// Figma V-01~V-13 이메일 인증: 6자리 번호, 10분 제한, 5번 틀리면 다시 받기, 다시 받기는 60초 뒤
function EmailVerifyStep({
  email,
  firstSend,
  onBack,
  onChangeEmail,
  onVerified,
}: EmailVerifyStepProps) {
  const now = useNow(1000).getTime()
  // 메일을 못 보냈으면 null(타이머 없음)
  const [sentAt, setSentAt] = useState<number | null>(
    firstSend.status === 'sent' ? firstSend.sentAt : null,
  )
  const [resendAt, setResendAt] = useState(firstSend.resendAt)
  const [remainingSends, setRemainingSends] = useState<number | null>(
    firstSend.status === 'sent' ? firstSend.remainingSends : null,
  )
  const [mailFailed, setMailFailed] = useState(firstSend.status === 'mailFailed')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<VerifyStatus>('idle')
  // 인증번호를 더 틀릴 수 있는 횟수. 모르면 null
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null)
  const [checking, setChecking] = useState(false)
  // 오늘 보낼 수 있는 횟수를 다 썼는지 · 다시 받기 요청 중인지
  const [limitReached, setLimitReached] = useState(false)
  const [sending, setSending] = useState(false)
  // 오프라인이라 못 보낸 확인. 연결되면 다시 시도
  const [pending, setPending] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [toast, setToast] = useState<ToastKind | null>(null)
  const closeToast = useCallback(() => setToast(null), [])

  const remaining = sentAt === null ? 0 : Math.max(0, VERIFY_TTL_MS - (now - sentAt))
  const verified = status === 'verified'
  const tooMany = status === 'tooMany'
  const expired = sentAt !== null && remaining === 0 && !verified && !tooMany
  // 받아 둔 번호를 아직 쓸 수 있는지. 있으면 다시 받기가 실패해도 그 번호로 이어 감
  const codeUsable = sentAt !== null && !tooMany && remaining > 0
  const noCode = !verified && !codeUsable
  // 쓸 번호도 없고 오늘 더 받을 수도 없음
  const limitBlock = limitReached && noCode
  const locked = verified || noCode
  // 다시 받기는 서버가 정한 시각부터
  const waitMs = Math.max(0, resendAt - now)
  const canResend = !verified && !limitReached && !sending && waitMs === 0
  // 번호를 다시 받아야만 이어 갈 수 있는 상태
  const needResend = noCode && !limitReached

  const verify = useCallback(
    async (value: string) => {
      if (!navigator.onLine) {
        setPending(true)
        setToast('offline')
        return
      }
      setChecking(true)
      try {
        const result = await verifyEmailCode(email, value)
        if (result.status === 'ok') setStatus('verified')
        else if (result.status === 'wrong') {
          setAttemptsLeft(result.remaining)
          setStatus('wrong')
        } else if (result.status === 'tooMany') setStatus('tooMany')
        // 서버에서 시간이 지났다고 하면 화면도 시간 초과로
        else setSentAt(0)
      } catch {
        setToast('verifyFailed')
      } finally {
        setChecking(false)
      }
    },
    [email],
  )

  useEffect(() => {
    if (!pending) return
    const retry = () => {
      setPending(false)
      setToast(null)
      void verify(code)
    }
    window.addEventListener('online', retry)
    return () => window.removeEventListener('online', retry)
  }, [pending, code, verify])

  const resend = async () => {
    setSheet(false)
    if (sending) return
    if (!navigator.onLine) {
      setToast('offline')
      return
    }
    let result
    setSending(true)
    try {
      result = await sendVerifyCode(email)
    } catch {
      setToast('sendFailed')
      return
    } finally {
      setSending(false)
    }
    if (result.status === 'limit') {
      setLimitReached(true)
      // 받아 둔 번호가 있으면 틀림 안내 대신 횟수 안내가 보이게
      if (codeUsable) setStatus('idle')
      return
    }
    // 60초 안이면 앞서 보낸 번호를 그대로 쓰고 기다릴 시각만 맞춤
    if (result.status === 'wait') {
      setResendAt(result.resendAt)
      return
    }
    if (result.status === 'mailFailed') {
      setResendAt(result.resendAt)
      // 받아 둔 번호가 있으면 그 번호는 그대로 쓰게 알림만
      if (codeUsable) setToast('sendFailed')
      else {
        // 무효가 된 번호(5번 틀림 · 시간 초과)가 다시 열리지 않게 받아 둔 번호를 비움
        setSentAt(null)
        setMailFailed(true)
        setStatus('idle')
      }
      return
    }
    // 인증 화면에선 이미 가입된 경우가 거의 없어 보내지 못함으로
    if (result.status === 'taken') {
      setToast('sendFailed')
      return
    }
    setSentAt(result.sentAt)
    setResendAt(result.resendAt)
    setRemainingSends(result.remainingSends)
    setMailFailed(false)
    setCode('')
    setAttemptsLeft(null)
    setStatus('resent')
  }

  const complete = async () => {
    if (!navigator.onLine) {
      setToast('offline')
      return
    }
    setChecking(true)
    try {
      // 인증이 풀렸으면 시간 초과로 보여 다시 받게
      if ((await onVerified()) === 'expired') {
        setStatus('idle')
        setSentAt(0)
      }
    } catch {
      setToast('signUpFailed')
    } finally {
      setChecking(false)
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (checking || sending) return
    if (needResend) void resend()
    else if (verified) void complete()
    else if (code.length < VERIFY_CODE_LENGTH) setStatus('digits')
    else void verify(code)
  }

  const limitHelper: FieldHelper = {
    icon: iconAlert,
    text: `오늘 보낼 수 있는 횟수(${VERIFY_MAX_SENDS}번)를 다 썼어요.\n내일 다시 받아 주세요.`,
    tone: 'error',
  }
  const helper: FieldHelper | null = verified
    ? { icon: iconCheck, text: '인증됐어요', tone: 'success' }
    : limitBlock
      ? limitHelper
      : tooMany
        ? {
            icon: iconLock,
            text: `${VERIFY_MAX_FAILURES}번 틀렸어요. 인증번호를 다시 받아 주세요`,
            tone: 'error',
          }
        : expired
          ? {
              icon: iconClock,
              text: '입력 시간이 지났어요. 인증번호를 다시 받아 주세요',
              tone: 'error',
            }
          : mailFailed
            ? {
                icon: iconAlert,
                text: '메일을 보내지 못했어요. 잠시 후 다시 받아 주세요.',
                tone: 'error',
              }
            : status === 'wrong'
              ? {
                  icon: iconAlert,
                  text:
                    attemptsLeft === null
                      ? '인증번호가 맞지 않아요.'
                      : `인증번호가 맞지 않아요.\n${attemptsLeft}번 더 틀리면 인증번호를 다시 받아야 해요.`,
                  tone: 'error',
                }
              : status === 'digits'
                ? { icon: iconAlert, text: '숫자 6자리를 모두 입력해 주세요', tone: 'error' }
                : status === 'resent'
                  ? {
                      icon: iconMail,
                      text: '인증번호를 다시 보냈어요',
                      tone: 'info',
                    }
                  : limitReached
                    ? limitHelper
                    : null

  const invalid = noCode || status === 'wrong' || status === 'digits'

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-14.5 pb-[max(--spacing(9),env(safe-area-inset-bottom))]">
      <AuthHeader onBack={onBack}>
        <p className="text-subtitle-1 text-grey-900">이메일 인증</p>
      </AuthHeader>

      <div className="mt-7 flex flex-col gap-1.5">
        <h1 className="text-title-2 text-grey-900">
          메일로 받은 인증번호를
          <br />
          입력해 주세요
        </h1>
        <p className="text-grey-500 text-sm leading-normal">
          {email} 으로 {mailFailed && noCode ? '보내지 못했어요' : '보냈어요'}
        </p>
      </div>

      <form noValidate className="flex flex-1 flex-col" onSubmit={submit}>
        {/* 안내 한 줄 자리까지 잡아 두어 아래 안내 상자가 흔들리지 않게 */}
        <div className="mt-8 min-h-27.5">
          <AuthField
            label="인증번호"
            inputId="verify-code"
            invalid={invalid}
            helper={helper}
            tightEnd={!verified}
          >
            <input
              id="verify-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="숫자 6자리"
              value={noCode ? '' : code}
              disabled={locked}
              aria-invalid={invalid}
              aria-describedby={helper ? 'verify-code-helper' : undefined}
              className="text-input text-grey-900 placeholder:text-grey-500 caret-primary disabled:text-grey-400 min-w-0 flex-1 bg-transparent outline-none"
              onChange={(event) => {
                // 메일에서 붙여 넣으면 공백·하이픈은 빼고 숫자만
                const digits = event.target.value.replace(/\D/g, '').slice(0, VERIFY_CODE_LENGTH)
                setCode(digits)
                setStatus('idle')
                // 6자리를 다 채우면 바로 확인
                if (digits.length === VERIFY_CODE_LENGTH) void verify(digits)
              }}
            />
            {verified ? (
              <img src={iconVerified} alt="" width={20} height={20} className="shrink-0" />
            ) : (
              <>
                {/* 타이머는 보낸 번호가 있을 때만. 1분 이하면 빨갛게 */}
                {codeUsable && (
                  <span
                    aria-label={`남은 시간 ${formatRemaining(remaining)}`}
                    className={`shrink-0 text-sm leading-normal font-medium ${
                      remaining <= TIMER_WARN_MS ? 'text-red-500' : 'text-grey-700'
                    }`}
                  >
                    {formatRemaining(remaining)}
                  </span>
                )}
                {/* 다시 받아야 하는 상태에선 아래 큰 버튼으로 */}
                {!needResend && !limitReached && (
                  <button
                    type="button"
                    disabled={!canResend}
                    className="text-body-3 border-grey-200 text-grey-900 disabled:text-grey-400 shrink-0 rounded-lg border bg-white px-2.5 py-1.5"
                    onClick={resend}
                  >
                    {waitMs > 0 ? `${formatWait(waitMs)} 후 다시 받기` : '다시 받기'}
                  </button>
                )}
              </>
            )}
          </AuthField>
        </div>

        <div className="bg-grey-50 mt-5 flex items-start gap-2.5 rounded-2xl px-4 py-3.5">
          <img src={iconNoticeInfo} alt="" width={18} height={18} className="shrink-0" />
          <p className="text-t7 text-grey-700">
            메일이 안 보이면 스팸함도 확인해 주세요.
            <br />
            {/* 오늘 횟수를 다 쓰면 다시 받기 대신 문의하기 */}
            {limitReached ? (
              <a href={`mailto:${SUPPORT_EMAIL}`}>문의하기</a>
            ) : (
              <button type="button" onClick={() => setSheet(true)}>
                메일이 안 와요
              </button>
            )}
            {' · '}
            <button type="button" onClick={onChangeEmail}>
              이메일 바꾸기
            </button>
          </p>
        </div>

        <button
          type="submit"
          disabled={limitBlock || (needResend && !canResend)}
          aria-busy={checking}
          className="text-subtitle-1 bg-primary disabled:bg-grey-100 disabled:text-grey-400 relative mt-auto h-14 rounded-xl leading-none text-white"
        >
          <span className={checking ? 'opacity-0' : undefined}>
            {limitBlock
              ? '내일 다시 받을 수 있어요'
              : needResend
                ? waitMs > 0
                  ? `${formatWait(waitMs)} 후 인증번호 다시 받기`
                  : '인증번호 다시 받기'
                : '확인'}
          </span>
          {checking && (
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

      {sheet && (
        <MailHelpSheet
          email={email}
          remainingSends={remainingSends}
          canResend={canResend}
          onResend={resend}
          onChangeEmail={onChangeEmail}
          onClose={() => setSheet(false)}
        />
      )}
      {toast && (
        <AuthToast icon={TOAST[toast].icon} message={TOAST[toast].message} onClose={closeToast} />
      )}
    </main>
  )
}

export default EmailVerifyStep
