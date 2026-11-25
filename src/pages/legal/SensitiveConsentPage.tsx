import { useLocation, useNavigate } from 'react-router'
import DocumentHead from '@/components/legal/DocumentHead'
import LegalLayout from '@/components/legal/LegalLayout'
import LegalTable from '@/components/legal/LegalTable'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useOnboardingStore } from '@/stores/useOnboardingStore'

// Figma N-04 민감정보(건강정보) 수집·이용 동의
function SensitiveConsentPage() {
  const goBack = useGoBack(ROUTES.MY_TERMS)
  const navigate = useNavigate()
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
      // 필수라 안 하면 가입 약관 화면에서 다음으로 못 감
      secondary={
        fromAgree
          ? {
              label: '동의하지 않기',
              onClick: () => {
                setAnswers({ agreements: agreements.filter((key) => key !== 'sensitive') })
                goBack()
              },
            }
          : undefined
      }
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
              '임신 주수·출산 예정일, 진단일, 혈당 측정값·측정 시각, 식사 기록, 인슐린 기록, 진료 메모, 출산일·입원 여부, 다니는 병원, 병원에서 안내받은 관리 기준, 이름(부를 이름)',
          },
          { label: '보유 기간', value: '탈퇴하거나 동의를 철회하면 바로 파기해요' },
          {
            label: '동의 거부 권리',
            value: '동의하지 않을 수 있어요. 다만 기록·알림·리포트 기능은 쓸 수 없어요',
            highlight: true,
          },
        ]}
      />
      <div className="rounded-key bg-grey-100 flex flex-col gap-2 p-4 text-sm">
        <p className="text-grey-700 leading-relaxed">
          건강정보는 암호화해서 저장해요.
          <br />
          AI 기능을 켜면 질문·진료 메모 정리에
          <br />
          필요한 내용이 해외(미국 OpenAI)로 가요.
          <br />
          마이 › 데이터·개인정보에서 언제든 철회할 수 있어요.
        </p>
        <button
          type="button"
          className="text-grey-900 self-start font-bold underline"
          onClick={() => navigate(ROUTES.LEGAL_TRANSFER)}
        >
          국외 이전 자세히 보기 ›
        </button>
      </div>
    </LegalLayout>
  )
}

export default SensitiveConsentPage
