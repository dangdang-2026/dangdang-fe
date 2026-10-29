import type { ReactNode } from 'react'
import iconCheckDark from '@/assets/icons/check-dark.svg'

type ChoiceChipProps = {
  selected: boolean
  onClick: () => void
  children: ReactNode
}

// Figma E-08·E-09 고르기 칩: 고르면 노랑 + 체크
function ChoiceChip({ selected, onClick, children }: ChoiceChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`flex items-center gap-1 rounded-full border px-3.5 py-2 text-sm leading-snug ${
        selected
          ? 'bg-primary text-grey-900 border-transparent font-bold'
          : 'border-grey-200 text-grey-800 bg-white font-medium'
      }`}
      onClick={onClick}
    >
      {selected && <img src={iconCheckDark} alt="" width={14} height={14} />}
      {children}
    </button>
  )
}

export default ChoiceChip
