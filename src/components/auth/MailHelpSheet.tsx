import { VERIFY_MAX_SENDS } from '@/api/auth'
import BottomSheet from '@/components/common/BottomSheet'

type MailHelpSheetProps = {
  email: string
  canResend: boolean
  onResend: () => void
  onChangeEmail: () => void
  onClose: () => void
}

// Figma V-09 메일이 안 와요: 스팸함 · 주소 확인 · 다시 받기 안내
function MailHelpSheet({ email, canResend, onResend, onChangeEmail, onClose }: MailHelpSheetProps) {
  const tips = [
    { title: '스팸함·프로모션함을 확인해 주세요', body: '메일이 그쪽으로 분류될 때가 있어요.' },
    {
      title: '이메일 주소를 확인해 주세요',
      body: `${email} — 틀렸다면 「이메일 바꾸기」를 눌러 주세요.`,
    },
    {
      title: '인증번호를 다시 받을 수 있어요',
      body: `하루에 ${VERIFY_MAX_SENDS}번까지 받을 수 있어요.`,
    },
  ]

  return (
    <BottomSheet label="메일이 안 와요" onClose={onClose}>
      <h2 className="text-t4 text-grey-900">메일이 안 와요</h2>
      {tips.map((tip) => (
        <div key={tip.title} className="flex flex-col gap-0.5 py-2.5">
          <p className="text-grey-900 text-base leading-normal font-bold">{tip.title}</p>
          <p className="text-grey-600 text-sm leading-normal">{tip.body}</p>
        </div>
      ))}
      <button
        type="button"
        disabled={!canResend}
        className="text-subtitle-1 bg-primary disabled:bg-grey-100 disabled:text-grey-400 h-14 rounded-xl leading-none text-white"
        onClick={onResend}
      >
        인증번호 다시 받기
      </button>
      <button
        type="button"
        className="text-grey-600 py-1 text-sm leading-normal"
        onClick={onChangeEmail}
      >
        이메일 바꾸기
      </button>
    </BottomSheet>
  )
}

export default MailHelpSheet
