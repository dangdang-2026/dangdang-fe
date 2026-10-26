import type { PostSort } from '@/types/community'

const OPTIONS: { value: PostSort; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
]

type SortToggleProps = {
  value: PostSort
  onChange: (value: PostSort) => void
}

// 최신순 | 인기순. 고른 쪽만 진하게
function SortToggle({ value, onChange }: SortToggleProps) {
  return (
    <div className="text-t7 flex items-center gap-2 leading-snug">
      {OPTIONS.map((option, index) => (
        <span key={option.value} className="flex items-center gap-2">
          {index > 0 && <span aria-hidden className="bg-grey-200 h-2.5 w-px" />}
          <button
            type="button"
            aria-pressed={value === option.value}
            className={
              value === option.value ? 'text-grey-900 font-bold' : 'text-grey-400 font-medium'
            }
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        </span>
      ))}
    </div>
  )
}

export default SortToggle
