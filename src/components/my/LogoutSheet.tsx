import BottomSheet from '@/components/common/BottomSheet'

type LogoutSheetProps = {
  onLogout: () => void
  onClose: () => void
}

// Figma M-10 로그아웃 확인
function LogoutSheet({ onLogout, onClose }: LogoutSheetProps) {
  return (
    <BottomSheet label="로그아웃" onClose={onClose}>
      <h2 className="text-t4 text-grey-900">로그아웃할까요?</h2>
      <p className="text-t6 text-grey-700">
        기록은 그대로 남아 있어요.
        <br />
        다시 로그인하면 이어서 볼 수 있어요.
      </p>
      <button
        type="button"
        className="text-subtitle-1 bg-primary mt-6 h-14 rounded-xl leading-none text-white"
        onClick={onLogout}
      >
        로그아웃
      </button>
      <button type="button" className="text-grey-600 py-1 text-sm leading-normal" onClick={onClose}>
        취소
      </button>
    </BottomSheet>
  )
}

export default LogoutSheet
