type SwitchProps = {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
  // 작은 토글 40x24. 예: 카메라 사진첩 저장
  small?: boolean
}

// Figma toggle 50x30 · 작은 토글 40x24
function Switch({ checked, label, onChange, small = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative shrink-0 rounded-full transition-colors ${small ? 'h-6 w-10' : 'h-7.5 w-12.5'} ${
        checked ? 'bg-primary' : 'bg-grey-300'
      }`}
      onClick={() => onChange(!checked)}
    >
      <span
        className={`absolute top-0.5 left-0.5 rounded-full bg-white shadow-sm transition-transform ${
          small ? 'size-5' : 'size-6.5'
        } ${checked ? (small ? 'translate-x-4' : 'translate-x-5') : ''}`}
      />
    </button>
  )
}

export default Switch
