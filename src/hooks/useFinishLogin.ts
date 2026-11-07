import { useNavigate } from 'react-router'
import { ROUTES } from '@/constants/routes'
import type { AccountProfile } from '@/mocks/auth'
import { useAuthStore, type LoginMethod } from '@/stores/useAuthStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useProfileStore } from '@/stores/useProfileStore'

// 로그인·가입을 마치면 계정을 남기고, 첫 진입 설정을 마쳤으면 홈 아니면 약관 동의로
export function useFinishLogin() {
  const navigate = useNavigate()
  const completed = useOnboardingStore((state) => state.completed)
  const completeOnboarding = useOnboardingStore((state) => state.complete)
  const updateProfile = useProfileStore((state) => state.updateProfile)
  const login = useAuthStore((state) => state.login)

  return (method: LoginMethod, email: string | null = null, profile?: AccountProfile) => {
    login({ method, email })
    // 데모 계정은 설정을 마친 상태로 계정 정보를 넣고 바로 홈으로
    if (profile) {
      updateProfile({
        ...profile,
        hospitalized: false,
        checkRemindAt: null,
        postpartumChecks: [],
      })
      completeOnboarding()
    }
    navigate(completed || profile ? ROUTES.TODAY : ROUTES.ONBOARDING_TERMS, { replace: true })
  }
}
