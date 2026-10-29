import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import iconCalendar from '@/assets/icons/hospital/calendar.svg'
import iconPhone from '@/assets/icons/hospital/phone.svg'
import iconInfo from '@/assets/icons/info-lg.svg'
import iconChevron from '@/assets/icons/postpartum/chevron-md.svg'
import iconPlus from '@/assets/icons/postpartum/plus.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import Toast from '@/components/common/Toast'
import HospitalDeleteSheet from '@/components/hospital/HospitalDeleteSheet'
import HospitalSheet from '@/components/hospital/HospitalSheet'
import { DEPARTMENTS, DEPARTMENT_CHIP, DEPARTMENT_NOTE } from '@/constants/hospital'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useHospitalStore } from '@/stores/useHospitalStore'
import { useVisitStore } from '@/stores/useVisitStore'
import type { Hospital, HospitalInfo } from '@/types/hospital'
import { objectParticle } from '@/utils/josa'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 예: 10/24 (금)
const formatVisitDay = (iso: string) => {
  const at = new Date(iso)
  return `${at.getMonth() + 1}/${at.getDate()} (${WEEKDAYS[at.getDay()]})`
}

type Sheet =
  | { mode: 'add'; info: HospitalInfo; manual: boolean }
  | { mode: 'edit'; hospital: Hospital; index: number }

// Figma C-14 다니는 병원 · 진료과. 첫 번째 병원이 홈·진료 탭의 대표 병원
function HospitalsPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.MY)
  const hospitals = useHospitalStore((state) => state.hospitals)
  const addHospital = useHospitalStore((state) => state.addHospital)
  const updateHospital = useHospitalStore((state) => state.updateHospital)
  const removeHospital = useHospitalStore((state) => state.removeHospital)
  const setDraft = useHospitalStore((state) => state.setDraft)
  const nextVisitAt = useVisitStore((state) => state.nextVisitAt)
  const setNextVisit = useVisitStore((state) => state.setNextVisit)

  // 병원 찾기에서 고르고 돌아오면 바로 추가 시트
  const [sheet, setSheet] = useState<Sheet | null>(() => {
    const draft = useHospitalStore.getState().draft
    return draft ? { mode: 'add', ...draft } : null
  })
  const [deleting, setDeleting] = useState<{ hospital: Hospital; index: number } | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])

  const closeSheet = () => {
    setSheet(null)
    setDraft(null)
  }

  // 대표 병원의 다음 진료일은 진료 탭과 같은 값
  const visitOf = (hospital: Hospital, index: number) =>
    index === 0 ? nextVisitAt : hospital.nextVisitAt

  const save = (input: Omit<Hospital, 'id'>) => {
    if (!sheet) return
    if (sheet.mode === 'add') {
      if (hospitals.length === 0) setNextVisit(input.nextVisitAt)
      addHospital(hospitals.length === 0 ? { ...input, nextVisitAt: null } : input)
      setToast(`${input.name}${objectParticle(input.name)} 추가했어요`)
    } else {
      if (sheet.index === 0) setNextVisit(input.nextVisitAt)
      updateHospital(sheet.hospital.id, sheet.index === 0 ? { ...input, nextVisitAt: null } : input)
      setToast('병원 정보를 고쳤어요')
    }
    closeSheet()
  }

  const confirmDelete = () => {
    if (!deleting) return
    // 대표 병원을 지우면 다음 병원이 대표가 되고 그 진료일을 이어받음
    if (deleting.index === 0) setNextVisit(hospitals[1]?.nextVisitAt ?? null)
    removeHospital(deleting.hospital.id)
    setDeleting(null)
    setToast('병원을 지웠어요')
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-30 break-keep">
      <SubPageHeader title="다니는 병원" onBack={goBack} />

      <div className="mt-3 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-hero text-grey-900">다니는 병원을 모두 적어 두세요</h2>
          <p className="text-grey-600 text-sm leading-relaxed">
            산부인과와 내분비내과를 함께 다니기도 해요. 병원마다 다음 진료일·연락처·리포트를 따로
            관리해요.
          </p>
        </div>

        {hospitals.map((hospital, index) => {
          const visit = visitOf(hospital, index)
          const note = DEPARTMENT_NOTE[hospital.department]
          return (
            <section
              key={hospital.id}
              className="border-grey-200 relative flex flex-col gap-2.5 rounded-2xl border p-4"
            >
              <button
                type="button"
                className="flex items-center gap-2 text-left after:absolute after:inset-0"
                onClick={() => setSheet({ mode: 'edit', hospital, index })}
              >
                <span
                  className={`text-grey-800 rounded-md px-2 py-0.5 text-xs leading-snug font-bold ${DEPARTMENT_CHIP[hospital.department]}`}
                >
                  {hospital.department}
                </span>
                <span className="text-grey-900 flex-1 text-base leading-snug font-bold">
                  {hospital.name}
                </span>
                <img src={iconChevron} alt="" width={16} height={16} />
              </button>
              {note && <p className="text-t7 text-grey-600">{note}</p>}
              <div className="text-body-3 text-grey-800 flex gap-4">
                <span className="flex items-center gap-1.5">
                  <img src={iconCalendar} alt="" width={16} height={16} />
                  {visit ? `다음 진료 ${formatVisitDay(visit)}` : '다음 진료일 미정'}
                </span>
                {hospital.phone && (
                  // 카드 전체를 누르는 버튼 위로 올림
                  <a href={`tel:${hospital.phone}`} className="relative flex items-center gap-1.5">
                    <img src={iconPhone} alt="" width={16} height={16} />
                    전화
                  </a>
                )}
              </div>
            </section>
          )
        })}

        <button
          type="button"
          className="bg-grey-50 text-t6 text-grey-800 flex items-center gap-2 rounded-2xl px-4 py-3.5 font-bold"
          onClick={() => navigate(ROUTES.MY_HOSPITAL_SEARCH)}
        >
          <img src={iconPlus} alt="" width={20} height={20} />
          병원 · 진료과 추가
        </button>

        <div className="flex gap-1.5">
          {DEPARTMENTS.map((department) => (
            <span
              key={department}
              className="bg-grey-100 text-grey-700 rounded-md px-2 py-0.5 text-xs leading-snug font-bold"
            >
              {department}
            </span>
          ))}
        </div>

        <p className="bg-grey-50 text-t7 text-grey-700 flex items-start gap-2 rounded-xl px-3.5 py-3 leading-relaxed">
          <img src={iconInfo} alt="" width={18} height={18} className="shrink-0" />
          어느 과에서 관리하는지는 병원마다 달라요. 출산 뒤에는 내분비내과에서 이어서 볼 수도
          있어요.
        </p>
      </div>

      {sheet?.mode === 'add' && (
        <HospitalSheet
          info={sheet.info}
          nextVisitAt={null}
          manual={sheet.manual}
          onSave={save}
          onClose={closeSheet}
        />
      )}
      {sheet?.mode === 'edit' && (
        <HospitalSheet
          editing
          info={sheet.hospital}
          department={sheet.hospital.department}
          nextVisitAt={visitOf(sheet.hospital, sheet.index)}
          manual={!sheet.hospital.address}
          onSave={save}
          onDelete={() => {
            setDeleting({ hospital: sheet.hospital, index: sheet.index })
            setSheet(null)
          }}
          onClose={closeSheet}
        />
      )}
      {deleting && (
        <HospitalDeleteSheet
          name={deleting.hospital.name}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default HospitalsPage
