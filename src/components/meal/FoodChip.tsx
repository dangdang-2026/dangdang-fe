import iconCheckDark from '@/assets/icons/check-dark.svg'

type FoodChipProps = {
  name: string
  selected: boolean
  onClick: () => void
}

// Figma F-01 음식 칩. 고르면 노란 배경 + 체크
function FoodChip({ name, selected, onClick }: FoodChipProps) {
  const color = selected
    ? 'bg-primary border-primary text-grey-900'
    : 'border-grey-200 text-grey-700 bg-white'

  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`flex items-center gap-1 rounded-full border-2 px-3.5 py-2 text-sm leading-normal font-bold ${color}`}
      onClick={onClick}
    >
      {selected && <img src={iconCheckDark} alt="" width={14} height={14} />}
      {name}
    </button>
  )
}

export default FoodChip
