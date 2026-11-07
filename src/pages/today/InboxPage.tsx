import { useNavigate } from 'react-router'
import iconEditGrey from '@/assets/icons/edit-grey.svg'
import iconCalendarOff from '@/assets/icons/notification/calendar-off.svg'
import iconCalendarOn from '@/assets/icons/notification/calendar-on.svg'
import iconDropOff from '@/assets/icons/notification/drop-off.svg'
import iconDropOn from '@/assets/icons/notification/drop-on.svg'
import iconEditOn from '@/assets/icons/notification/edit-on.svg'
import iconStethOff from '@/assets/icons/notification/steth-off.svg'
import iconStethOn from '@/assets/icons/notification/steth-on.svg'
import iconUnread from '@/assets/icons/notification/unread.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import WarmBackground from '@/components/common/WarmBackground'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useNow } from '@/hooks/useNow'
import { useInboxStore } from '@/stores/useInboxStore'
import type { InboxItem, InboxType } from '@/types/notification'
import { diffInDays, formatTime } from '@/utils/date'

// 안 읽음은 노란 아이콘, 읽음은 회색
const ICON: Record<InboxType, { on: string; off: string }> = {
  measure: { on: iconDropOn, off: iconDropOff },
  visitBefore: { on: iconStethOn, off: iconStethOff },
  visitToday: { on: iconStethOn, off: iconStethOff },
  visitNote: { on: iconEditOn, off: iconEditGrey },
  postpartum: { on: iconCalendarOn, off: iconCalendarOff },
}

// 누르면 가는 곳. 측정 알림은 홈에서 혈당 입력 시트를 바로 엶
const TARGET: Record<InboxType, { to: string; state?: object }> = {
  measure: { to: ROUTES.TODAY, state: { openGlucose: true } },
  visitBefore: { to: ROUTES.VISIT_REPORT },
  visitToday: { to: ROUTES.VISIT_REPORT },
  visitNote: { to: ROUTES.VISIT_NOTE },
  postpartum: { to: ROUTES.POSTPARTUM_CHECK },
}

const getGroupLabel = (daysAgo: number) =>
  daysAgo === 0 ? '오늘' : daysAgo === 1 ? '어제' : '이전'

type InboxRowProps = {
  item: InboxItem
  onOpen: () => void
}

function InboxRow({ item, onOpen }: InboxRowProps) {
  const unread = !item.readAt

  return (
    <button
      type="button"
      className="border-grey-100 flex w-full items-start gap-3 border-t py-3.5 text-left first:border-t-0"
      onClick={onOpen}
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
          unread ? 'bg-yellow-50' : 'bg-grey-100'
        }`}
      >
        <img
          src={unread ? ICON[item.type].on : ICON[item.type].off}
          alt=""
          width={20}
          height={20}
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={`text-t6 ${unread ? 'text-grey-900 font-bold' : 'text-grey-700 font-medium'}`}
        >
          {item.title}
        </span>
        {item.body && <span className="text-t7 text-grey-600">{item.body}</span>}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-grey-600 text-xs leading-normal">
          {formatTime(new Date(item.sentAt))}
        </span>
        {unread && <img src={iconUnread} alt="안 읽음" width={6} height={6} />}
      </span>
    </button>
  )
}

// Figma H-15 알림함. 받은 알림을 오늘·어제로 묶어 보기
function InboxPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.TODAY)
  const now = useNow()
  const items = useInboxStore((state) => state.items)
  const markRead = useInboxStore((state) => state.markRead)

  const groups: { label: string; items: InboxItem[] }[] = []
  for (const item of items) {
    const label = getGroupLabel(diffInDays(new Date(item.sentAt), now))
    const group = groups.find((entry) => entry.label === label)
    if (group) group.items.push(item)
    else groups.push({ label, items: [item] })
  }

  const handleOpen = (item: InboxItem) => {
    markRead(item.id)
    const { to, state } = TARGET[item.type]
    navigate(to, { state })
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 px-5 pt-13 pb-10">
      <WarmBackground />
      <SubPageHeader title="알림" onBack={goBack} />

      {groups.length === 0 ? (
        <div className="mt-40 flex flex-col items-center gap-1.5 text-center">
          <p className="text-t6 text-grey-900 font-bold">받은 알림이 없어요</p>
          <p className="text-t7 text-grey-600">측정·진료 알림이 오면 여기에 모아 둘게요</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.label} className="flex flex-col gap-2.5">
              <h2 className="text-grey-700 text-sm leading-normal font-bold">{group.label}</h2>
              <div className="rounded-banner flex flex-col bg-white px-4.5 py-1.5">
                {group.items.map((item) => (
                  <InboxRow key={item.id} item={item} onOpen={() => handleOpen(item)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}

export default InboxPage
