import { useNavigate } from 'react-router'
import { ROUTES } from '@/constants/routes'
import { useAuthStore, type LoginMethod } from '@/stores/useAuthStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'

// 로그인·가입을 마치면 계정을 남기고, 첫 진입 설정을 마쳤으면 홈 아니면 약관 동의로
export function useFinishLogin() {
  const navigate = useNavigate()
  const completed = useOnboardingStore((state) => state.completed)
  const login = useAuthStore((state) => state.login)

  return (method: LoginMethod, email: string | null = null) => {
    login({ method, email })
    navigate(completed ? ROUTES.TODAY : ROUTES.ONBOARDING_TERMS, { replace: true })
  }
}
