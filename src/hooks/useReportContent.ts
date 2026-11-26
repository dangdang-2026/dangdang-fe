import { usePrimaryHospital } from '@/hooks/usePrimaryHospital'
import { useCriteriaStore } from '@/stores/useCriteriaStore'
import { useHospitalStore } from '@/stores/useHospitalStore'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { getCriteriaAt } from '@/utils/criteria'
import { formatMonthDay } from '@/utils/date'
import { formatPregnancyRange } from '@/utils/pregnancy'
import { buildReport, formatCriteria, type ReportMissed } from '@/utils/report'

type ReportContentParams = {
  from: Date
  to: Date
  // 병원 밖으로 보낼 때 이름 빼기
  hideName?: boolean
  // 보여 줄 병원(C-25에서 고름). 없으면 대표 병원
  hospitalName?: string
  // 고른 병원 번호. 이름이 같은 병원이 있어도 그 병원으로
  hospitalId?: string | null
  // 서버 리포트 빈칸(놓친 측정 알림). 없으면 기기 기록으로 셈
  missed?: ReportMissed | null
}

// 진료 리포트(C-06)·내 기록 PDF(M-07) 공통 내용: 집계 + 제목 + 기간 + 기준 줄
export function useReportContent({
  from,
  to,
  hideName = false,
  hospitalName,
  hospitalId,
  missed,
}: ReportContentParams) {
  const primary = usePrimaryHospital()
  // 고른 병원을 병원 목록에서 찾음. 이름만 남고 목록에 없으면(지움 · 이름 바뀜) 그 이름 그대로, 안 골랐으면 대표 병원
  const chosen = useHospitalStore((state) =>
    hospitalId
      ? state.hospitals.find((item) => item.id === hospitalId)
      : state.hospitals.find((item) => item.name === hospitalName),
  )
  const hospital = chosen
    ? { name: chosen.name, department: chosen.department ?? null, phone: chosen.phone ?? '' }
    : hospitalName !== undefined
      ? // 지운 병원 리포트는 이름이 비어 옴
        { name: hospitalName || '다니던 병원', department: null, phone: '' }
      : primary
  const records = useGlucoseStore((state) => state.records)
  const meals = useGlucoseStore((state) => state.meals)
  const versions = useCriteriaStore((state) => state.versions)
  const name = useProfileStore((state) => state.name)
  const dueDate = useProfileStore((state) => state.dueDate)

  const report = buildReport({ records, meals, from, to, versions, missed })
  const pregnancy = formatPregnancyRange(dueDate, from, to)
  const periodLabel = `${formatMonthDay(from)} – ${formatMonthDay(to)}${pregnancy ? ` · ${pregnancy}` : ''}`
  const title = hideName || !name ? '혈당 기록' : `${name} 님 혈당 기록`
  // 기준 줄은 마지막 날 기준
  const { targets, postMealHours } = getCriteriaAt(versions, to)
  const criteria = formatCriteria(targets, postMealHours)
  const criteriaLines = [
    criteria ? `기준: ${criteria}` : '기준: 적은 목표가 없어 비교하지 않았어요',
    `${hospital.name} 안내 · 본인 입력`,
  ]

  return { report, title, periodLabel, criteriaLines, hospital }
}
