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
import ClauseList, {
  ClauseBody,
  ClauseParagraphs,
  type Clause,
} from '@/components/legal/ClauseList'
import DocumentHead from '@/components/legal/DocumentHead'
import LegalLayout from '@/components/legal/LegalLayout'
import LegalTable from '@/components/legal/LegalTable'
import TransferTables from '@/components/legal/TransferTables'
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
    { icon: iconEntrust, title: '처리 위탁', body: '서버 운영(케이티클라우드)·메일 발송' },
    {
      icon: iconTransfer,
      title: '국외 이전',
      body: 'OpenAI·Google·Apple·Vercel (미국)',
      to: ROUTES.LEGAL_TRANSFER,
    },
    { icon: iconOfficer, title: '보호책임자', body: '임다현 · ddangdang2026@gmail.com' },
  ]

  const clauses: Clause[] = [
    {
      title: '제1조 개인정보의 처리 목적',
      body: (
        <ClauseBody
          lines={[
            '당당은 아래 목적으로만 개인정보를 처리해요. 목적이 바뀌면 미리 알리고 다시 동의를 받아요.',
          ]}
          rows={[
            { label: '회원 관리', value: '가입·로그인, 본인 확인, 부정 이용 막기' },
            { label: '기록 관리', value: '혈당·식사·인슐린 기록 저장과 보여 주기' },
            { label: '알림', value: '측정 시간 알림, 다시 알림' },
            { label: '진료 리포트', value: '진료 때 보여 줄 기록 정리' },
            { label: '커뮤니티', value: '글·댓글, 신고 처리, AI로 위반·위기 글 확인' },
            {
              label: 'AI 기능',
              value: '동의한 경우에만 사진 음식 찾기, 질문 답하기, 진료 메모 정리',
            },
            { label: '문의 응대', value: '문의 확인과 답변' },
          ]}
        />
      ),
    },
    {
      title: '제2조 처리하는 개인정보의 항목',
      description: '필수·선택·자동 수집 구분',
      body: (
        <div className="flex flex-col gap-3">
          <LegalTable
            head={['구분', '항목']}
            rows={[
              {
                label: '필수 · 회원',
                value:
                  '이메일, 비밀번호(암호화 저장), 닉네임, 이름(부를 이름) · 카카오로 가입하면 카카오 회원번호, 카카오계정 이메일, 카카오 닉네임',
              },
              {
                label: '필수 · 민감정보 (따로 동의)',
                value:
                  '임신 주수·출산 예정일, 진단일, 혈당 측정값·측정 시각, 식사 기록, 인슐린 기록, 진료 메모, 출산일·입원 여부, 다니는 병원, 병원 관리 기준',
              },
              {
                label: '선택',
                value:
                  '식사 사진(음식을 찾는 데만 쓰고 저장하지 않음), 내 음식, 내 식사 안내, 커뮤니티 글·댓글·투표',
              },
              {
                label: '자동 수집',
                value: '접속 기록(IP·시각), 기기·브라우저 정보, 알림 토큰, 로그인 유지 쿠키',
              },
            ]}
          />
          <p className="text-grey-600 text-xs leading-normal">
            당당은 만 14세 미만의 개인정보를 받지 않아요. 만 14세 미만은 가입할 수 없어요.
          </p>
        </div>
      ),
    },
    {
      title: '제3조 처리 및 보유 기간',
      body: (
        <LegalTable
          head={['항목', '보유 기간']}
          rows={[
            { label: '회원·건강 기록', value: '탈퇴하면 바로 파기해요' },
            { label: '동의 이력', value: '탈퇴하면 바로 파기해요' },
            {
              label: '커뮤니티 글',
              value:
                '탈퇴할 때 골라요. 기본은 함께 삭제, 남기기를 고르면 작성자를 「탈퇴한 회원」으로 바꿔 남겨요',
            },
            { label: '접속 기록', value: '3개월 (「통신비밀보호법」)' },
            { label: '인증번호', value: '10분 뒤 자동 삭제' },
            { label: '비밀번호 재설정 링크', value: '30분 뒤 자동 삭제' },
          ]}
        />
      ),
    },
    {
      title: '제4조 개인정보의 제3자 제공',
      body: (
        <ClauseBody
          lines={[
            '당당은 개인정보를 다른 곳에 제공하지 않아요. 다만 법률에 특별한 규정이 있거나 수사기관이 법에 따른 절차로 요청하는 경우는 예외예요.',
          ]}
        />
      ),
    },
    {
      title: '제5조 개인정보 처리 위탁',
      body: (
        <ClauseBody
          lines={[
            '서비스를 운영하려고 아래 업체에 일을 맡겨요. 맡긴 업체가 개인정보를 안전하게 다루는지 계약으로 관리해요.',
          ]}
          rows={[
            {
              label: '㈜케이티클라우드',
              value:
                '서버 운영, 데이터와 암호화한 백업 보관 (국내 · 서경대학교 산학협력단 계약 서버)',
            },
            {
              label: 'OpenAI OpCo, LLC',
              value:
                '당당이 답하기, 진료 메모 정리, 커뮤니티 위반·위기 글 확인 (미국 · 제6조 참고)',
            },
            { label: 'Google LLC', value: '인증·비밀번호 재설정 메일 보내기 (Gmail)' },
            {
              label: 'Apple · Google',
              value: '기기로 알림 전달 (잠금화면 가리기를 켜면 기록 숫자는 보내지 않아요)',
            },
            { label: 'Vercel Inc.', value: '웹 화면 전달' },
          ]}
        />
      ),
    },
    {
      title: '제6조 개인정보의 국외 이전',
      body: (
        <div className="flex flex-col gap-3">
          <ClauseParagraphs
            lines={[
              '아래 경우에 해외로 보내요. 받는 곳마다 보내는 때·항목·보관 기간과 거부 방법을 알려 드려요.',
            ]}
          />
          <TransferTables />
        </div>
      ),
    },
    {
      title: '제7조 개인정보의 파기 절차 및 방법',
      body: (
        <ClauseBody
          lines={[
            '탈퇴하거나 보유 기간이 끝나면 지체 없이 파기해요. 데이터베이스의 정보는 다시 살릴 수 없는 방법으로 지워요.',
          ]}
          rows={[
            { label: '백업', value: '탈퇴한 정보도 백업에는 최대 7일 남았다가 자동으로 지워져요' },
          ]}
        />
      ),
    },
    {
      title: '제8조 이용자의 권리와 행사 방법',
      description: '열람·정정·삭제·처리정지·전송 요구',
      body: (
        <ClauseBody
          lines={['언제든 내 개인정보를 보고, 고치고, 지우고, 처리를 멈추도록 요청할 수 있어요.']}
          rows={[
            { label: '보기 · 고치기', value: '마이 › 내 정보' },
            { label: '기록 내려받기 · 지우기', value: '마이 › 데이터 · 개인정보' },
            {
              label: '동의 철회',
              value: 'AI 기능: 마이 › AI 설정\n건강정보: 마이 › 데이터 · 개인정보',
            },
            { label: '탈퇴', value: '마이 › 데이터 · 개인정보 › 탈퇴' },
          ]}
          note="요청하면 10일 안에 처리하고 결과를 알려 드려요."
        />
      ),
    },
    {
      title: '제9조 자동 수집 장치 (쿠키)',
      body: (
        <ClauseBody
          lines={['로그인을 유지하려고 쿠키를 써요. 광고나 추적용 쿠키는 쓰지 않아요.']}
          rows={[
            { label: '로그인 쿠키', value: '30분 (다른 스크립트가 읽을 수 없는 httpOnly)' },
            { label: '로그인 유지 쿠키', value: '14일 · 로그아웃하면 바로 지워져요' },
          ]}
          note="브라우저 설정에서 쿠키를 막을 수 있지만, 그러면 로그인할 수 없어요."
        />
      ),
    },
    {
      title: '제10조 개인정보의 안전성 확보 조치',
      body: (
        <LegalTable
          rows={[
            {
              label: '암호화',
              value:
                '비밀번호는 되돌릴 수 없게 암호화, 건강정보는 암호화해서 저장, 모든 통신은 HTTPS',
            },
            { label: '접근 관리', value: '운영자 권한을 최소로 두고 접속 기록을 남겨요' },
            { label: '로그인 보호', value: '5번 틀리면 5분 동안 잠가요' },
            { label: '사진', value: '식사 사진은 서버에 저장하지 않아요' },
          ]}
        />
      ),
    },
    {
      title: '제11조 개인정보 보호책임자',
      body: (
        <LegalTable
          rows={[
            { label: '운영', value: '당당 팀' },
            { label: '보호책임자', value: '임다현' },
            { label: '연락처', value: 'ddangdang2026@gmail.com · 앱 안 마이 › 문의하기' },
          ]}
        />
      ),
    },
    {
      title: '제12조 권익침해 구제 방법',
      body: (
        <LegalTable
          rows={[
            { label: '개인정보침해신고센터', value: '(국번 없이) 118 · privacy.kisa.or.kr' },
            { label: '개인정보 분쟁조정위원회', value: '1833-6972 · kopico.go.kr' },
            { label: '대검찰청', value: '(국번 없이) 1301' },
            { label: '경찰청', value: '(국번 없이) 182' },
          ]}
        />
      ),
    },
    {
      title: '제13조 처리방침의 변경',
      body: (
        <ClauseBody
          lines={[
            '이 방침이 바뀌면 시행 7일 전부터 앱에 알려요. 이용자에게 불리하게 바뀌면 30일 전에 알려요. 이전 버전은 맨 위 「이전 버전」에서 볼 수 있어요.',
          ]}
        />
      ),
    },
  ]

  return (
    <LegalLayout title="개인정보 처리방침" onBack={goBack}>
      <DocumentHead
        title="당당 개인정보 처리방침"
        version={LEGAL_VERSION}
        onVersions={() => navigate(ROUTES.LEGAL_PRIVACY_VERSIONS)}
      />
      <p className="text-grey-700 text-sm leading-6">
        당당 팀(이하 「당당」)은 「개인정보 보호법」 제30조에 따라 이용자의 개인정보를 보호하고
        고충을 빠르게 처리하려고 이 처리방침을 공개해요.
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
