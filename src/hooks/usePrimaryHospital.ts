import { useHospitalStore } from '@/stores/useHospitalStore'

// 대표 병원(첫 번째). 하나도 없으면 이름만 '다니는 병원'
export function usePrimaryHospital() {
  const hospital = useHospitalStore((state) => state.hospitals[0])
  return {
    name: hospital?.name ?? '다니는 병원',
    department: hospital?.department ?? null,
    phone: hospital?.phone ?? '',
  }
}
