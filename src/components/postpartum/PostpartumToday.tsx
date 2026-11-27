import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import iconChevron from '@/assets/icons/nav-next.svg'
import iconArchive from '@/assets/icons/postpartum/archive-lg.svg'
import iconChevronMd from '@/assets/icons/postpartum/chevron-md.svg'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Toast from '@/components/common/Toast'
import WarmBackground from '@/components/common/WarmBackground'
import CheckScheduleCard from '@/components/postpartum/CheckScheduleCard'
import CheckTaskCard from '@/components/postpartum/CheckTaskCard'
import RemindLaterSheet from '@/components/postpartum/RemindLaterSheet'
import TodayHeader from '@/components/today/TodayHeader'
import PostpartumHero from '@/components/today/hero/PostpartumHero'
import { ROUTES } from '@/constants/routes'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import {
  graduatePostpartum,
  saveRemindLater,
  syncPostpartumHome,
  useProfileStore,
} from '@/stores/useProfileStore'
import { useReportStore } from '@/stores/useReportStore'
import {
  diffInDays,
  formatMonthDay,
  isSameDay,
  parseDateKey,
  startOfDay,
  toDateKey,
} from '@/utils/date'
import type { PostpartumCheck } from '@/stores/useProfileStore'
import { getPendingCheck } from '@/utils/postpartum'

type PostpartumTodayProps = {
  name: string
  // YYYY-MM-DD
  deliveryDate: string
  now: Date
}

// 예: 산후 3주 · 10월 14일 출산. 첫 주는 날로
function formatSinceDelivery(deliveryDate: Date, now: Date) {
  const days = diffInDays(deliveryDate, now)
  const since = days <= 0 ? '오늘' : days < 7 ? `산후 ${days}일` : `산후 ${Math.floor(days / 7)}주`
  return `${since} · ${formatMonthDay(deliveryDate)} 출산`
}

// 검사 당일 「준비했어요」를 누른 검사. 그날은 검사 일정 카드(결과 적기)로
const PREPARED_KEY = 'dangdang-postpartum-prepared'

function readPrepared(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(PREPARED_KEY) ?? '[]')
    return Array.isArray(saved) ? saved.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

// 오늘이 검사일이고 아직 준비 확인 전인 검사
function getCheckToday(check: PostpartumCheck | null, prepared: string[], now: Date) {
  if (!check || prepared.includes(check.id)) return null
  const date = parseDateKey(check.date)
  return date && isSameDay(date, now) ? check : null
}

function writePrepared(ids: string[]) {
  try {
    localStorage.setItem(PREPARED_KEY, JSON.stringify(ids))
  } catch {
    // 저장 못 하면 이번에만 넘어감
  }
}

// Figma E-07 오늘 · 산후 모드 · E-10 검사 일정 등록 뒤: 히어로(또는 검사 카드) + 할 일 + 보관함
function PostpartumToday({ name, deliveryDate, now }: PostpartumTodayProps) {
  const navigate = useNavigate()
  const checkRemindAt = useProfileStore((state) => state.checkRemindAt)
  const pendingCheck = getPendingCheck(useProfileStore((state) => state.postpartumChecks))
  const reportCount = useReportStore((state) => state.reports.length)
  const recordCount = useGlucoseStore((state) => state.records.length)
  const [remindSheet, setRemindSheet] = useState(false)
  const [prepared, setPrepared] = useState(() => readPrepared())
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = () => setToast(null)
  const [finishing, setFinishing] = useState(false)
  const [graduating, setGraduating] = useState(false)
  const closeFinish = () => setFinishing(false)

  // 산후 홈에 들어올 때 다른 기기에서 바꾼 출산일 · 다시 물어볼 날을 반영. 실패하면 기기 값 그대로
  useEffect(() => {
    syncPostpartumHome().catch(() => {})
  }, [])

  const delivered = parseDateKey(deliveryDate) ?? now
  const remindAt = parseDateKey(checkRemindAt)
  // 다시 물어볼 날 전까지는 할 일 카드를 숨김
  const showCheckTask = !remindAt || remindAt <= startOfDay(now)
  const archiveSummary = `리포트 ${reportCount}장 · 기록 ${recordCount}개`
  // Figma E-05d 검사 당일엔 준비 확인 카드부터
  const checkToday = getCheckToday(pendingCheck, prepared, now)

  const markPrepared = (id: string) => {
    const next = prepared.includes(id) ? prepared : [...prepared, id]
    setPrepared(next)
    writePrepared(next)
    setToast('검사 잘 다녀오세요')
  }

  // 산후 관리 마치기 = 서버 졸업. 마치면 산후 홈 · 검사 일정을 못 써서 확인 뒤 진행
  const finishPostpartum = () => {
    if (graduating) return
    setGraduating(true)
    graduatePostpartum()
      .then((graduation) =>
        navigate(ROUTES.POSTPARTUM_GRADUATION, { replace: true, state: { graduation } }),
      )
      .catch(() => {
        setFinishing(false)
        setGraduating(false)
        setToast('산후 관리를 마치지 못했어요. 잠시 후 다시 시도해 주세요')
      })
  }

  // 두 화면 공통 맨 아래: 산후 관리 마치기 · 확인창 · 토스트
  const footer = (
    <>
      <button
        type="button"
        className="text-grey-500 mx-auto mt-6 block text-sm leading-normal underline"
        onClick={() => setFinishing(true)}
      >
        산후 관리 마치기
      </button>
      {finishing && (
        <ConfirmDialog
          title="산후 관리를 마칠까요?"
          description="산후 검사 일정과 알림도 함께 끝나요. 마친 뒤에는 되돌릴 수 없어요."
          confirmLabel="마치기"
          onConfirm={finishPostpartum}
          onClose={closeFinish}
        />
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </>
  )

  // E-10 일정을 적은 뒤엔 흰 바탕에 검사 일정 카드 + 테두리 보관함
  if (pendingCheck && !checkToday) {
    return (
      <div className="pt-4">
        <header className="flex flex-col gap-5.5">
          <p className="text-body-3 text-grey-600">{formatSinceDelivery(delivered, now)}</p>
          <h1 className="text-title-2 text-grey-900 leading-snug">
            {name ? `${name}님, 몸은 좀 어떠세요?` : '몸은 좀 어떠세요?'}
          </h1>
        </header>
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
        <button
          type="button"
          className="border-grey-200 mt-5.5 flex w-full items-center gap-3 rounded-2xl border py-4 pr-4 pl-4.5 text-left"
          onClick={() => navigate(ROUTES.RECORDS)}
        >
          <img src={iconArchive} alt="" width={22} height={22} />
          <span className="flex flex-1 flex-col gap-0.5 leading-snug">
            <span className="text-t6 text-grey-900 leading-snug font-bold">
              임신 중 기록 보관함
            </span>
            <span className="text-t7 text-grey-600 leading-snug">{archiveSummary}</span>
          </span>
          <img src={iconChevronMd} alt="" width={16} height={16} />
        </button>
        {footer}
      </div>
    )
  }

  return (
    <>
      <WarmBackground />
      <TodayHeader
        name={name}
        date={now}
        pregnancyLabel={formatSinceDelivery(delivered, now)}
        greeting="몸은 좀 어떠세요?"
        showBell={false}
      />

      <div className="mt-6">
        <PostpartumHero onOpenSettings={() => navigate(ROUTES.MY_NOTIFICATIONS)} />
      </div>

      {checkToday ? (
        <CheckTaskCard
          title="오늘 산후 검사"
          description={<p className="text-t7 text-grey-600">병원 안내대로 준비했나요?</p>}
          primary={{ label: '준비했어요', onClick: () => markPrepared(checkToday.id) }}
          secondary={{
            label: '검사 날짜 바꿀게요',
            onClick: () => navigate(`${ROUTES.POSTPARTUM_CHECK}?id=${checkToday.id}`),
          }}
        />
      ) : (
        showCheckTask && (
          <CheckTaskCard
            title="산후 혈당 검사일 적어 두기"
            description={
              <>
                <p className="text-t7 text-grey-600">많은 병원이 출산 후 4~12주에 해요</p>
                <button
                  type="button"
                  className="text-t7 self-start font-medium text-blue-600"
                  onClick={() => navigate(ROUTES.POSTPARTUM_GUIDE)}
                >
                  병원에 물어보세요 ›
                </button>
              </>
            }
            primary={{ label: '날짜 입력', onClick: () => navigate(ROUTES.POSTPARTUM_CHECK) }}
            secondary={{ label: '다시 물어볼 날 고르기', onClick: () => setRemindSheet(true) }}
          />
        )
      )}

      <button
        type="button"
        className="mt-4.5 flex w-full items-center gap-3 rounded-3xl bg-white p-4.5 text-left"
        onClick={() => navigate(ROUTES.RECORDS)}
      >
        <img src={iconArchive} alt="" width={22} height={22} />
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-t6 text-grey-800 font-bold">임신 중 기록 보관함</span>
          <span className="text-t7 text-grey-600">{archiveSummary}</span>
        </span>
        <img src={iconChevron} alt="" width={18} height={18} />
      </button>

      {remindSheet && (
        <RemindLaterSheet
          onConfirm={(date) => {
            setRemindSheet(false)
            saveRemindLater(toDateKey(date))
              .then(() => setToast(`${formatMonthDay(date)}에 다시 물어볼게요`))
              .catch(() =>
                setToast('다시 물어볼 날을 저장하지 못했어요. 잠시 후 다시 시도해 주세요'),
              )
          }}
          onClose={() => setRemindSheet(false)}
        />
      )}
      {footer}
    </>
  )
}

export default PostpartumToday
