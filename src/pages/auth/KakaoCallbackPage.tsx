import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { consumeKakaoState, loginWithKakao } from '@/api/auth'
import { ROUTES } from '@/constants/routes'
import { useFinishLogin } from '@/hooks/useFinishLogin'

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

    // 실패는 로그인 화면 error로 넘겨 토스트로 알림. access_denied면 취소 토스트
    const fail = (error: string) =>
      navigate(`${ROUTES.LOGIN}?${new URLSearchParams({ error })}`, { replace: true })

    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const stateOk = consumeKakaoState(searchParams.get('state'))
    if (error) return void fail(error)
    if (!code || !stateOk) return void fail('invalid_request')

    loginWithKakao(code)
      .then(() => finish('kakao'))
      .catch(() => fail('server_error'))
  }, [searchParams, navigate, finish])

  return (
    <main className="flex min-h-dvh items-center justify-center bg-white">
      <p className="text-grey-500 animate-pulse text-sm">카카오 로그인 중이에요</p>
    </main>
  )
}

export default KakaoCallbackPage
