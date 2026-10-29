import { useCallback, useState } from 'react'
import iconAlert from '@/assets/icons/legal/terms-alert.svg'
import Toast from '@/components/common/Toast'
import ClauseList, { ClauseParagraphs, type Clause } from '@/components/legal/ClauseList'
import DocumentHead from '@/components/legal/DocumentHead'
import LegalLayout from '@/components/legal/LegalLayout'
import { LEGAL_VERSION } from '@/constants/legal'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'

const CLAUSES: Clause[] = [
  { title: '제1조 목적' },
  { title: '제2조 용어의 뜻' },
  {
    title: '제3조 약관의 효력과 변경',
    description: '바뀌면 7일 전, 불리하게 바뀌면 30일 전에 알려요',
  },
  { title: '제4조 서비스 내용' },
  {
    title: '제5조 서비스의 한계 (의료기기 아님)',
    body: (
      <ClauseParagraphs
        lines={[
          '① 당당은 이용자가 병원에서 안내받은 관리 기준에 따라 기록하고 알림을 받도록 돕는 서비스이며, 「의료기기법」에 따른 의료기기가 아닙니다.',
          '② 당당은 진단·처방을 하거나 혈당·식단의 적절성을 판단하지 않습니다.',
          '③ AI가 제안하는 음식 이름과 영양 참고값은 틀릴 수 있으며, 이용자가 확인한 내용만 저장됩니다.',
        ]}
      />
    ),
  },
  { title: '제6조 회원가입과 탈퇴' },
  {
    title: '제7조 커뮤니티 게시물',
    description: '권리는 작성자에게, 운영정책에 맞지 않으면 가려요',
    body: (
      <ClauseParagraphs
        lines={[
          '① 게시물의 권리는 작성자에게 있습니다.',
          '② 회사는 운영정책에 맞지 않는 게시물을 가리거나 삭제할 수 있고, 그 사실과 이유를 작성자에게 알립니다.',
          '③ 작성자는 가려진 게시물에 이의를 신청할 수 있습니다.',
        ]}
      />
    ),
  },
  { title: '제8조 광고 게재', description: 'AD로 표시하고 심사 기준을 지켜요' },
  { title: '제9조 서비스 중단' },
  { title: '제10조 책임의 제한' },
  { title: '제11조 분쟁 해결' },
]

// Figma N-03 이용약관 · N-07 조항 펼침
function ServiceTermsPage() {
  const goBack = useGoBack(ROUTES.MY_TERMS)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])

  return (
    <LegalLayout title="이용약관" onBack={goBack}>
      <DocumentHead
        title="당당 서비스 이용약관"
        version={LEGAL_VERSION}
        onVersions={() => setToast('지금 버전이 첫 버전이에요')}
      />
      <section className="rounded-key flex flex-col gap-2 bg-yellow-50 p-4">
        <h3 className="text-t6 text-grey-900 flex items-center gap-2 font-bold">
          <img src={iconAlert} alt="" width={18} height={18} />
          제5조 당당은 의료기기가 아니에요
        </h3>
        <p className="text-grey-800 text-sm leading-6">
          당당은 병원에서 안내받은 관리 기준대로 기록하고 알림을 받도록 돕는 서비스예요. 진단·처방을
          하거나 혈당·식단이 괜찮은지 판단하지 않아요. AI가 보여 주는 음식 이름과 영양 참고값은 틀릴
          수 있으니 직접 확인해 주세요.
        </p>
      </section>
      <ClauseList clauses={CLAUSES} />

      {toast && <Toast message={toast} onClose={closeToast} />}
    </LegalLayout>
  )
}

export default ServiceTermsPage
