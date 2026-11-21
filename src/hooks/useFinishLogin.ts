import { useNavigate } from 'react-router'
import { getMe } from '@/api/me'
import { syncPushSubscription } from '@/api/push'
import { ROUTES } from '@/constants/routes'
import type { AccountProfile } from '@/mocks/auth'
import { syncAiConsents } from '@/stores/useAiStore'
import { syncMyFoods } from '@/stores/useFoodStore'
import { useAuthStore, type LoginMethod } from '@/stores/useAuthStore'
import { syncBlocks, syncCommunityProfile, syncRestriction } from '@/stores/useCommunityStore'
import { syncCriteria } from '@/stores/useCriteriaStore'
import { syncMeals, syncRecords } from '@/stores/useGlucoseStore'
import { syncHospitals } from '@/stores/useHospitalStore'
import { syncMealGuide } from '@/stores/useMealGuideStore'
import { syncMealSettings } from '@/stores/useMealSettingsStore'
import { syncReports } from '@/stores/useReportStore'
import { syncQuestions, syncVisitNote, syncVisits } from '@/stores/useVisitStore'
import { syncInbox } from '@/stores/useInboxStore'
import { syncNotificationSettings } from '@/stores/useNotificationStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { syncPostpartum, useProfileStore } from '@/stores/useProfileStore'

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
      // 입원 상태도 이 계정 값으로
      updateProfile({ name: me.displayName, hospitalized: me.pregnancyState === 'HOSPITALIZED' })
      // 카카오는 로그인 응답에 이메일이 없어 /me 값으로 채움
      if (!email && me.email) login({ method, email: me.email })
      // 식사·혈당 기록은 서버 값으로. 새 계정이면 기기에 남은 다른 계정 기록도 비워짐
      syncMeals().catch(() => {})
      syncRecords().catch(() => {})
      // 내 음식도 이 계정 것으로. 기기에 남은 다른 계정 음식은 보내지 않음
      syncMyFoods(false).catch(() => {})
      // 알림함도 이 계정 알림으로. 다른 계정 알림이 남지 않게
      syncInbox().catch(() => {})
      // 다니는 병원도 이 계정 병원으로
      // 식사 안내 · 진료 일정도 이 계정 것으로. 병원 번호를 써서 병원 다음에
      syncHospitals()
        .catch(() => {})
        .then(() =>
          Promise.all(
            [
              syncMealGuide(false),
              syncVisits(false).then(() =>
                Promise.all([syncQuestions(false), syncVisitNote(false)]),
              ),
            ].map((job) => job.catch(() => {})),
          ),
        )
      // 커뮤니티 닉네임도 이 계정 닉네임으로
      syncCommunityProfile().catch(() => {})
      // 안 보기로 한 사람도 이 계정 목록으로
      syncBlocks().catch(() => {})
      // 이용 제한도 이 계정 값으로
      syncRestriction().catch(() => {})
      // 산후 모드(출산일 · 다시 물어볼 날)도 이 계정 값으로
      syncPostpartum(me.pregnancyState).catch(() => {})
      // 당당이 기록 보기 동의도 이 계정 값으로
      syncAiConsents().catch(() => {})
      // 양 적는 방식(인분 · 그램)도 이 계정 값으로
      syncMealSettings().catch(() => {})
      // 지난 진료 리포트도 이 계정 것으로
      syncReports().catch(() => {})
      // 알림 설정도 이 계정 값으로. 다른 계정 설정이 남지 않게
      const settingsSynced = syncNotificationSettings().catch(() => {})
      // 약관 전이면 새 계정이거나 설정을 안 마친 계정. 기기에 남은 다른 계정 설정은 비움
      if (!me.consentCompleted) {
        resetOnboarding()
        navigate(ROUTES.ONBOARDING_TERMS, { replace: true })
        return
      }
      // 알림 설정을 받은 뒤 측정 알림이 켜져 있으면 이 기기를 구독 등록
      void settingsSynced.then(syncPushSubscription)
      // 병원 기준은 서버 값으로. 못 받으면 기기 값으로 판단
      const criteria = await syncCriteria().catch(() => null)
      if (!criteria) {
        navigate(completed ? ROUTES.TODAY : ROUTES.ONBOARDING_TIMING, { replace: true })
        return
      }
      // 서버에 기준이 있으면 다른 기기에서 설정을 마친 계정
      if (criteria.versions.length > 0) {
        completeOnboarding(criteria.startedAt ?? undefined)
        navigate(ROUTES.TODAY, { replace: true })
        return
      }
      // 기준이 없으면 기기에 남은 다른 계정 설정은 비우고 측정 시점부터
      resetOnboarding()
      navigate(ROUTES.ONBOARDING_TIMING, { replace: true })
    } catch {
      goByDevice()
    }
  }
}
