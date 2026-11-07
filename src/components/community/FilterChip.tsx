import { useState } from 'react'
import iconCheckYellow from '@/assets/icons/community/check-yellow.svg'
import iconFilterCaret from '@/assets/icons/community/filter-caret.svg'
import BottomSheet from '@/components/common/BottomSheet'

type FilterChipProps<T extends string> = {
  title: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

// Figma U-23 기간·대상 필터. 누르면 고르는 시트
function FilterChip<T extends string>({ title, value, options, onChange }: FilterChipProps<T>) {
  const [open, setOpen] = useState(false)
  const current = options.find((option) => option.value === value)

  return (
    <>
      <button
        type="button"
        aria-label={`${title}: ${current?.label}`}
        className="border-grey-200 text-grey-800 flex items-center gap-1.5 rounded-full border py-2 pr-3 pl-4 text-sm leading-snug font-medium"
        onClick={() => setOpen(true)}
      >
        {current?.label}
        <img src={iconFilterCaret} alt="" width={14} height={14} />
      </button>
      {open && (
        <BottomSheet label={title} onClose={() => setOpen(false)}>
          <h2 className="text-t4 text-grey-900">{title}</h2>
          <ul className="flex flex-col">
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  aria-pressed={option.value === value}
                  className={`flex w-full items-center justify-between py-3.5 text-base leading-snug ${
                    option.value === value ? 'text-grey-900 font-bold' : 'text-grey-700'
                  }`}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  {option.label}
                  {option.value === value && (
                    <img src={iconCheckYellow} alt="" width={16} height={16} />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </BottomSheet>
      )}
    </>
  )
}

export default FilterChip
