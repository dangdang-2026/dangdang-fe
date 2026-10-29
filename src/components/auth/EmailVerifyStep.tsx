import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  VERIFY_CODE_LENGTH,
  VERIFY_MAX_FAILURES,
  VERIFY_TTL_MS,
  resendVerifyCode,
  verifyEmailCode,
} from '@/api/auth'
import iconAlert from '@/assets/icons/auth/alert.svg'
import iconCheck from '@/assets/icons/auth/check.svg'
import iconClock from '@/assets/icons/auth/clock.svg'
import iconLoading from '@/assets/icons/auth/loading.svg'
import iconLock from '@/assets/icons/auth/lock.svg'
import iconMail from '@/assets/icons/auth/mail.svg'
import iconNoticeInfo from '@/assets/icons/auth/notice-info.svg'
import iconToastOffline from '@/assets/icons/auth/toast-offline.svg'
import iconVerified from '@/assets/icons/auth/verified.svg'
import AuthField, { type FieldHelper } from '@/components/auth/AuthField'
import AuthHeader from '@/components/auth/AuthHeader'
import AuthToast from '@/components/auth/AuthToast'
import MailHelpSheet from '@/components/auth/MailHelpSheet'
import { useNow } from '@/hooks/useNow'

// 보낸 직후 30초는 다시 받기 막음
const RESEND_WAIT_MS = 30 * 1000

type VerifyStatus = 'idle' | 'wrong' | 'digits' | 'tooMany' | 'resent' | 'limit' | 'verified'

type EmailVerifyStepProps = {
  email: string
  sentAt: number
  onBack: () => void
  onChangeEmail: () => void
  onVerified: () => void
}

function formatRemaining(ms: number) {
  const seconds = Math.ceil(ms / 1000)
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

// Figma V-01~V-10 이메일 인증: 6자리 번호, 5분 제한, 5번 틀리면 다시 받기
function EmailVerifyStep({
  email,
  sentAt: firstSentAt,
  onBack,
  onChangeEmail,
  onVerified,
}: EmailVerifyStepProps) {
  const now = useNow(1000).getTime()
  const [sentAt, setSentAt] = useState(firstSentAt)
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<VerifyStatus>('idle')
  const [failures, setFailures] = useState(0)
  const [checking, setChecking] = useState(false)
  // 오프라인이라 못 보낸 확인. 연결되면 다시 시도
  const [pending, setPending] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [offlineToast, setOfflineToast] = useState(false)
  const closeToast = useCallback(() => setOfflineToast(false), [])

  const remaining = Math.max(0, VERIFY_TTL_MS - (now - sentAt))
  const verified = status === 'verified'
  const tooMany = status === 'tooMany'
  const expired = remaining === 0 && !verified && !tooMany
  const locked = verified || tooMany || expired
  const canResend =
    !verified && status !== 'limit' && (tooMany || expired || now - sentAt >= RESEND_WAIT_MS)

  const verify = useCallback(
    async (value: string) => {
      if (!navigator.onLine) {
        setPending(true)
        setOfflineToast(true)
        return
      }
      setChecking(true)
      const result = await verifyEmailCode(email, value)
      setChecking(false)

      if (result.status === 'ok') setStatus('verified')
      else if (result.status === 'wrong') {
        setFailures(result.failures)
        setStatus('wrong')
      } else if (result.status === 'tooMany') setStatus('tooMany')
      // 서버에서 시간이 지났다고 하면 화면도 시간 초과로
      else setSentAt(0)
    },
    [email],
  )

  useEffect(() => {
    if (!pending) return
    const retry = () => {
      setPending(false)
      setOfflineToast(false)
      void verify(code)
    }
    window.addEventListener('online', retry)
    return () => window.removeEventListener('online', retry)
  }, [pending, code, verify])

  const resend = async () => {
    setSheet(false)
    if (!navigator.onLine) {
      setOfflineToast(true)
      return
    }
    const result = await resendVerifyCode(email)
    if (result.status === 'limit') {
      setStatus('limit')
      return
    }
    setSentAt(result.sentAt)
    setCode('')
    setFailures(0)
    setStatus('resent')
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (checking) return
    if (verified) onVerified()
    else if (code.length < VERIFY_CODE_LENGTH) setStatus('digits')
    else void verify(code)
  }

  const helper: FieldHelper | null = verified
    ? { icon: iconCheck, text: '인증됐어요', tone: 'success' }
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
        : status === 'wrong'
          ? {
              icon: iconAlert,
              text: `인증번호가 맞지 않아요 (${failures}/${VERIFY_MAX_FAILURES})`,
              tone: 'error',
            }
          : status === 'digits'
            ? { icon: iconAlert, text: '숫자 6자리를 모두 입력해 주세요', tone: 'error' }
            : status === 'resent'
              ? {
                  icon: iconMail,
                  text: '인증번호를 다시 보냈어요. 메일이 안 보이면 스팸함도 확인해 주세요',
                  tone: 'info',
                }
              : status === 'limit'
                ? { icon: iconAlert, text: '오늘은 인증번호를 더 받을 수 없어요', tone: 'error' }
                : null

  const invalid = tooMany || expired || status === 'wrong' || status === 'digits'

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
        <p className="text-grey-500 text-sm leading-normal">{email} 으로 보냈어요</p>
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
              value={tooMany || expired ? '' : code}
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
                {!tooMany && (
                  <span
                    aria-label={`남은 시간 ${formatRemaining(remaining)}`}
                    className="shrink-0 text-sm leading-normal font-medium text-red-500"
                  >
                    {formatRemaining(remaining)}
                  </span>
                )}
                <button
                  type="button"
                  disabled={!canResend}
                  className="text-body-3 border-grey-200 text-grey-900 disabled:text-grey-400 shrink-0 rounded-lg border bg-white px-2.5 py-1.5"
                  onClick={resend}
                >
                  다시 받기
                </button>
              </>
            )}
          </AuthField>
        </div>

        <div className="bg-grey-50 mt-5 flex items-start gap-2.5 rounded-2xl px-4 py-3.5">
          <img src={iconNoticeInfo} alt="" width={18} height={18} className="shrink-0" />
          <p className="text-t7 text-grey-700">
            메일이 안 보이면 스팸함도 확인해 주세요.
            <br />
            <button type="button" onClick={() => setSheet(true)}>
              메일이 안 와요
            </button>
            {' · '}
            <button type="button" onClick={onChangeEmail}>
              이메일 바꾸기
            </button>
          </p>
        </div>

        <button
          type="submit"
          disabled={tooMany || expired}
          aria-busy={checking}
          className="text-subtitle-1 bg-primary disabled:bg-grey-100 disabled:text-grey-400 relative mt-auto h-14 rounded-xl leading-none text-white"
        >
          <span className={checking ? 'opacity-0' : undefined}>확인</span>
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
          canResend={canResend}
          onResend={resend}
          onChangeEmail={onChangeEmail}
          onClose={() => setSheet(false)}
        />
      )}
      {offlineToast && (
        <AuthToast
          icon={iconToastOffline}
          message="인터넷 연결이 불안정해요. 연결되면 다시 확인할게요"
          onClose={closeToast}
        />
      )}
    </main>
  )
}

export default EmailVerifyStep
