type TargetFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  // 칸을 벗어날 때. 마이에서는 이때 저장
  onBlur?: () => void
}

// 목표 입력칸. 숫자만, 비우면 비교 안 함
function TargetField({ label, value, onChange, onBlur }: TargetFieldProps) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-2">
      <span className="text-t7 text-grey-700 font-bold">{label}</span>
      <span className="bg-grey-50 focus-within:border-primary flex h-14 items-center gap-2 rounded-2xl border-2 border-transparent px-4 focus-within:bg-white">
        <input
          type="text"
          inputMode="numeric"
          aria-label={`${label} 목표`}
          placeholder="비움"
          value={value}
          className="text-grey-900 placeholder:text-grey-400 min-w-0 flex-1 bg-transparent text-base leading-normal font-medium outline-none"
          onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 3))}
          onBlur={onBlur}
        />
        <span className="text-grey-500 text-sm leading-normal">미만</span>
      </span>
    </label>
  )
}

export default TargetField
