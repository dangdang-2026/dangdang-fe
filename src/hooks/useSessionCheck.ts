import { useEffect } from 'react'
import { getMe } from '@/api/me'
import { useAuthStore } from '@/stores/useAuthStore'
import { useProfileStore } from '@/stores/useProfileStore'

// 앱을 열 때 한 번 서버 로그인 확인. 스플래시 동안 뒤에서 돌아 기다리지 않음
export function useSessionCheck() {
  const method = useAuthStore((state) => state.account?.method)
  const updateProfile = useProfileStore((state) => state.updateProfile)

  useEffect(() => {
    // 카카오는 아직 목업이라 서버 세션 없음
    if (method !== 'email') return
    getMe()
      .then((me) => updateProfile({ name: me.displayName }))
      .catch(() => {
        // Refresh까지 만료면 인터셉터가 로그인 풂. 오프라인이면 기기 기록으로 계속 씀
      })
    // 열 때 한 번만. 로그인 방식이 바뀌는 건 로그인 화면에서 처리
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
