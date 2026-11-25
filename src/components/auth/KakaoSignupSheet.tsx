import type { KakaoSignupResult } from '@/api/auth'
import iconLoading from '@/assets/icons/auth/loading.svg'
import BottomSheet from '@/components/common/BottomSheet'

export type KakaoSignupError = Exclude<KakaoSignupResult, 'ok'> | 'failed'

// 문구는 서버 에러 message와 같게
const ERROR_TEXT: Record<KakaoSignupError, string> = {
  expired: '카카오 확인 시간이 지났어요. 카카오 로그인을 다시 해 주세요.',
  noEmail: '카카오계정 이메일 인증을 마친 뒤 다시 가입해 주세요.',
  emailAccount: '이 이메일로 가입한 계정이 있어요. 이메일로 로그인해 주세요.',
  linked: '이 카카오 계정은 다른 당당 계정에 이미 연결돼 있어요. 그 계정으로 로그인해 주세요.',
  failed: '가입하지 못했어요. 잠시 후 다시 시도해 주세요.',
}

type KakaoSignupSheetProps = {
  loading: boolean
  error: KakaoSignupError | null
  onSignup: () => void
  onKakaoAgain: () => void
  onEmailLogin: () => void
  onClose: () => void
}

// Figma K-08 처음 보는 카카오. 이메일 계정이 있으면 기록이 나뉘지 않게 이메일 로그인 뒤 연결로 안내
function KakaoSignupSheet({
  loading,
  error,
  onSignup,
  onKakaoAgain,
  onEmailLogin,
  onClose,
}: KakaoSignupSheetProps) {
  // 토큰을 더 쓸 수 없으면 카카오 로그인부터 다시. 같은 이메일 계정이면 이메일 로그인만
  const kakaoAgain = error === 'expired' || error === 'noEmail' || error === 'linked'
  const primary =
    error === 'emailAccount'
      ? { label: '이메일로 로그인', onClick: onEmailLogin }
      : kakaoAgain
        ? { label: '카카오 로그인 다시 하기', onClick: onKakaoAgain }
        : { label: '처음이에요, 가입할게요', onClick: onSignup }

  return (
    <BottomSheet label="카카오로 처음 가입" onClose={onClose}>
      <h2 className="text-t4 text-grey-900">이미 이메일로 가입했나요?</h2>
      <p className="text-t6 text-grey-700">
        그렇다면 이메일로 로그인한 뒤
        <br />
        카카오를 연결해 주세요.
        <br />
        기록이 둘로 나뉘지 않아요.
      </p>
      {error && (
        <p role="alert" className="-mt-2 text-sm leading-normal text-red-500">
          {ERROR_TEXT[error]}
        </p>
      )}
      <button
        type="button"
        aria-busy={loading}
        disabled={loading}
        className="text-subtitle-1 bg-primary relative mt-2 h-14 rounded-xl leading-none text-white"
        onClick={primary.onClick}
      >
        <span className={loading ? 'opacity-0' : undefined}>{primary.label}</span>
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
      {error !== 'emailAccount' && (
        <button
          type="button"
          disabled={loading}
          className="text-grey-600 py-1 text-sm leading-normal"
          onClick={onEmailLogin}
        >
          이메일로 로그인
        </button>
      )}
    </BottomSheet>
  )
}

export default KakaoSignupSheet
