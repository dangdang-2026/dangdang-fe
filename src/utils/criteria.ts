import type { Criteria } from '@/types/criteria'

// 그 날짜에 적용되던 기준. 적용 전 날짜면 첫 버전
export function getCriteriaAt(versions: Criteria[], date: Date) {
  const applied = versions.filter((item) => new Date(item.appliedFrom) <= date)
  return applied.at(-1) ?? versions[0]
}

export function getCurrentCriteria(versions: Criteria[]) {
  return versions[versions.length - 1]
}
