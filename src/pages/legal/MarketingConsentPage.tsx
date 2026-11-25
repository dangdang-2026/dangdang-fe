import { useState } from 'react'
import { useLocation } from 'react-router'
import { saveMarketingConsent } from '@/api/consent'
import DocumentHead from '@/components/legal/DocumentHead'
import LegalLayout from '@/components/legal/LegalLayout'
import LegalTable from '@/components/legal/LegalTable'
import Toast from '@/components/common/Toast'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { marketingResultText } from '@/utils/consent'

// agree: 가입 약관 화면에서 옴(체크만), save: 마이 › 알림에서 켬(서버에 바로 저장)
type MarketingLocationState = { agree?: boolean; save?: boolean } | null

// Figma N-09 광고성 정보 받기 · N-09b 동의 직후 처리 결과 안내
function MarketingConsentPage() {
  const state = useLocation().state as MarketingLocationState
  const goBack = useGoBack(state?.save ? ROUTES.MY_NOTIFICATIONS : ROUTES.MY_TERMS)
  const agreements = useOnboardingStore((store) => store.agreements)
  const setAnswers = useOnboardingStore((store) => store.setAnswers)
  // 동의를 마치면 결과 안내를 띄우고 버튼은 확인만
  const [result, setResult] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const agree = async () => {
    if (state?.save) {
      if (saving) return
      setSaving(true)
      try {
        await saveMarketingConsent(true)
      } catch {
        setToast('동의를 저장하지 못했어요. 잠시 후 다시 시도해 주세요')
        return
      } finally {
        setSaving(false)
      }
    } else if (state?.agree && !agreements.includes('marketing')) {
      setAnswers({ agreements: [...agreements, 'marketing'] })
    }
    setResult(marketingResultText(true))
  }

  const decline = () => {
    if (state?.agree && agreements.includes('marketing')) {
      setAnswers({ agreements: agreements.filter((key) => key !== 'marketing') })
    }
    goBack()
  }

  // 그냥 읽으러 온 거면 확인만
  const asking = !!(state?.agree || state?.save) && !result

  return (
    <LegalLayout
      title="광고성 정보 받기"
      onBack={goBack}
      footer={{
        label: asking ? '동의하기' : '확인',
        onClick: asking ? () => void agree() : goBack,
      }}
      secondary={asking ? { label: '동의 안 할게요', onClick: decline } : undefined}
      notice={
        result && (
          <p
            role="status"
            className="bg-grey-900 rounded-key text-t6 px-4.5 py-3.5 font-bold whitespace-pre-line text-white"
          >
            {result}
          </p>
        )
      }
    >
      <DocumentHead
        title="혜택·이벤트 소식을 받을까요?"
        description={'선택이에요. 받지 않아도\n당당의 모든 기능을 그대로 쓸 수 있어요.'}
      />
      <LegalTable
        rows={[
          { label: '보내는 내용', value: '제휴 상품 혜택, 이벤트 소식' },
          { label: '보내는 방법', value: '앱 알림' },
          { label: '안 보내는 때', value: '밤 9시 ~ 아침 8시' },
          { label: '끄는 방법', value: '마이 › 알림에서 언제든 끌 수 있어요' },
        ]}
      />
      <p className="text-grey-700 rounded-key bg-grey-100 p-4 text-sm leading-relaxed">
        광고 알림은 맨 앞에 (광고)라고 표시해요.
        <br />
        2년마다 계속 받을지 다시 여쭤봐요.
      </p>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </LegalLayout>
  )
}

export default MarketingConsentPage
