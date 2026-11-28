import { usePrimaryHospital } from '@/hooks/usePrimaryHospital'
import { useHospitalStore } from '@/stores/useHospitalStore'
import { useVisitStore } from '@/stores/useVisitStore'

// 다음 진료 일정의 병원. 일정에 병원이 없거나 목록에서 지웠으면 대표 병원
export function useVisitHospital() {
  const primary = usePrimaryHospital()
  const careSiteId = useVisitStore((state) => state.visitCareSiteId)
  const hospital = useHospitalStore((state) =>
    careSiteId ? state.hospitals.find((item) => item.id === careSiteId) : undefined,
  )
  return hospital
    ? { name: hospital.name, department: hospital.department ?? null, phone: hospital.phone ?? '' }
    : primary
}
