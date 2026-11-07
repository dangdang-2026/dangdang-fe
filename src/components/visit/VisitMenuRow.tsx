import iconChevronRight from '@/assets/icons/chevron-right.svg'

type VisitMenuRowProps = {
  icon: string
  // 강조 행은 노란 원, 보조 행은 회색 원
  primary?: boolean
  title: string
  description?: string
  onClick?: () => void
}

// Figma C-02 진료 탭 카드 안 한 줄 메뉴
function VisitMenuRow({ icon, primary, title, description, onClick }: VisitMenuRowProps) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 py-0.5 text-left"
      onClick={onClick}
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
          primary ? 'bg-yellow-50' : 'bg-grey-100'
        }`}
      >
        <img src={icon} alt="" width={20} height={20} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={`text-grey-900 font-bold ${primary ? 'text-base leading-normal' : 'text-t6'}`}
        >
          {title}
        </span>
        {description && <span className="text-t7 text-grey-500">{description}</span>}
      </span>
      <img src={iconChevronRight} alt="" width={18} height={18} />
    </button>
  )
}

export default VisitMenuRow
