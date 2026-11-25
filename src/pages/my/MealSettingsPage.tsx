import { useCallback, useState } from 'react'
import iconRadioOff from '@/assets/icons/my/radio-lg-off.svg'
import iconRadioOn from '@/assets/icons/my/radio-lg-on.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import Toast from '@/components/common/Toast'
import type { PortionUnit } from '@/api/mealSettings'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { saveMealSettings, useMealSettingsStore } from '@/stores/useMealSettingsStore'

const OPTIONS: { value: PortionUnit; title: string; description: string }[] = [
  { value: 'SERVING', title: '인분으로', description: '1인분, 반 공기처럼 · 외식이 많다면 편해요' },
  { value: 'GRAM', title: '그램으로', description: '저울로 잰 g · 병원 식단표가 g일 때' },
]

// Figma M-20 식사 기록 설정: 식사 시트가 처음 보여 줄 양 칸(인분 · 그램)
function MealSettingsPage() {
  const goBack = useGoBack(ROUTES.MY)
  const portionUnit = useMealSettingsStore((state) => state.portionUnit)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])

  const select = (value: PortionUnit) => {
    if (saving || value === portionUnit) return
    setSaving(true)
    saveMealSettings(value)
      .catch(() => setToast('설정을 저장하지 못했어요. 잠시 후 다시 시도해 주세요'))
      .finally(() => setSaving(false))
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-13 pb-[max(--spacing(12.5),env(safe-area-inset-bottom))] break-keep">
      <SubPageHeader title="식사 기록 설정" onBack={goBack} />

      <div className="mt-3 flex flex-col gap-4">
        <h2 className="text-grey-900 text-xl leading-snug font-bold">양을 어떻게 적을까요?</h2>
        <div
          role="radiogroup"
          aria-label="양 적는 방식"
          aria-busy={saving}
          className="border-grey-200 overflow-hidden rounded-2xl border"
        >
          {OPTIONS.map(({ value, title, description }, index) => {
            const selected = value === portionUnit
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`flex w-full items-center gap-3 py-3.5 pr-3.5 pl-4 text-left ${
                  index > 0 ? 'border-grey-100 border-t' : ''
                }`}
                onClick={() => select(value)}
              >
                <span className="flex flex-1 flex-col gap-0.5 leading-snug">
                  <span className="text-grey-900 text-body-2 leading-snug">{title}</span>
                  <span className="text-grey-600 text-xs leading-snug">{description}</span>
                </span>
                <img src={selected ? iconRadioOn : iconRadioOff} alt="" width={22} height={22} />
              </button>
            )
          })}
        </div>
        <p className="text-grey-700 text-body-3 p-3 leading-relaxed font-normal">
          식사 기록 화면이 처음 보여 줄 양 칸만 바뀌어요. 이미 저장한 기록은 그대로이고, 기록할 때
          언제든 다른 방식으로 바꿀 수 있어요.
        </p>
      </div>

      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default MealSettingsPage
