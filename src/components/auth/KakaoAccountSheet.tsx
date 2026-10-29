import iconKakao from '@/assets/icons/onboarding/kakao.svg'
import BottomSheet from '@/components/common/BottomSheet'

type KakaoAccountSheetProps = {
  onKakao: () => void
  onClose: () => void
}

// Figma L-08 카카오로 가입한 이메일로 로그인 시도. 비밀번호가 없으니 카카오로 안내
function KakaoAccountSheet({ onKakao, onClose }: KakaoAccountSheetProps) {
  return (
    <BottomSheet label="카카오로 가입한 계정" onClose={onClose}>
      <h2 className="text-t4 text-grey-900">카카오로 가입한 계정이에요</h2>
      <p className="text-t6 text-grey-700">
        이 이메일은 카카오 로그인으로 가입돼 있어서 비밀번호가 없어요. 카카오로 로그인해 주세요.
      </p>
      <button
        type="button"
        className="bg-kakao text-kakao-label text-subtitle-1 flex h-14 items-center justify-center gap-1 rounded-xl leading-none"
        onClick={onKakao}
      >
        <img src={iconKakao} alt="" width={20} height={20} />
        카카오로 로그인
      </button>
      <button type="button" className="text-grey-600 py-1 text-sm leading-normal" onClick={onClose}>
        닫기
      </button>
    </BottomSheet>
  )
}

export default KakaoAccountSheet
