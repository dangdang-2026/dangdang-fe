import { useEffect } from 'react'
import { getMe } from '@/api/me'
import { syncPushSubscription } from '@/api/push'
import { syncAiConsents } from '@/stores/useAiStore'
import { syncMyFoods } from '@/stores/useFoodStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { syncCommunityProfile } from '@/stores/useCommunityStore'
import { syncCriteria } from '@/stores/useCriteriaStore'
import { syncMeals, syncRecords } from '@/stores/useGlucoseStore'
import { syncHospitals } from '@/stores/useHospitalStore'
import { syncMealGuide } from '@/stores/useMealGuideStore'
import { syncVisits } from '@/stores/useVisitStore'
import { syncInbox } from '@/stores/useInboxStore'
import { syncNotificationSettings } from '@/stores/useNotificationStore'
import { syncPostpartum, useProfileStore } from '@/stores/useProfileStore'

// 앱을 열 때 한 번 서버 로그인 확인. 스플래시 동안 뒤에서 돌아 기다리지 않음
export function useSessionCheck() {
  const method = useAuthStore((state) => state.account?.method)
  const login = useAuthStore((state) => state.login)
  const updateProfile = useProfileStore((state) => state.updateProfile)

  useEffect(() => {
    if (!method) return
    getMe()
      .then((me) => {
        // 다른 기기에서 바꾼 입원 상태도 서버 값으로
        updateProfile({ name: me.displayName, hospitalized: me.pregnancyState === 'HOSPITALIZED' })
        // 이메일 채우기 전에 로그인한 카카오 계정도 열 때 채움
        login({ method, email: me.email })
        // 서버 알림 설정을 받은 뒤 측정 알림이 켜져 있으면 이 기기를 구독 등록
        syncNotificationSettings()
          .catch(() => {})
          .finally(syncPushSubscription)
        // 다른 기기에서 바꾼 병원 기준·식사·혈당 기록도 반영
        return Promise.all([
          syncCriteria(),
          syncMeals(),
          syncMyFoods(),
          syncRecords(),
          syncInbox(),
          // 식사 안내 받은 곳 · 진료 일정 병원은 병원 목록이 있어야 해서 병원 다음에
          syncHospitals().finally(() =>
            Promise.all([syncMealGuide().catch(() => {}), syncVisits().catch(() => {})]),
          ),
          syncCommunityProfile(),
          syncPostpartum(me.pregnancyState),
          syncAiConsents(),
        ])
      })
      .catch(() => {
        // Refresh까지 만료면 인터셉터가 로그인 풂. 오프라인이면 기기 기록으로 계속 씀
      })
    // 열 때 한 번만. 로그인 방식이 바뀌는 건 로그인 화면에서 처리
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
