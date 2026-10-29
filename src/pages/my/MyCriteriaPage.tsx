import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import iconEdit from '@/assets/icons/edit.svg'
import iconPhone from '@/assets/icons/phone.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import Toast from '@/components/common/Toast'
import ContactMemoSheet from '@/components/my/ContactMemoSheet'
import CriteriaCard from '@/components/visit/CriteriaCard'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { usePrimaryHospital } from '@/hooks/usePrimaryHospital'
import { useProfileStore, type CareMode } from '@/stores/useProfileStore'

const CARE_MODE_OPTIONS: { value: CareMode; label: string }[] = [
  { value: 'diet', label: '식사·운동' },
  { value: 'insulin', label: '인슐린 함께' },
  { value: 'oral', label: '먹는 약 함께' },
]

// Figma M-03 병원 기준 · 관리 모드. 기준 입력은 진료 탭 화면(C-09·C-10) 그대로 사용
function MyCriteriaPage() {
  const hospital = usePrimaryHospital()
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.MY)
  const { careMode, contactMemo, updateProfile } = useProfileStore()
  const [editingMemo, setEditingMemo] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])
  const closeMemo = useCallback(() => setEditingMemo(false), [])

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-30">
      <SubPageHeader title="병원 기준 · 관리 모드" onBack={goBack} />

      <div className="mt-3.5 flex flex-col gap-5.5">
        <CriteriaCard
          onChange={() => navigate(ROUTES.VISIT_CRITERIA)}
          onHistory={() => navigate(ROUTES.VISIT_CRITERIA_HISTORY)}
        />

        <section className="flex flex-col gap-2">
          <h2 className="text-grey-700 text-sm leading-normal font-bold">관리 모드</h2>
          <div className="bg-grey-100 flex gap-1 rounded-2xl p-1">
            {CARE_MODE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={careMode === value}
                className={`text-t6 flex-1 rounded-xl py-3 font-bold ${
                  careMode === value ? 'shadow-segment text-grey-900 bg-white' : 'text-grey-500'
                }`}
                onClick={() => {
                  if (careMode === value) return
                  updateProfile({ careMode: value })
                  setToast(`관리 모드를 바꿨어요 · ${label}`)
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-grey-500 text-xs leading-normal">
            ‘인슐린 함께’를 고르면 오늘 화면에 인슐린 기록 버튼이 생겨요. 투여 알림은 보내지 않아요.
            ‘먹는 약 함께’는 리포트 머리말에만 표시해요.
          </p>
        </section>

        <button
          type="button"
          className="bg-grey-50 rounded-banner flex flex-col gap-2 p-4.5 text-left"
          onClick={() => setEditingMemo(true)}
        >
          <span className="flex w-full items-center gap-2">
            <img src={iconPhone} alt="" width={18} height={18} />
            <span className="text-t6 text-grey-900 flex-1 font-bold">연락 기준 메모</span>
            <img src={iconEdit} alt="" width={16} height={16} />
          </span>
          <span
            className={`text-sm leading-normal font-medium ${contactMemo ? 'text-grey-800' : 'text-grey-400'}`}
          >
            {contactMemo ? `“${contactMemo}”` : '병원에 언제 연락하라고 들었는지 적어 두세요'}
          </span>
          <span className="text-t7 text-grey-500">{hospital.name} 외래</span>
        </button>
      </div>

      {editingMemo && (
        <ContactMemoSheet
          initialMemo={contactMemo}
          onSave={(memo) => {
            updateProfile({ contactMemo: memo })
            setEditingMemo(false)
            setToast('연락 기준 메모를 저장했어요')
          }}
          onClose={closeMemo}
        />
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default MyCriteriaPage
