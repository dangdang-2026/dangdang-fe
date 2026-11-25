import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import iconEdit from '@/assets/icons/edit.svg'
import iconGuideEdit from '@/assets/icons/meal-guide/edit.svg'
import iconUtensils from '@/assets/icons/meal-guide/utensils.svg'
import iconPhone from '@/assets/icons/phone.svg'
import ConfirmSheet from '@/components/common/ConfirmSheet'
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
import { saveCriteria } from '@/stores/useCriteriaStore'
import { useMealGuideStore } from '@/stores/useMealGuideStore'
import { useProfileStore, type CareMode } from '@/stores/useProfileStore'
import type { MeasureSlotKey } from '@/types/criteria'
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

// 예: 10/14 ○○산부인과 · 사진 1장
function formatGuideMeta(receivedOn: string, place: string, hasPhoto: boolean) {
  const [, month, day] = receivedOn.split('-').map(Number)
  return [`${month}/${day}${place ? ` ${place}` : ''}`, hasPhoto && '사진 1장']
    .filter(Boolean)
    .join(' · ')
}

// 예: 1시간, 아직 모르면 모름
const formatHours = (hours: number | null) => (hours ? formatDuration(hours) : '모름')
// 비우면 비교 안 함
const formatTarget = (value: number | null) => (value === null ? '비교 안 함' : `${value}`)

// Figma M-03 병원 기준 · 관리 모드 · M-03b 저장 확인. 측정 시점 · 재는 때 · 목표는 모아서 저장(진료 탭 이력에 남음)
function MyCriteriaPage() {
  const hospital = usePrimaryHospital()
  const navigate = useNavigate()
  const mealGuide = useMealGuideStore((state) => state.guide)
  const goBack = useGoBack(ROUTES.MY)
  const criteria = useCriteria()
  const { careMode, contactMemo, updateProfile } = useProfileStore()
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  // 저장 전까지 고친 값
  const [hours, setHours] = useState(criteria.postMealHours)
  const [slots, setSlots] = useState(criteria.measureSlots)
  const [fasting, setFasting] = useState(String(criteria.targets.fasting ?? ''))
  const [postMeal, setPostMeal] = useState(String(criteria.targets.postMeal ?? ''))
  const [editingMemo, setEditingMemo] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])
  const closeMemo = useCallback(() => setEditingMemo(false), [])

  const appliedFrom = new Date(criteria.appliedFrom)
  const postMealLabel = hours ? `식후 ${formatDuration(hours)}` : '식후'
  const targetsValid = isValidTarget(fasting) && isValidTarget(postMeal)
  const targets = { fasting: toTarget(fasting), postMeal: toTarget(postMeal) }
  const hoursChanged = hours !== criteria.postMealHours
  const slotsChanged = slots.join() !== criteria.measureSlots.join()
  const fastingChanged = targets.fasting !== criteria.targets.fasting
  const postMealChanged = targets.postMeal !== criteria.targets.postMeal
  const changed = hoursChanged || slotsChanged || fastingChanged || postMealChanged

  // 확인 시트 요약. 예: 식후 측정 1시간 → 2시간
  const summary = [
    hoursChanged && {
      label: '식후 측정',
      value: `${formatHours(criteria.postMealHours)} → ${formatHours(hours)}`,
    },
    slotsChanged && {
      label: '재는 때',
      value: slots.map((key) => MEASURE_SLOT_LABEL[key]).join(' · '),
    },
    fastingChanged && {
      label: '공복 목표',
      value: `${formatTarget(criteria.targets.fasting)} → ${formatTarget(targets.fasting)} mg/dL 미만`,
    },
    postMealChanged && {
      label: '식후 목표',
      value: `${formatTarget(criteria.targets.postMeal)} → ${formatTarget(targets.postMeal)} mg/dL 미만`,
    },
  ].filter((row) => !!row)
  const today = new Date()
  const notes = [
    hoursChanged &&
      (hours
        ? `· 알림이 식사 시작 ${formatDuration(hours)} 뒤로 바뀌어요`
        : '· 식후 측정 알림은 보내지 않아요'),
    `· ${today.getMonth() + 1}월 ${today.getDate()}일 기록부터 새 기준으로 세요`,
  ].filter(Boolean)

  // 같은 날 다시 바꾸면 그날 버전을 덮어씀. 저장 중엔 이전 기준 위에 겹쳐 저장하지 않게 막음
  const save = async () => {
    if (saving) return
    setSaving(true)
    try {
      await saveCriteria({
        source: '마이에서 직접 입력',
        postMealHours: hours,
        measureSlots: slots,
        targets,
      })
      setConfirming(false)
      setToast('병원 기준을 바꿨어요 · 진료 탭 이력에 남아요')
    } catch {
      setToast('기준을 저장하지 못했어요. 잠시 후 다시 시도해 주세요')
    } finally {
      setSaving(false)
    }
  }

  const toggleSlot = (key: MeasureSlotKey) => {
    const next = slots.includes(key) ? slots.filter((item) => item !== key) : [...slots, key]
    if (next.length === 0) {
      setToast('재는 때를 하나 이상 골라 주세요')
      return
    }
    setSlots(MEASURE_SLOT_ORDER.filter((item) => next.includes(item)))
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-30">
      <SubPageHeader title="병원 기준 · 관리 모드" onBack={goBack} />

      <div className="mt-3.5 flex flex-col gap-5.5">
        <section className="flex flex-col gap-2">
          <h2 className="text-grey-700 text-sm leading-normal font-bold">측정 시점</h2>
          <PostMealTimeSegment value={hours} onChange={setHours} />
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-grey-700 text-sm leading-normal font-bold">재는 때</h2>
          <div className="flex flex-wrap gap-2">
            {MEASURE_SLOT_ORDER.map((key) => (
              <FoodChip
                key={key}
                name={MEASURE_SLOT_LABEL[key]}
                selected={slots.includes(key)}
                onClick={() => toggleSlot(key)}
              />
            ))}
          </div>
          <p className="text-grey-600 text-xs leading-normal">
            병원에서 재라고 한 때만 켜 두면 그때만 알려 드려요
          </p>
          {slots.includes('fasting') && (
            <FastingTimeRow
              onChanged={(time) => setToast(`공복 알림을 ${formatAlarmTime(time)}로 바꿨어요`)}
              onFailed={() =>
                setToast('공복 알림 시각을 저장하지 못했어요. 잠시 후 다시 시도해 주세요')
              }
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
            <TargetField label="공복" value={fasting} onChange={setFasting} />
            <TargetField label={postMealLabel} value={postMeal} onChange={setPostMeal} />
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

        {/* Figma M-03 내 식사 안내 카드 → M-15 */}
        <button
          type="button"
          className="bg-grey-50 rounded-banner flex flex-col gap-2 p-4.5 text-left"
          onClick={() => navigate(ROUTES.MY_MEAL_GUIDE)}
        >
          <span className="flex w-full items-center gap-2">
            <img src={iconUtensils} alt="" width={18} height={18} />
            <span className="text-t6 text-grey-900 flex-1 font-bold">내 식사 안내</span>
            <img src={iconGuideEdit} alt="" width={16} height={16} />
          </span>
          <span className="text-grey-800 text-sm leading-normal font-medium">
            영양 상담에서 받은 안내를 적어 두는 곳이에요
          </span>
          {mealGuide && (
            <span className="text-t7 text-grey-700">
              {formatGuideMeta(mealGuide.receivedOn, mealGuide.place, !!mealGuide.photo)}
            </span>
          )}
        </button>
      </div>

      {/* 측정 시점 · 재는 때 · 목표를 바꾸기 전엔 비활성 */}
      <div className="sticky bottom-0 -mx-5 mt-8 bg-white px-5 pt-3 pb-[max(--spacing(7),env(safe-area-inset-bottom))]">
        <button
          type="button"
          disabled={!changed || !targetsValid}
          className="text-subtitle-1 bg-primary disabled:bg-grey-100 disabled:text-grey-400 h-14 w-full rounded-xl leading-none font-bold text-white"
          onClick={() => setConfirming(true)}
        >
          저장
        </button>
      </div>

      {confirming && (
        <ConfirmSheet
          title="바꾼 내용을 저장할까요?"
          summary={summary}
          description={notes.join('\n')}
          confirmLabel="저장"
          loading={saving}
          onConfirm={() => void save()}
          onClose={() => setConfirming(false)}
        />
      )}
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
