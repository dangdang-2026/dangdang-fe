import DocumentHead from '@/components/legal/DocumentHead'
import LegalLayout from '@/components/legal/LegalLayout'
import LegalTable from '@/components/legal/LegalTable'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'

// Figma N-05 개인정보 국외 이전 고지. 받는 곳·보관 기간은 출시 전 확정 필요
function TransferNoticePage() {
  const goBack = useGoBack(ROUTES.MY_AI)

  return (
    <LegalLayout
      title="국외 이전 안내"
      onBack={goBack}
      footer={{ label: '확인했어요', onClick: goBack }}
    >
      <DocumentHead
        title="AI 기능을 쓸 때 해외로 보내는 정보"
        description="「개인정보 보호법」 제28조의8에 따라 알려 드려요. 식사 사진은 당당 서버(국내)에서 처리해서 해외로 보내지 않아요."
      />
      <LegalTable
        rows={[
          { label: '받는 곳', value: 'OpenAI OpCo, LLC' },
          { label: '이전 국가', value: '미국' },
          {
            label: '보내는 때·방법',
            value:
              '당당이에게 질문하거나 진료 메모 정리를 누를 때만, 암호화 통신(HTTPS)으로 보내요',
          },
          {
            label: '보내는 항목',
            value:
              '질문 내용, 필요한 혈당 숫자와 날짜, 정리를 요청한 진료 메모 (이름·연락처 등 나를 알아볼 수 있는 정보는 빼요)',
          },
          {
            label: '목적',
            value:
              '기록 찾아 보여 주기, 물어볼 말 정리, 진료 메모에서 측정 시점·목표·다음 진료일 찾기',
          },
          {
            label: '보관 기간',
            value:
              'OpenAI가 오남용 확인 목적으로 최대 30일 보관한 뒤 삭제해요 · AI 학습에는 쓰지 않아요',
          },
          {
            label: '거부 방법',
            value: '마이 › AI 설정에서 끌 수 있어요. 꺼도 기록·알림은 그대로 쓸 수 있어요',
            highlight: true,
          },
        ]}
      />
    </LegalLayout>
  )
}

export default TransferNoticePage
