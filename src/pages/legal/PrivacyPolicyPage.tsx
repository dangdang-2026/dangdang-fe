import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import iconEntrust from '@/assets/icons/legal/sum-entrust.svg'
import iconItems from '@/assets/icons/legal/sum-items.svg'
import iconOfficer from '@/assets/icons/legal/sum-officer.svg'
import iconPeriod from '@/assets/icons/legal/sum-period.svg'
import iconPurpose from '@/assets/icons/legal/sum-purpose.svg'
import iconSensitive from '@/assets/icons/legal/sum-sensitive.svg'
import iconThird from '@/assets/icons/legal/sum-third.svg'
import iconTransfer from '@/assets/icons/legal/sum-transfer.svg'
import Toast from '@/components/common/Toast'
import ClauseList, { type Clause } from '@/components/legal/ClauseList'
import DocumentHead from '@/components/legal/DocumentHead'
import LegalLayout from '@/components/legal/LegalLayout'
import LegalTable from '@/components/legal/LegalTable'
import { LEGAL_VERSION } from '@/constants/legal'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'

// Figma N-01 개인정보 처리방침 · 한눈에 보기 · N-02 조항 펼침
function PrivacyPolicyPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.MY_TERMS)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])

  const summary = [
    { icon: iconItems, title: '처리 항목', body: '이메일·닉네임, 혈당·식사 기록' },
    { icon: iconPurpose, title: '처리 목적', body: '기록 관리·알림·진료 리포트' },
    {
      icon: iconSensitive,
      title: '민감정보',
      body: '건강정보는 따로 동의받아요',
      to: ROUTES.LEGAL_SENSITIVE,
    },
    { icon: iconPeriod, title: '보유 기간', body: '탈퇴하면 바로 파기' },
    { icon: iconThird, title: '제3자 제공', body: '제공하지 않아요' },
    { icon: iconEntrust, title: '처리 위탁', body: '서버 운영(AWS)·메일 발송' },
    {
      icon: iconTransfer,
      title: '국외 이전',
      body: '당당이 질문할 때만',
      to: ROUTES.LEGAL_TRANSFER,
    },
    { icon: iconOfficer, title: '보호책임자', body: '[성명] · [이메일]' },
  ]

  const clauses: Clause[] = [
    { title: '제1조 개인정보의 처리 목적' },
    {
      title: '제2조 처리하는 개인정보의 항목',
      description: '필수·선택·자동 수집 구분',
      body: (
        <LegalTable
          head={['구분', '항목']}
          rows={[
            {
              label: '필수 · 회원',
              value:
                '이메일, 비밀번호(암호화 저장), 닉네임 · 카카오로 가입하면 카카오 회원번호, 닉네임',
            },
            {
              label: '필수 · 민감정보 (따로 동의)',
              value:
                '임신 주수·출산 예정일, 진단일, 혈당 측정값·측정 시각, 식사 기록, 인슐린 기록, 병원에서 안내받은 관리 기준',
            },
            {
              label: '선택',
              value:
                '식사 사진(사진 기능을 켠 경우, 음식 찾은 뒤 저장 안 함), 연락 기준 메모, 커뮤니티 글·댓글·투표',
            },
            {
              label: '자동 수집',
              value: '접속 기록, 기기·브라우저 정보, 알림 토큰, 로그인 유지 쿠키',
            },
          ]}
        />
      ),
    },
    {
      title: '제3조 처리 및 보유 기간',
      body: (
        <LegalTable
          head={['항목', '보유 기간']}
          rows={[
            { label: '회원·건강 기록', value: '탈퇴하면 바로 파기해요' },
            {
              label: '커뮤니티 글',
              value: '탈퇴하면 작성자 표시를 지우고 내용은 [보관 여부 확정 필요]',
            },
            { label: '접속 기록', value: '3개월 (「통신비밀보호법」)' },
            { label: '동의 이력', value: '[법정 보관 근거 확인 후 기재]' },
          ]}
        />
      ),
    },
    { title: '제4조 제3자 제공' },
    { title: '제5조 처리 위탁' },
    { title: '제6조 국외 이전', onOpen: () => navigate(ROUTES.LEGAL_TRANSFER) },
    { title: '제7조 파기 절차 및 방법' },
    {
      title: '제8조 이용자의 권리와 행사 방법',
      description: '열람·정정·삭제·처리정지·전송 요구',
    },
    { title: '제9조 자동 수집 장치(쿠키)' },
    { title: '제10조 안전성 확보 조치' },
    { title: '제11조 개인정보 보호책임자' },
    { title: '제12조 권익침해 구제 방법' },
    { title: '제13조 처리방침의 변경' },
  ]

  return (
    <LegalLayout title="개인정보 처리방침" onBack={goBack}>
      <DocumentHead
        title="당당 개인정보 처리방침"
        version={LEGAL_VERSION}
        onVersions={() => setToast('지금 버전이 첫 버전이에요')}
      />
      <p className="text-grey-700 text-sm leading-6">
        [운영자명](이하 “당당”)은 「개인정보 보호법」 제30조에 따라 이용자의 개인정보를 보호하고
        고충을 원활하게 처리하기 위해 다음과 같이 처리방침을 공개합니다.
      </p>

      <h3 className="text-t6 text-grey-900 font-bold">한눈에 보기</h3>
      <ul className="grid grid-cols-2 gap-2">
        {summary.map(({ icon, title, body, to }) => {
          const content = (
            <>
              <img src={icon} alt="" width={22} height={22} />
              <span className="text-body-3 text-grey-900 font-bold">{title}</span>
              <span className="text-t7 text-grey-700">{body}</span>
            </>
          )
          const className = 'bg-grey-50 rounded-key flex h-full flex-col gap-1.5 p-3.5 text-left'
          return (
            <li key={title}>
              {to ? (
                <button
                  type="button"
                  className={`${className} w-full`}
                  onClick={() => navigate(to)}
                >
                  {content}
                </button>
              ) : (
                <div className={className}>{content}</div>
              )}
            </li>
          )
        })}
      </ul>

      <h3 className="text-t6 text-grey-900 font-bold">전체 조항</h3>
      <ClauseList clauses={clauses} />

      {toast && <Toast message={toast} onClose={closeToast} />}
    </LegalLayout>
  )
}

export default PrivacyPolicyPage
