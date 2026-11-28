import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { saveConsents } from '@/api/consent'
import iconLoading from '@/assets/icons/auth/loading.svg'
import iconToastAlert from '@/assets/icons/auth/toast-alert.svg'
import iconToastOffline from '@/assets/icons/auth/toast-offline.svg'
import iconAgreeChev from '@/assets/icons/onboarding/agree-chev.svg'
import iconAgreeInfo from '@/assets/icons/onboarding/agree-info.svg'
import AuthToast from '@/components/auth/AuthToast'
import CheckCircle from '@/components/onboarding/CheckCircle'
import OnboardingHeader from '@/components/onboarding/OnboardingHeader'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { marketingResultText } from '@/utils/consent'
import { markOverseasConsent } from '@/stores/useAiStore'
import {
  REQUIRED_AGREEMENTS,
  useOnboardingStore,
  type AgreementKey,
} from '@/stores/useOnboardingStore'

type Agreement = {
  key: AgreementKey
  label: string
  description?: string
  // 본문 보기 화살표
  document?: boolean
}

const BASIC: Agreement[] = [
  { key: 'age', label: '[필수] 만 14세 이상이에요' },
  { key: 'terms', label: '[필수] 서비스 이용약관', document: true },
  { key: 'privacy', label: '[필수] 개인정보 수집·이용', document: true },
]

const SENSITIVE: Agreement = {
  key: 'sensitive',
  label: '[필수] 민감정보(건강정보) 수집·이용',
  document: true,
}

// 민감정보 항목 아래 고지 표
const SENSITIVE_NOTICE = [
  { label: '항목', value: '혈당·식사·사진·인슐린·임신 주수\n출산 예정일·진료 메모' },
  { label: '목적', value: '기록 관리, 진료 리포트, 켠 AI 기능' },
  { label: '보관', value: '탈퇴하면 바로 지워요 (백업 7일)' },
  { label: '거부', value: '동의하지 않으면\n기록 기능을 쓸 수 없어요' },
]

// 고르면 해외 전송(OVERSEAS_TRANSFER)만 저장. 사진 분석 · 기록 보고 답하기는 처음 쓸 때 따로 물음
const AI: Agreement = {
  key: 'ai',
  label: '[선택] AI 기능 · 해외 전송(미국 OpenAI)',
  description: '안 해도 기록·리포트는 그대로 써요',
  document: true,
}

const MARKETING: Agreement = {
  key: 'marketing',
  label: '[선택] 광고성 정보 받기 (혜택·이벤트)',
  description: '밤 9시~아침 8시엔 보내지 않아요',
  document: true,
}

// 본문 화면이 있는 문서
const DOCUMENT_ROUTES: Partial<Record<AgreementKey, string>> = {
  terms: ROUTES.LEGAL_TERMS,
  privacy: ROUTES.LEGAL_PRIVACY,
  sensitive: ROUTES.LEGAL_SENSITIVE,
  ai: ROUTES.LEGAL_TRANSFER,
  marketing: ROUTES.LEGAL_MARKETING,
}

const ALL_KEYS = [...BASIC, SENSITIVE, AI, MARKETING].map((item) => item.key)

type ToastKind = 'offline' | 'failed'

const TOAST: Record<ToastKind, { icon: string; message: string }> = {
  offline: {
    icon: iconToastOffline,
    message: '인터넷 연결이 불안정해요. 연결을 확인하고 다시 시도해 주세요',
  },
  failed: { icon: iconToastAlert, message: '동의를 저장하지 못했어요. 잠시 후 다시 시도해 주세요' },
}

// Figma A-01 약관·민감정보 동의
function TermsAgreePage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.ONBOARDING)
  const saved = useOnboardingStore((state) => state.agreements)
  const setAnswers = useOnboardingStore((state) => state.setAnswers)
  const [agreed, setAgreed] = useState<AgreementKey[]>(saved)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastKind | null>(null)
  const closeToast = useCallback(() => setToast(null), [])

  const submit = async () => {
    if (saving) return
    setAnswers({ agreements: agreed })
    if (!navigator.onLine) {
      setToast('offline')
      return
    }
    setSaving(true)
    try {
      await saveConsents(agreed, saved)
      // 고른 해외 전송 동의는 당당이 · 메모 정리가 바로 씀. 골랐다 뺐으면 끔
      if (agreed.includes('ai')) markOverseasConsent(true)
      else if (saved.includes('ai')) markOverseasConsent(false)
      // 광고성 정보에 동의했으면 다음 화면에서 처리 결과를 알림(정보통신망법 제50조)
      navigate(ROUTES.ONBOARDING_TIMING, {
        state: agreed.includes('marketing') ? { toast: marketingResultText(true) } : null,
      })
    } catch {
      setToast('failed')
    } finally {
      setSaving(false)
    }
  }

  const allAgreed = ALL_KEYS.every((key) => agreed.includes(key))
  const requiredAgreed = REQUIRED_AGREEMENTS.every((key) => agreed.includes(key))

  const openDocument = (item: Agreement) => {
    const route = DOCUMENT_ROUTES[item.key]
    if (!route) return
    // 문서를 보고 돌아와도 체크가 남게 저장. 민감정보 · 광고성 정보는 문서에서 바로 동의
    setAnswers({ agreements: agreed })
    navigate(route, { state: { agree: true } })
  }

  const toggle = (key: AgreementKey) =>
    setAgreed((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]))

  const renderRow = ({ key, label, description, document: hasDocument }: Agreement) => (
    <div key={key} className="flex items-center gap-3 px-1.5 py-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={agreed.includes(key)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        onClick={() => toggle(key)}
      >
        <CheckCircle checked={agreed.includes(key)} />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-body-2 text-grey-800">{label}</span>
          {description && (
            <span className="text-grey-500 text-xs leading-normal">{description}</span>
          )}
        </span>
      </button>
      {hasDocument && (
        <button
          type="button"
          aria-label={`${label} 보기`}
          onClick={() => openDocument({ key, label, description })}
        >
          <img src={iconAgreeChev} alt="" width={18} height={18} />
        </button>
      )}
    </div>
  )

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-2 pb-[max(--spacing(9),env(safe-area-inset-bottom))]">
      <OnboardingHeader step={0} onBack={goBack} />

      <div className="mt-4.5 flex flex-col gap-2">
        <h1 className="text-title-2 text-grey-900">
          시작 전에
          <br />
          확인해 주세요
        </h1>
        <p className="text-grey-500 text-sm leading-normal">건강 정보는 꼭 필요한 만큼만 받아요.</p>
      </div>

      <button
        type="button"
        role="checkbox"
        aria-checked={allAgreed}
        className="rounded-banner mt-6 flex items-center gap-3 bg-yellow-50 p-4.5 text-left"
        onClick={() => setAgreed(allAgreed ? [] : ALL_KEYS)}
      >
        <CheckCircle checked={allAgreed} size="lg" />
        <span className="text-subtitle-1 text-grey-900">모두 동의해요</span>
      </button>

      <div className="mt-0.5 flex flex-col px-3">{BASIC.map(renderRow)}</div>
      <div className="rounded-banner mt-1 border-2 border-yellow-300 px-3 pt-1.5 pb-3">
        {renderRow(SENSITIVE)}
        <dl className="flex flex-col gap-2 pl-10.5 text-xs leading-normal">
          {SENSITIVE_NOTICE.map((row) => (
            <div key={row.label} className="flex gap-3">
              <dt className="text-grey-500 shrink-0">{row.label}</dt>
              <dd className="text-grey-700 whitespace-pre-line">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="mt-1 flex flex-col px-3">
        {renderRow(AI)}
        {renderRow(MARKETING)}
      </div>

      <p className="bg-grey-50 mt-3 flex items-start gap-2.5 rounded-2xl px-4 py-3.5">
        <img src={iconAgreeInfo} alt="" width={18} height={18} />
        <span className="text-t7 text-grey-700">
          당당은 의료기기가 아니에요.
          <br />
          진단·처방·식단 판단을 하지 않아요.
        </span>
      </p>

      <button
        type="button"
        disabled={!requiredAgreed}
        aria-busy={saving}
        className="text-subtitle-1 disabled:bg-grey-100 disabled:text-grey-400 bg-primary relative mt-auto h-14 rounded-xl leading-none text-white"
        onClick={submit}
      >
        <span className={saving ? 'opacity-0' : undefined}>동의하고 다음</span>
        {saving && (
          <img
            src={iconLoading}
            alt=""
            width={31}
            height={7}
            className="absolute top-1/2 left-1/2 -translate-1/2"
          />
        )}
      </button>

      {toast && (
        <AuthToast icon={TOAST[toast].icon} message={TOAST[toast].message} onClose={closeToast} />
      )}
    </main>
  )
}

export default TermsAgreePage
