import { useGlucoseStore } from '@/stores/useGlucoseStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { DEVICE_OWNER_KEY } from '@/utils/auth'

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

// 기기 기록이 이 계정 것인지. 주인을 적기 전 기기는 혈당을 받은 계정, 그것도 없으면 이 계정 것으로 봄
function ownsDevice(userId: number) {
  const owner = getDeviceOwner()
  if (owner !== null) return owner === userId
  const { syncedUserId } = useGlucoseStore.getState()
  return syncedUserId === null || syncedUserId === userId
}

// 기기 주인을 이 계정으로. 다른 계정 기록이면 혈당 · 임신 정보를 먼저 비움. 이 계정 것이었는지 돌려줌
export function claimDevice(userId: number) {
  const owned = ownsDevice(userId)
  if (!owned) {
    useGlucoseStore.setState({
      meals: [],
      records: [],
      deletedRecords: [],
      insulins: [],
      syncedUserId: null,
      insulinSyncedUserId: null,
    })
    useProfileStore.getState().updateProfile({
      dueDate: null,
      diagnosisDate: null,
      careMode: 'diet',
      contactMemo: '',
      careSyncedUserId: null,
      deliveryDate: null,
      checkRemindAt: null,
      postpartumChecks: [],
    })
  }
  setDeviceOwner(userId)
  return owned
}
