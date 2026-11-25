import iconLoading from '@/assets/icons/auth/loading.svg'
import BottomSheet from '@/components/common/BottomSheet'

type KakaoLinkSheetProps = {
  loading: boolean
  onLink: () => void
  onClose: () => void
}

// Figma L-10 이메일 로그인 뒤 카카오가 안 연결돼 있으면 한 번 연결 권함
function KakaoLinkSheet({ loading, onLink, onClose }: KakaoLinkSheetProps) {
  return (
    <BottomSheet label="카카오 연결" onClose={onClose}>
      <h2 className="text-t4 text-grey-900">카카오도 연결할까요?</h2>
      <p className="text-t6 text-grey-700">
        연결하면 다음부터 카카오로
        <br />
        바로 로그인할 수 있어요.
        <br />
        기록은 지금 계정 하나로 이어져요.
      </p>
      <button
        type="button"
        aria-busy={loading}
        disabled={loading}
        className="text-subtitle-1 bg-primary relative mt-3 h-14 rounded-xl leading-none text-white"
        onClick={onLink}
      >
        <span className={loading ? 'opacity-0' : undefined}>카카오 연결하기</span>
        {loading && (
          <img
            src={iconLoading}
            alt=""
            width={31}
            height={7}
            className="absolute top-1/2 left-1/2 -translate-1/2"
          />
        )}
      </button>
      <button
        type="button"
        disabled={loading}
        className="text-grey-600 py-1 text-sm leading-normal"
        onClick={onClose}
      >
        나중에 할게요
      </button>
    </BottomSheet>
  )
}

export default KakaoLinkSheet
