import { useNavigate } from 'react-router'
import { getMe } from '@/api/me'
import { syncPushSubscription } from '@/api/push'
import { ROUTES } from '@/constants/routes'
import type { AccountProfile } from '@/mocks/auth'
import { useAuthStore, type LoginMethod } from '@/stores/useAuthStore'
import { syncCriteria } from '@/stores/useCriteriaStore'
import { syncMeals, syncRecords } from '@/stores/useGlucoseStore'
import { syncInbox } from '@/stores/useInboxStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useProfileStore } from '@/stores/useProfileStore'

// 로그인·가입을 마치면 계정을 남기고, 서버 약관 동의 여부로 약관 화면 또는 홈으로
export function useFinishLogin() {
  const navigate = useNavigate()
  const completed = useOnboardingStore((state) => state.completed)
  const completeOnboarding = useOnboardingStore((state) => state.complete)
  const resetOnboarding = useOnboardingStore((state) => state.reset)
  const updateProfile = useProfileStore((state) => state.updateProfile)
  const login = useAuthStore((state) => state.login)

  // 서버를 못 보면 기기에 남은 설정으로 판단
  const goByDevice = () =>
    navigate(completed ? ROUTES.TODAY : ROUTES.ONBOARDING_TERMS, { replace: true })

  return async (method: LoginMethod, email: string | null = null, profile?: AccountProfile) => {
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
      navigate(ROUTES.TODAY, { replace: true })
      return
    }
    try {
      const me = await getMe()
      updateProfile({ name: me.displayName })
      // 카카오는 로그인 응답에 이메일이 없어 /me 값으로 채움
      if (!email && me.email) login({ method, email: me.email })
      // 식사·혈당 기록은 서버 값으로. 새 계정이면 기기에 남은 다른 계정 기록도 비워짐
      syncMeals().catch(() => {})
      syncRecords().catch(() => {})
      // 알림함도 이 계정 알림으로. 다른 계정 알림이 남지 않게
      syncInbox().catch(() => {})
      // 약관 전이면 새 계정이거나 설정을 안 마친 계정. 기기에 남은 다른 계정 설정은 비움
      if (!me.consentCompleted) {
        resetOnboarding()
        navigate(ROUTES.ONBOARDING_TERMS, { replace: true })
        return
      }
      // 병원 기준은 서버 값으로. 못 받아도 기기 값으로 계속 씀
      syncCriteria().catch(() => {})
      // 이 기기 알림을 지금 계정으로 받게 구독 등록
      syncPushSubscription()
      // 약관은 서버에 있음. 나머지 설정은 아직 기기에만 있어 기기 값으로
      navigate(completed ? ROUTES.TODAY : ROUTES.ONBOARDING_TIMING, { replace: true })
    } catch {
      goByDevice()
    }
  }
}
