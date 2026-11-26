import DocumentHead from '@/components/legal/DocumentHead'
import LegalLayout from '@/components/legal/LegalLayout'
import TransferTables from '@/components/legal/TransferTables'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'

// Figma N-05 개인정보 국외 이전 고지. 피그마에서 확정 전인 칸은 확정되면 넣음
function TransferNoticePage() {
  const goBack = useGoBack(ROUTES.MY_AI)

  return (
    <LegalLayout
      title="국외 이전 안내"
      onBack={goBack}
      footer={{ label: '확인했어요', onClick: goBack }}
    >
      <DocumentHead
        title="해외로 보내는 정보"
        description="「개인정보 보호법」 제28조의8에 따라 받는 곳마다 알려 드려요. AI 기능은 켤 때 따로 동의를 받아요. 식사 사진은 당당 서버(국내)에서만 처리해요."
      />
      <TransferTables />
    </LegalLayout>
  )
}

export default TransferNoticePage
