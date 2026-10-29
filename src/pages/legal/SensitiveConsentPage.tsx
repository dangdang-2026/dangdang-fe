import { useLocation } from 'react-router'
import iconShield from '@/assets/icons/legal/shield.svg'
import DocumentHead from '@/components/legal/DocumentHead'
import LegalLayout from '@/components/legal/LegalLayout'
import LegalTable from '@/components/legal/LegalTable'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useOnboardingStore } from '@/stores/useOnboardingStore'

// Figma N-04 민감정보(건강정보) 수집·이용 동의
function SensitiveConsentPage() {
  const goBack = useGoBack(ROUTES.MY_TERMS)
  // 가입 약관 화면에서 왔으면 여기서 바로 동의
  const fromAgree = !!(useLocation().state as { agree?: boolean } | null)?.agree
  const agreements = useOnboardingStore((state) => state.agreements)
  const setAnswers = useOnboardingStore((state) => state.setAnswers)

  return (
    <LegalLayout
      title="민감정보 동의"
      onBack={goBack}
      footer={{
        label: fromAgree ? '동의하기' : '확인했어요',
        onClick: () => {
          if (fromAgree && !agreements.includes('sensitive')) {
            setAnswers({ agreements: [...agreements, 'sensitive'] })
          }
          goBack()
        },
      }}
    >
      <DocumentHead
        title="건강정보 수집·이용에 동의해 주세요"
        description="건강정보는 「개인정보 보호법」 제23조에 따라 다른 정보와 따로 동의를 받아요."
      />
      <LegalTable
        rows={[
          {
            label: '수집 목적',
            value: '혈당·식사 기록 관리, 측정 알림, 진료 때 보여 줄 리포트 만들기',
          },
          {
            label: '수집 항목',
            value:
              '임신 주수·출산 예정일, 진단일, 혈당 측정값·측정 시각, 식사 기록, 인슐린 기록, 병원에서 안내받은 관리 기준',
          },
          { label: '보유 기간', value: '탈퇴하거나 동의를 철회하면 바로 파기해요' },
          {
            label: '동의 거부 권리',
            value: '동의하지 않을 수 있어요. 다만 기록·알림·리포트 기능은 쓸 수 없어요',
            highlight: true,
          },
        ]}
      />
      <p className="bg-grey-50 text-t7 text-grey-700 flex items-start gap-2 rounded-xl px-3.5 py-3 leading-relaxed">
        <img src={iconShield} alt="" width={18} height={18} className="shrink-0" />
        건강정보는 암호화해서 저장하고, 다른 곳에 제공하지 않아요. 마이 › 데이터·개인정보에서 언제든
        철회할 수 있어요.
      </p>
    </LegalLayout>
  )
}

export default SensitiveConsentPage
