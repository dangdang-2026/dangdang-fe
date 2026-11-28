import iconDown from '@/assets/icons/arrow-down.svg'

type CalendarToggleProps = {
  expanded: boolean
  onClick: () => void
}

// Figma 당당/달력 펼치기 · 접기. 칩은 27px, 누르는 영역은 44px
function CalendarToggle({ expanded, onClick }: CalendarToggleProps) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      className="flex h-11 items-center self-center"
      onClick={onClick}
    >
      <span
        className={`bg-grey-100 text-body-3 flex items-center gap-0.5 rounded-full py-1 pr-2.5 pl-2 font-medium ${
          expanded ? 'text-grey-700' : 'text-grey-400'
        }`}
      >
        {expanded ? '접기' : '달력 펼쳐보기'}
        <img
          src={iconDown}
          alt=""
          width={14}
          height={14}
          className={expanded ? 'rotate-180' : undefined}
        />
      </span>
    </button>
  )
}

export default CalendarToggle
