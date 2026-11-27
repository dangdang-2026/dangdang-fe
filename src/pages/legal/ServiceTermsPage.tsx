import { useNavigate } from 'react-router'
import ClauseList, { ClauseBody, type Clause } from '@/components/legal/ClauseList'
import DocumentHead from '@/components/legal/DocumentHead'
import LegalLayout from '@/components/legal/LegalLayout'
import { LEGAL_VERSION } from '@/constants/legal'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'

const CLAUSES: Clause[] = [
  {
    title: '제1조 목적',
    body: (
      <ClauseBody
        lines={[
          '이 약관은 당당 팀(이하 「당당」)이 제공하는 임신성 당뇨 기록 서비스 「당당」을 이용하는 조건과 절차, 당당과 회원의 권리·의무를 정해요.',
        ]}
      />
    ),
  },
  {
    title: '제2조 용어의 뜻',
    body: (
      <ClauseBody
        rows={[
          { label: '회원', value: '약관에 동의하고 가입한 사람' },
          { label: '기록', value: '회원이 남긴 혈당·식사·인슐린 기록과 진료 메모' },
          {
            label: '관리 기준',
            value: '회원이 병원에서 안내받아 직접 넣은 측정 시점과 목표 수치',
          },
          { label: '게시물', value: '커뮤니티에 올린 글·댓글·사진' },
        ]}
      />
    ),
  },
  {
    title: '제3조 약관의 효력과 변경',
    description: '바뀌면 7일 전, 불리하게 바뀌면 30일 전에 알려요',
    body: (
      <ClauseBody
        lines={[
          '약관은 앱에 공개하면 효력이 생겨요. 바꿀 때는 시행 7일 전, 회원에게 불리하면 30일 전에 알려요. 바뀐 약관에 동의하지 않으면 탈퇴할 수 있어요.',
        ]}
      />
    ),
  },
  {
    title: '제4조 서비스 내용',
    body: (
      <ClauseBody
        rows={[
          { label: '기록', value: '혈당·식사·인슐린 기록과 달력' },
          { label: '알림', value: '식후·공복·자기 전 측정 알림' },
          { label: '진료 리포트', value: '진료 때 보여 줄 기록 정리' },
          { label: '커뮤니티', value: '산모끼리 글·댓글, 당당 소식' },
          { label: 'AI 기능', value: '동의한 경우 사진 음식 찾기, 질문 답하기, 진료 메모 정리' },
          { label: '상점', value: '제휴 판매처 상품 소개 (구매는 판매처에서)' },
        ]}
      />
    ),
  },
  {
    title: '제5조 서비스의 한계 (의료기기 아님)',
    body: (
      <ClauseBody
        lines={[
          '① 당당은 회원이 병원에서 안내받은 관리 기준에 따라 기록하고 알림을 받도록 돕는 서비스예요. 진단·처방·치료를 하지 않고, 「의료기기법」에 따른 의료기기가 아니에요.',
          '② 목표 안 · 목표보다 높음 표시는 회원이 넣은 기준과 비교한 결과일 뿐 의료 판단이 아니에요.',
          '③ 몸이 불편하거나 수치가 걱정되면 반드시 병원에 문의해 주세요. 응급 상황이면 119에 연락해 주세요.',
        ]}
      />
    ),
  },
  {
    title: '제6조 회원가입과 탈퇴',
    body: (
      <ClauseBody
        lines={[
          '① 이메일 또는 카카오로 가입할 수 있어요. 건강정보 수집·이용에는 따로 동의해야 해요.',
          '② 마이 › 데이터 · 개인정보에서 언제든 탈퇴할 수 있어요. 탈퇴하면 기록은 바로 지워지고 되돌릴 수 없어요.',
          '③ 만 14세 미만은 가입할 수 없어요.',
        ]}
      />
    ),
  },
  {
    title: '제7조 커뮤니티 게시물',
    description: '권리는 작성자에게, 운영정책에 맞지 않으면 가려요',
    body: (
      <ClauseBody
        lines={[
          '① 게시물의 권리는 작성자에게 있어요.',
          '② 운영정책에 맞지 않는 게시물(진단·처방 권유, 수치 비교, 광고, 개인정보 노출, 비방)은 가릴 수 있고, 반복되면 글쓰기를 제한할 수 있어요.',
          '③ 당당은 서비스 안에서 게시물을 보여 주는 데만 쓰고, 다른 곳에 쓸 때는 작성자의 허락을 받아요.',
        ]}
      />
    ),
  },
  {
    title: '제8조 광고와 제휴',
    description: 'AD · 제휴로 표시하고 구매는 판매처에서 해요',
    body: (
      <ClauseBody
        lines={[
          '① 광고와 제휴 상품에는 「AD」 또는 「제휴」라고 표시해요.',
          '② 상점의 상품은 판매처에서 사고, 결제·배송·환불은 판매처 약관을 따라요. 당당은 제휴 링크로 구매가 일어나면 판매처에서 수수료를 받을 수 있어요.',
        ]}
      />
    ),
  },
  {
    title: '제9조 서비스 중단과 종료',
    body: (
      <ClauseBody
        lines={[
          '시스템 점검이나 장애로 서비스를 잠시 멈출 수 있어요. 미리 알 수 있는 점검은 앱에 먼저 알려요.',
          '서비스를 끝낼 때는 30일 전에 앱에 알려요. 그동안 내 기록 PDF를 받을 수 있고, 끝나면 모든 정보를 지워요.',
        ]}
      />
    ),
  },
  {
    title: '제10조 책임의 제한',
    body: (
      <ClauseBody
        lines={[
          '① 회원이 넣은 기준과 기록이 틀려서 생긴 결과에는 책임지지 않아요.',
          '② 알림은 기기·네트워크 상태에 따라 늦거나 오지 않을 수 있어요. 중요한 측정은 알림에만 기대지 말아 주세요.',
          '③ 당당의 잘못으로 손해가 생기면 법에 따라 책임져요.',
        ]}
      />
    ),
  },
  {
    title: '제11조 분쟁 해결',
    body: (
      <ClauseBody
        lines={[
          '이 약관은 대한민국 법을 따르고, 분쟁이 생기면 「민사소송법」에 따른 법원에서 해결해요.',
        ]}
      />
    ),
  },
]

// Figma N-03 이용약관 · N-07 조항 펼침
function ServiceTermsPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.MY_TERMS)

  return (
    <LegalLayout title="이용약관" onBack={goBack}>
      <DocumentHead
        title="당당 서비스 이용약관"
        version={LEGAL_VERSION}
        onVersions={() => navigate(ROUTES.LEGAL_TERMS_VERSIONS)}
      />
      <p className="bg-grey-50 text-t7 text-grey-700 rounded-xl px-3.5 py-3 leading-5">
        당당은 의료기기가 아니에요.
        <br />
        병원에서 안내받은 관리 기준대로 기록하고
        <br />
        알림을 받도록 돕는 서비스예요.
        <br />
        의료 판단은 꼭 병원에서 받아 주세요.
      </p>
      <ClauseList clauses={CLAUSES} />
    </LegalLayout>
  )
}

export default ServiceTermsPage
