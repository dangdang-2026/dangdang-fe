import type { LegalRow } from '@/components/legal/LegalTable'

// 개인정보 처리방침 · 이용약관 시행일과 버전
export const LEGAL_VERSION = '시행일: 2026년 12월 1일 · 버전 1.0'

// 국외 이전 받는 곳. 처리방침 제6조와 국외 이전 안내가 같이 씀. 피그마에서 확정 전인 칸(연락처 · 보유 기간 등)은 뺌
export const TRANSFER_RECIPIENTS: { name: string; purpose: string; rows: LegalRow[] }[] = [
  {
    name: 'OpenAI OpCo, LLC',
    purpose: '당당이 질문 · 진료 메모 정리 · 커뮤니티 글 확인',
    rows: [
      { label: '국가', value: '미국' },
      { label: '연락처', value: 'privacy@openai.com' },
      {
        label: '시기',
        value: '당당이에게 질문하거나 진료 메모 정리를 누를 때, 커뮤니티에 글을 올릴 때',
      },
      { label: '방법', value: '암호화 통신(HTTPS)' },
      {
        label: '항목',
        value:
          '질문 내용과 바로 앞 대화(최대 6개), 정리를 요청한 진료 메모, 커뮤니티 글 중 약·용량으로 보이는 문장(위험 내용 확인용, 올릴 때). 기록의 혈당 숫자, 내 이름·병원 이름은 빼고 보내요',
      },
      {
        label: '목적',
        value:
          '기록 찾아 보여 주기, 물어볼 말 정리, 진료 메모에서 측정 시점·목표·다음 진료일 찾기, 위반·위기 글 확인',
      },
      { label: '보유 기간', value: '최대 30일 보관한 뒤 삭제해요. AI 학습에는 쓰지 않아요.' },
      {
        label: '거부 방법',
        value: 'AI 기능: 마이 › AI 설정에서 「해외로 보내기」를 끄면 돼요.',
        highlight: true,
      },
    ],
  },
  {
    name: 'Google LLC (Gmail)',
    purpose: '안내 메일 보내기',
    rows: [
      { label: '국가', value: '미국' },
      { label: '시기', value: '가입 확인·비밀번호 메일을 보낼 때' },
      { label: '방법', value: '암호화 통신(TLS)' },
      { label: '항목', value: '이메일 주소, 메일 내용' },
      { label: '목적', value: '가입 확인·비밀번호 재설정 안내' },
    ],
  },
  {
    name: 'Apple Inc. · Google LLC',
    purpose: '알림 보내기 (APNs · FCM)',
    rows: [
      { label: '국가', value: '미국' },
      { label: '시기', value: '측정·진료 알림을 보낼 때' },
      { label: '방법', value: '암호화 통신' },
      {
        label: '항목',
        value:
          '기기 알림 토큰, 알림 문구. 잠금화면 가리기를 끄면 알림 문구에 혈당 숫자가 담겨 해외 푸시 서버를 거쳐요',
      },
      { label: '목적', value: '측정·진료 알림 보내기' },
      {
        label: '거부 방법',
        value: '마이 › 알림에서 끌 수 있어요. 잠금화면 가리기를 켜면 혈당 숫자는 보내지 않아요.',
        highlight: true,
      },
    ],
  },
  {
    name: 'Vercel Inc.',
    purpose: '앱 화면 전달',
    rows: [
      { label: '국가', value: '미국' },
      { label: '시기', value: '앱을 열 때마다' },
      { label: '방법', value: '암호화 통신(HTTPS)' },
      { label: '항목', value: '접속 기록(IP·기기 정보)' },
      { label: '목적', value: '앱 화면을 빠르게 보여 주기' },
    ],
  },
]
