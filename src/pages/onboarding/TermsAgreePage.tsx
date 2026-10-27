import { useState } from 'react'
import { useNavigate } from 'react-router'
import iconAgreeChev from '@/assets/icons/onboarding/agree-chev.svg'
import iconAgreeInfo from '@/assets/icons/onboarding/agree-info.svg'
import BottomSheet from '@/components/common/BottomSheet'
import CheckCircle from '@/components/onboarding/CheckCircle'
import OnboardingHeader from '@/components/onboarding/OnboardingHeader'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
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
  description: '혈당·식사·임신 주수·인슐린 기록은 기록 관리와 진료 리포트에만 써요.',
  document: true,
}

const MARKETING: Agreement = {
  key: 'marketing',
  label: '[선택] 광고성 정보 받기 (혜택·이벤트)',
  description: '밤 9시~아침 8시엔 보내지 않아요',
  document: true,
}

const ALL_KEYS = [...BASIC, SENSITIVE, MARKETING].map((item) => item.key)

// Figma A-01 약관·민감정보 동의
function TermsAgreePage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.ONBOARDING)
  const saved = useOnboardingStore((state) => state.agreements)
  const setAnswers = useOnboardingStore((state) => state.setAnswers)
  const [agreed, setAgreed] = useState<AgreementKey[]>(saved)
  const [document, setDocument] = useState<Agreement | null>(null)

  const allAgreed = ALL_KEYS.every((key) => agreed.includes(key))
  const requiredAgreed = REQUIRED_AGREEMENTS.every((key) => agreed.includes(key))

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
          onClick={() => setDocument({ key, label, description })}
        >
          <img src={iconAgreeChev} alt="" width={18} height={18} />
        </button>
      )}
    </div>
  )

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-13 pb-[max(--spacing(9),env(safe-area-inset-bottom))]">
      <OnboardingHeader step={0} onBack={goBack} />

      <div className="mt-4.5 flex flex-col gap-2">
        <h1 className="text-title-2 text-grey-900">
          시작 전에
          <br />
          확인해 주세요
        </h1>
        <p className="text-grey-500 text-sm leading-normal">건강 정보는 따로 한 번 더 여쭤봐요.</p>
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
      </div>
      <div className="mt-1 px-3">{renderRow(MARKETING)}</div>

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
        className="text-subtitle-1 disabled:bg-grey-100 disabled:text-grey-400 bg-primary mt-auto h-14 rounded-xl leading-none text-white"
        onClick={() => {
          setAnswers({ agreements: agreed })
          navigate(ROUTES.ONBOARDING_TIMING)
        }}
      >
        동의하고 다음
      </button>

      {document && (
        <BottomSheet label={document.label} onClose={() => setDocument(null)}>
          <h2 className="text-t4 text-grey-900">{document.label.replace(/^\[.+?\]\s/, '')}</h2>
          <p className="text-t6 text-grey-700">
            {document.description ?? '정식 출시 전에 본문을 올려 둘게요.'}
          </p>
          <button
            type="button"
            className="text-subtitle-1 bg-primary h-14 rounded-xl leading-none text-white"
            onClick={() => {
              if (!agreed.includes(document.key)) toggle(document.key)
              setDocument(null)
            }}
          >
            동의해요
          </button>
        </BottomSheet>
      )}
    </main>
  )
}

export default TermsAgreePage
