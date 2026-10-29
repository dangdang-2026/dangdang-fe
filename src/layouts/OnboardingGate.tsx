import { Navigate, Outlet } from 'react-router'
import { ROUTES } from '@/constants/routes'
import { useAuthStore } from '@/stores/useAuthStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'

// 로그인 안 했거나 첫 진입 설정을 안 마쳤으면 서비스 소개로
function OnboardingGate() {
  const loggedIn = useAuthStore((state) => state.account !== null)
  const completed = useOnboardingStore((state) => state.completed)
  if (!loggedIn || !completed) return <Navigate to={ROUTES.ONBOARDING} replace />
  return <Outlet />
}

export default OnboardingGate
