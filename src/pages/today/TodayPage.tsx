import { useCallback, useState } from 'react'
import Toast from '@/components/common/Toast'
import GlucoseInputSheet from '@/components/glucose/GlucoseInputSheet'
import TodayHeader from '@/components/today/TodayHeader'
import HeroCard from '@/components/today/HeroCard'
import NotificationBanner from '@/components/today/NotificationBanner'
import TodayRecordSection from '@/components/today/TodayRecordSection'
import { MOCK_USER } from '@/mocks/user'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import type { GlucoseRecord, MeasureTarget } from '@/types/glucose'
import { getMeasureTarget, getSlotLabel } from '@/utils/glucose'

function TodayPage() {
  const meals = useGlucoseStore((state) => state.meals)
  const records = useGlucoseStore((state) => state.records)
  const [sheetTarget, setSheetTarget] = useState<MeasureTarget | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const openGlucoseSheet = () => {
    setSheetTarget(getMeasureTarget(meals, records, MOCK_USER.postMealHours, new Date()))
  }
  const closeGlucoseSheet = useCallback(() => setSheetTarget(null), [])
  const closeToast = useCallback(() => setToast(null), [])

  const handleSaved = (record: GlucoseRecord) => {
    setSheetTarget(null)
    const label = getSlotLabel(record.slot, record.mealType, MOCK_USER.postMealHours)
    setToast(`${label} ${record.value} 저장했어요`)
  }

  return (
    <main className="px-5 pt-15.5">
      {/* 화면 전체 배경. 탭 바 뒤까지 채우도록 고정 */}
      <div
        aria-hidden
        className="to-bg-warm fixed inset-y-0 left-1/2 -z-10 w-full max-w-107.5 -translate-x-1/2 bg-linear-to-b from-yellow-50"
      />
      <TodayHeader name={MOCK_USER.name} date={new Date()} />
      <div className="mt-6">
        <HeroCard postMealHours={MOCK_USER.postMealHours} />
      </div>
      <div className="mt-4.5">
        <NotificationBanner />
      </div>
      <div className="mt-5.5">
        <TodayRecordSection count={0} onInputGlucose={openGlucoseSheet} />
      </div>

      {sheetTarget && (
        <GlucoseInputSheet target={sheetTarget} onClose={closeGlucoseSheet} onSaved={handleSaved} />
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default TodayPage
