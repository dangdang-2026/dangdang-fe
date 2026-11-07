import { useCriteriaStore } from '@/stores/useCriteriaStore'
import { getCurrentCriteria } from '@/utils/criteria'

// 지금 적용 중인 병원 기준
export function useCriteria() {
  return useCriteriaStore((state) => getCurrentCriteria(state.versions))
}
