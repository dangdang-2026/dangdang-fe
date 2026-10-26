import { useCallback, useState } from 'react'
import iconEdit from '@/assets/icons/edit.svg'
import WarmBackground from '@/components/common/WarmBackground'
import NextVisitCard from '@/components/visit/NextVisitCard'
import VisitDateSheet from '@/components/visit/VisitDateSheet'
import { useNow } from '@/hooks/useNow'
import { useVisitStore } from '@/stores/useVisitStore'
import { startOfDay } from '@/utils/date'
import { getVisitStatus } from '@/utils/visit'

type DateSheet = 'first' | 'edit' | null

function VisitPage() {
  const nextVisitAt = useVisitStore((state) => state.nextVisitAt)
  const asked = useVisitStore((state) => state.asked)
  const setNextVisit = useVisitStore((state) => state.setNextVisit)
  // 첫 진입이면 다음 진료일부터 물어봄
  const [dateSheet, setDateSheet] = useState<DateSheet>(() => (asked ? null : 'first'))

  const now = useNow()
  const status = getVisitStatus(nextVisitAt, now)

  const closeDateSheet = useCallback(() => {
    // 처음 묻기를 그냥 닫아도 다시 묻지 않음
    if (!asked) setNextVisit(null)
    setDateSheet(null)
  }, [asked, setNextVisit])

  const handleSave = (at: Date) => {
    setNextVisit(at.toISOString())
    setDateSheet(null)
  }

  const handleUnknown = () => {
    setNextVisit(null)
    setDateSheet(null)
  }

  return (
    <main className="px-5 pt-15.5">
      <WarmBackground />
      <header className="flex items-center justify-between">
        <h1 className="text-title-2 text-grey-900">진료</h1>
        <button
          type="button"
          aria-label="다음 진료일 고치기"
          className="shadow-icon-button flex size-10.5 items-center justify-center rounded-full bg-white"
          onClick={() => setDateSheet('edit')}
        >
          <img src={iconEdit} alt="" width={20} height={20} />
        </button>
      </header>

      <div className="mt-4">
        <NextVisitCard status={status} onEdit={() => setDateSheet('edit')} />
      </div>

      {dateSheet && (
        <VisitDateSheet
          editing={dateSheet === 'edit'}
          initialAt={status.kind === 'unknown' ? null : status.at}
          today={startOfDay(now)}
          onSave={handleSave}
          onUnknown={handleUnknown}
          onClose={closeDateSheet}
        />
      )}
    </main>
  )
}

export default VisitPage
