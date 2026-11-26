import type { StoreApi, UseBoundStore } from 'zustand'
import { useAiStore } from '@/stores/useAiStore'
import { useChatStore } from '@/stores/useChatStore'
import { useCommunityStore } from '@/stores/useCommunityStore'
import { useCriteriaStore } from '@/stores/useCriteriaStore'
import { useFoodStore } from '@/stores/useFoodStore'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import { useHospitalStore } from '@/stores/useHospitalStore'
import { useInboxStore } from '@/stores/useInboxStore'
import { useMealGuideStore } from '@/stores/useMealGuideStore'
import { useMealSettingsStore } from '@/stores/useMealSettingsStore'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { useVisitStore } from '@/stores/useVisitStore'
import { DEVICE_OWNER_KEY } from '@/utils/auth'

// 서버 번호가 없는 데모 계정의 주인 번호
export const DEMO_OWNER_ID = -1

// 다른 계정이 들어오면 비우는 저장소(첫 설정은 로그인 흐름, 리포트는 자체 주인 확인)
const ACCOUNT_STORES: UseBoundStore<StoreApi<object>>[] = [
  useGlucoseStore,
  useProfileStore,
  useCriteriaStore,
  useVisitStore,
  useHospitalStore,
  useMealGuideStore,
  useInboxStore,
  useFoodStore,
  useCommunityStore,
  useMealSettingsStore,
  useAiStore,
  useChatStore,
]

function getDeviceOwner() {
  try {
    const value = localStorage.getItem(DEVICE_OWNER_KEY)
    return value ? Number(value) : null
  } catch {
    return null
  }
}

function setDeviceOwner(userId: number) {
  try {
    localStorage.setItem(DEVICE_OWNER_KEY, String(userId))
  } catch {
    // 저장 못 하면 다음에 혈당을 받은 계정으로 판단
  }
}

// 기기 기록이 이 계정 것인지. 주인 칸 전 기기는 혈당을 받은 계정으로 판단
function ownsDevice(userId: number) {
  const owner = getDeviceOwner()
  if (owner !== null) return owner === userId
  const { syncedUserId } = useGlucoseStore.getState()
  return syncedUserId === null || syncedUserId === userId
}

// 앞 계정 기록을 처음 상태로(알림 권한 물어봤는지는 남김)
function resetAccountData() {
  ACCOUNT_STORES.forEach((store) => store.setState(store.getInitialState(), true))
  const { permissionAsked } = useNotificationStore.getState()
  useNotificationStore.setState(
    { ...useNotificationStore.getInitialState(), permissionAsked },
    true,
  )
}

// 기기 주인을 이 계정으로, 다른 계정 기록이면 먼저 비움
export function claimDevice(userId: number) {
  const owned = ownsDevice(userId)
  if (!owned) resetAccountData()
  setDeviceOwner(userId)
  return owned
}
