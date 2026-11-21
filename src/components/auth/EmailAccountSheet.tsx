import BottomSheet from '@/components/common/BottomSheet'

type EmailAccountSheetProps = {
  onEmailLogin: () => void
  onOtherKakao: () => void
  onClose: () => void
}

// Figma K-07 카카오계정 이메일로 이미 이메일 가입한 계정이 있음. 합치지 않고 이메일 로그인으로 안내
function EmailAccountSheet({ onEmailLogin, onOtherKakao, onClose }: EmailAccountSheetProps) {
  return (
    <BottomSheet label="이메일로 가입한 계정" onClose={onClose}>
      <h2 className="text-t4 text-grey-900">이미 이메일로 가입한 계정이 있어요</h2>
      {/* 서버가 가린 이메일을 주지 않아 피그마의 (da***@gmail.com)은 뺌 */}
      <p className="text-t6 text-grey-700">
        카카오계정 이메일로 가입된 당당 계정이 있어요. 기록이 나뉘지 않도록 이메일로 로그인해
        주세요.
      </p>
      <button
        type="button"
        className="text-subtitle-1 bg-primary mt-7.5 h-14 rounded-xl leading-none text-white"
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
