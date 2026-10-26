import { Navigate, Outlet } from 'react-router'
import { ROUTES } from '@/constants/routes'
import { useOnboardingStore } from '@/stores/useOnboardingStore'

// 첫 진입 설정을 안 마쳤으면 서비스 소개로
function OnboardingGate() {
  const completed = useOnboardingStore((state) => state.completed)
  if (!completed) return <Navigate to={ROUTES.ONBOARDING} replace />
  return <Outlet />
}

export default OnboardingGate
