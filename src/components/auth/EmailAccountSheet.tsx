import BottomSheet from '@/components/common/BottomSheet'

type EmailAccountSheetProps = {
  // 서버가 가린 카카오 이메일. 예: da***@gmail.com
  maskedEmail?: string
  onEmailLogin: () => void
  onOtherKakao: () => void
  onFindPassword: () => void
  onClose: () => void
}

// Figma K-07 카카오계정 이메일로 이미 이메일 가입한 계정이 있음. 합치지 않고 이메일 로그인으로 안내
function EmailAccountSheet({
  maskedEmail,
  onEmailLogin,
  onOtherKakao,
  onFindPassword,
  onClose,
}: EmailAccountSheetProps) {
  return (
    <BottomSheet label="이메일로 가입한 계정" onClose={onClose}>
      <h2 className="text-t4 text-grey-900">이미 이메일로 가입한 계정이 있어요</h2>
      <p className="text-t6 text-grey-700">
        카카오계정 이메일{maskedEmail && `(${maskedEmail})`}로
        <br />
        가입한 당당 계정이 있어요.
        <br />
        기록이 나뉘지 않게 이메일로 로그인해 주세요.
      </p>
      <button
        type="button"
        className="text-grey-700 -mt-2 self-start text-sm leading-normal underline"
        onClick={onFindPassword}
      >
        비밀번호를 잊었어요
      </button>
      <button
        type="button"
        className="text-subtitle-1 bg-primary mt-2 h-14 rounded-xl leading-none text-white"
        onClick={onEmailLogin}
      >
        이메일로 로그인
      </button>
      <button
        type="button"
        className="text-grey-600 py-1 text-sm leading-normal"
        onClick={onOtherKakao}
      >
        다른 카카오계정으로 시작하기
      </button>
    </BottomSheet>
  )
}

export default EmailAccountSheet
