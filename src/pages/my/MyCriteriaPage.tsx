import { useCallback, useState } from 'react'
import iconEdit from '@/assets/icons/edit.svg'
import iconPhone from '@/assets/icons/phone.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import Toast from '@/components/common/Toast'
import FastingTimeRow from '@/components/criteria/FastingTimeRow'
import PostMealTimeSegment from '@/components/criteria/PostMealTimeSegment'
import TargetField from '@/components/criteria/TargetField'
import FoodChip from '@/components/meal/FoodChip'
import ContactMemoSheet from '@/components/my/ContactMemoSheet'
import { GLUCOSE_MAX, GLUCOSE_MIN } from '@/constants/glucose'
import { ROUTES } from '@/constants/routes'
import { useCriteria } from '@/hooks/useCriteria'
import { useGoBack } from '@/hooks/useGoBack'
import { usePrimaryHospital } from '@/hooks/usePrimaryHospital'
import { useCriteriaStore } from '@/stores/useCriteriaStore'
import { useProfileStore, type CareMode } from '@/stores/useProfileStore'
import type { Criteria, MeasureSlotKey } from '@/types/criteria'
import {
  MEASURE_SLOT_LABEL,
  MEASURE_SLOT_ORDER,
  formatAlarmTime,
  formatDuration,
  isValidTarget,
  toTarget,
} from '@/utils/criteria'

const CARE_MODE_OPTIONS: { value: CareMode; label: string }[] = [
  { value: 'diet', label: '식사·운동' },
  { value: 'insulin', label: '인슐린 함께' },
  { value: 'oral', label: '먹는 약 함께' },
]

type CriteriaChanges = Partial<Pick<Criteria, 'postMealHours' | 'measureSlots' | 'targets'>>

// Figma M-03 병원 기준 · 관리 모드. 바꾸면 바로 새 기준으로 저장(진료 탭 이력에 남음)
function MyCriteriaPage() {
  const hospital = usePrimaryHospital()
  const goBack = useGoBack(ROUTES.MY)
  const criteria = useCriteria()
  const addCriteria = useCriteriaStore((state) => state.addCriteria)
  const { careMode, contactMemo, updateProfile } = useProfileStore()
  const [fasting, setFasting] = useState(String(criteria.targets.fasting ?? ''))
  const [postMeal, setPostMeal] = useState(String(criteria.targets.postMeal ?? ''))
  const [editingMemo, setEditingMemo] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])
  const closeMemo = useCallback(() => setEditingMemo(false), [])

  const appliedFrom = new Date(criteria.appliedFrom)
  const postMealLabel = criteria.postMealHours
    ? `식후 ${formatDuration(criteria.postMealHours)}`
    : '식후'
  const targetsValid = isValidTarget(fasting) && isValidTarget(postMeal)

  // 같은 날 다시 바꾸면 그날 버전을 덮어씀(useCriteriaStore)
  const save = (changes: CriteriaChanges) => {
    addCriteria({
      source: '마이에서 직접 입력',
      postMealHours: criteria.postMealHours,
      measureSlots: criteria.measureSlots,
      targets: criteria.targets,
      ...changes,
    })
    setToast('병원 기준을 바꿨어요 · 진료 탭 이력에 남아요')
  }

  const toggleSlot = (key: MeasureSlotKey) => {
    const next = criteria.measureSlots.includes(key)
      ? criteria.measureSlots.filter((item) => item !== key)
      : [...criteria.measureSlots, key]
    if (next.length === 0) {
      setToast('재는 때를 하나 이상 골라 주세요')
      return
    }
    save({ measureSlots: MEASURE_SLOT_ORDER.filter((item) => next.includes(item)) })
  }

  // 칸을 벗어날 때 바뀐 목표만 저장
  const saveTargets = () => {
    if (!targetsValid) return
    const targets = { fasting: toTarget(fasting), postMeal: toTarget(postMeal) }
    if (
      targets.fasting === criteria.targets.fasting &&
      targets.postMeal === criteria.targets.postMeal
    ) {
      return
    }
    save({ targets })
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-30">
      <SubPageHeader title="병원 기준 · 관리 모드" onBack={goBack} />

      <div className="mt-3.5 flex flex-col gap-5.5">
        <section className="flex flex-col gap-2">
          <h2 className="text-grey-700 text-sm leading-normal font-bold">측정 시점</h2>
          <PostMealTimeSegment
            value={criteria.postMealHours}
            onChange={(hours) => {
              if (hours !== criteria.postMealHours) save({ postMealHours: hours })
            }}
          />
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-grey-700 text-sm leading-normal font-bold">재는 때</h2>
          <div className="flex flex-wrap gap-2">
            {MEASURE_SLOT_ORDER.map((key) => (
              <FoodChip
                key={key}
                name={MEASURE_SLOT_LABEL[key]}
                selected={criteria.measureSlots.includes(key)}
                onClick={() => toggleSlot(key)}
              />
            ))}
          </div>
          <p className="text-grey-600 text-xs leading-normal">
            병원에서 재라고 한 때만 켜 두면 그때만 알려 드려요
          </p>
          {criteria.measureSlots.includes('fasting') && (
            <FastingTimeRow
              onChanged={(time) => setToast(`공복 알림을 ${formatAlarmTime(time)}로 바꿨어요`)}
            />
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="flex items-center gap-1.5">
            <span className="text-grey-700 text-sm leading-normal font-bold">목표</span>
            <span className="text-grey-600 text-xs leading-normal font-normal">
              비워 두면 비교하지 않아요
            </span>
          </h2>
          <div className="flex gap-2.5">
            <TargetField label="공복" value={fasting} onChange={setFasting} onBlur={saveTargets} />
            <TargetField
              label={postMealLabel}
              value={postMeal}
              onChange={setPostMeal}
              onBlur={saveTargets}
            />
          </div>
          {targetsValid ? (
            <p className="text-grey-600 text-xs leading-normal">
              {criteria.version > 1
                ? `${appliedFrom.getMonth() + 1}/${appliedFrom.getDate()} 진료 때 들은 대로 내가 입력`
                : '병원에서 들은 대로 내가 입력'}{' '}
              · 바꾸면 진료 탭 기준 이력에 남아요
            </p>
          ) : (
            <p className="text-t7 text-red-500">
              {GLUCOSE_MIN}~{GLUCOSE_MAX} 사이 숫자인지 확인해 주세요
            </p>
          )}
        </section>

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
          <span className="text-t7 text-grey-500">
            {hospital.name} 외래{hospital.phone && ` ${hospital.phone}`}
          </span>
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
