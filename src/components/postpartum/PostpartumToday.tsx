import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import iconChevron from '@/assets/icons/nav-next.svg'
import iconArchive from '@/assets/icons/postpartum/archive-lg.svg'
import iconCalendar from '@/assets/icons/postpartum/calendar.svg'
import Toast from '@/components/common/Toast'
import CheckScheduleCard from '@/components/postpartum/CheckScheduleCard'
import RemindLaterSheet from '@/components/postpartum/RemindLaterSheet'
import TodayHeader from '@/components/today/TodayHeader'
import PostpartumHero from '@/components/today/hero/PostpartumHero'
import { ROUTES } from '@/constants/routes'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { useReportStore } from '@/stores/useReportStore'
import { diffInDays, formatMonthDay, parseDateKey, startOfDay, toDateKey } from '@/utils/date'
import { getPendingCheck } from '@/utils/postpartum'

type PostpartumTodayProps = {
  name: string
  // YYYY-MM-DD
  deliveryDate: string
  now: Date
}

// 예: 출산 3주. 첫 주는 날로
function formatSinceDelivery(deliveryDate: Date, now: Date) {
  const days = diffInDays(deliveryDate, now)
  if (days <= 0) return '출산한 날'
  return days < 7 ? `출산 ${days}일` : `출산 ${Math.floor(days / 7)}주`
}

// Figma E-07 오늘 · 산후 모드 · E-10 검사 일정 등록 뒤: 히어로(또는 검사 카드) + 할 일 + 보관함
function PostpartumToday({ name, deliveryDate, now }: PostpartumTodayProps) {
  const navigate = useNavigate()
  const checkRemindAt = useProfileStore((state) => state.checkRemindAt)
  const pendingCheck = getPendingCheck(useProfileStore((state) => state.postpartumChecks))
  const updateProfile = useProfileStore((state) => state.updateProfile)
  const reportCount = useReportStore((state) => state.reports.length)
  const recordCount = useGlucoseStore((state) => state.records.length)
  const [remindSheet, setRemindSheet] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])

  const delivered = parseDateKey(deliveryDate) ?? now
  const remindAt = parseDateKey(checkRemindAt)
  // 다시 물어볼 날 전까지는 할 일 카드를 숨김
  const showCheckTask = !remindAt || remindAt <= startOfDay(now)

  return (
    <>
      <TodayHeader
        name={name}
        date={now}
        pregnancyLabel={formatSinceDelivery(delivered, now)}
        greeting="몸은 좀 어떠세요?"
        showBell={false}
      />

      {/* 일정을 적었으면 히어로 대신 검사 일정 카드 */}
      {pendingCheck ? (
        <div className="mt-5.5">
          <CheckScheduleCard
            check={pendingCheck}
            now={now}
            onWriteResult={() =>
              navigate(`${ROUTES.POSTPARTUM_CHECK_RESULT}?id=${pendingCheck.id}`)
            }
            onChangeDate={() => navigate(`${ROUTES.POSTPARTUM_CHECK}?id=${pendingCheck.id}`)}
          />
        </div>
      ) : (
        <div className="mt-6">
          <PostpartumHero onOpenSettings={() => navigate(ROUTES.MY_NOTIFICATIONS)} />
        </div>
      )}

      {!pendingCheck && showCheckTask && (
        <section className="rounded-hero shadow-task mt-4.5 flex flex-col gap-3.5 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-yellow-50 p-3">
              <img src={iconCalendar} alt="" width={22} height={22} />
            </span>
            <div className="flex flex-col gap-0.5">
              <h2 className="text-grey-900 text-base leading-normal font-bold">
                산후 혈당 검사일 적어 두기
              </h2>
              <p className="text-t7 text-grey-600">병원에서 들은 날짜만 적어요</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="bg-grey-900 h-12 flex-1 rounded-xl text-base leading-none font-bold text-white"
              onClick={() => navigate(ROUTES.POSTPARTUM_CHECK)}
            >
              날짜 입력
            </button>
            <button
              type="button"
              className="bg-grey-100 text-grey-900 h-12 flex-1 rounded-xl text-base leading-none font-bold"
              onClick={() => setRemindSheet(true)}
            >
              다시 물어볼 날 고르기
            </button>
          </div>
        </section>
      )}

      <button
        type="button"
        className="mt-4.5 flex w-full items-center gap-3 rounded-3xl bg-white p-4.5 text-left"
        onClick={() => navigate(ROUTES.RECORDS)}
      >
        <img src={iconArchive} alt="" width={22} height={22} />
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-t6 text-grey-800 font-bold">임신 중 기록 보관함</span>
          <span className="text-t7 text-grey-600">
            리포트 {reportCount}장 · 기록 {recordCount}개
          </span>
        </span>
        <img src={iconChevron} alt="" width={18} height={18} />
      </button>

      {remindSheet && (
        <RemindLaterSheet
          onConfirm={(date) => {
            updateProfile({ checkRemindAt: toDateKey(date) })
            setRemindSheet(false)
            setToast(`${formatMonthDay(date)}에 다시 물어볼게요`)
          }}
          onClose={() => setRemindSheet(false)}
        />
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </>
  )
}

export default PostpartumToday
