import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import {
  consumeKakaoReturn,
  consumeKakaoState,
  consumeWithdrawPosts,
  deleteAccount,
  linkKakao,
  loginWithKakao,
} from '@/api/auth'
import { getErrorCode } from '@/api/axios'
import { ROUTES } from '@/constants/routes'
import { useFinishLogin } from '@/hooks/useFinishLogin'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  EMAIL_ACCOUNT_EXISTS,
  KAKAO_LINK_TOAST,
  KAKAO_WITHDRAW_TOAST,
  restartAfterWithdraw,
  type KakaoLinkOutcome,
} from '@/utils/auth'

// 카카오 인가 후 돌아오는 주소. 코드를 서버에 넘기고 이메일 로그인과 같은 흐름으로
function KakaoCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const finish = useFinishLogin()
  // 인가 코드는 한 번만 쓸 수 있어 StrictMode 이중 실행 막음
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    // 실패는 로그인 화면 error로 넘겨 알림. access_denied면 취소 토스트, 이메일 계정과 겹치면 K-07 시트
    const fail = (error: string) =>
      navigate(`${ROUTES.LOGIN}?${new URLSearchParams({ error })}`, { replace: true })

    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const purpose = consumeKakaoState(searchParams.get('state'))
    const returnTo = consumeKakaoReturn()

    // 카카오 가입자 탈퇴 본인 확인이면 바로 탈퇴. 막히면 데이터 화면으로 돌아가 알림
    if (purpose === 'withdraw') {
      const posts = consumeWithdrawPosts()
      const back = (reason: string) =>
        navigate(returnTo ?? ROUTES.MY_DATA, {
          replace: true,
          state: { toast: KAKAO_WITHDRAW_TOAST[reason] ?? KAKAO_WITHDRAW_TOAST.failed },
        })
      if (error) return void back(error === 'access_denied' ? 'cancel' : 'failed')
      if (!code) return void back('failed')
      deleteAccount({ kakaoCode: code }, posts)
        .then(restartAfterWithdraw)
        .catch((reason) => back(getErrorCode(reason) ?? 'failed'))
      return
    }

    // 로그인한 계정에 카카오 연결이면 결과를 오늘 화면 토스트로
    if (purpose === 'link') {
      const done = (kakaoLink: KakaoLinkOutcome) => {
        // 연결 권하기는 한 번만. 다녀오면 결과와 상관없이 다시 안 띄움
        useAuthStore.getState().setKakaoLinkOffer(false)
        // 오늘 화면은 kakaoLink, 마이 화면들은 toast로 알림
        navigate(returnTo ?? ROUTES.TODAY, {
          replace: true,
          state: { kakaoLink, toast: KAKAO_LINK_TOAST[kakaoLink] },
        })
      }
      if (error) return void done(error === 'access_denied' ? 'cancel' : 'failed')
      if (!code) return void done('failed')
      linkKakao(code)
        .then(done)
        .catch(() => done('failed'))
      return
    }

    if (error) return void fail(error)
    if (!code || !purpose) return void fail('invalid_request')

    loginWithKakao(code)
      .then((result) => {
        if (result.status === 'loggedIn') return finish('kakao')
        // 처음 보는 카카오는 소개 화면에서 가입 확인
        if (result.status === 'needsSignup') {
          return navigate(`${ROUTES.ONBOARDING}?${new URLSearchParams({ kakao: 'signup' })}`, {
            replace: true,
          })
        }
        // 같은 이메일 계정이 있으면 로그인 화면에 이메일을 채워 두고 안내
        navigate(`${ROUTES.LOGIN}?${new URLSearchParams({ error: EMAIL_ACCOUNT_EXISTS })}`, {
          replace: true,
          state: { email: result.email, maskedEmail: result.maskedEmail },
        })
      })
      .catch(() => fail('server_error'))
  }, [searchParams, navigate, finish])

  return (
    <main className="flex min-h-dvh items-center justify-center bg-white">
      <p className="text-grey-500 animate-pulse text-sm">카카오 확인 중이에요</p>
    </main>
  )
}

export default KakaoCallbackPage
