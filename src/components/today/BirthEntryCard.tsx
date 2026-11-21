import iconChevronRight from '@/assets/icons/chevron-right.svg'

type BirthEntryCardProps = {
  onOpen: () => void
}

// Figma H-14 출산 예정일 가까움: 입원·출산 시트로 가는 입구
function BirthEntryCard({ onOpen }: BirthEntryCardProps) {
  return (
    <button
      type="button"
      className="bg-grey-50 flex w-full items-center gap-2.5 rounded-2xl py-3.5 pr-3.5 pl-4 text-left"
      onClick={onOpen}
    >
      <span className="flex flex-1 flex-col gap-0.5 leading-snug">
        <span className="text-grey-900 text-t6 leading-snug font-bold">
          입원하거나 출산하셨나요?
        </span>
        <span className="text-grey-700 text-t7 leading-snug">
          누르면 측정 알림을 바로 멈출 수 있어요
        </span>
      </span>
      <img src={iconChevronRight} alt="" width={18} height={18} />
    </button>
  )
}

export default BirthEntryCard
