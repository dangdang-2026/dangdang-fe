import TodayHeader from '@/components/today/TodayHeader'
import HeroCard from '@/components/today/HeroCard'
import NotificationBanner from '@/components/today/NotificationBanner'
import TodayRecordSection from '@/components/today/TodayRecordSection'
import { MOCK_USER } from '@/mocks/user'

function TodayPage() {
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
        <TodayRecordSection count={0} />
      </div>
    </main>
  )
}

export default TodayPage
