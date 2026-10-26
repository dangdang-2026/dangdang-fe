type SwitchProps = {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}

// Figma toggle 50x30
function Switch({ checked, label, onChange }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative h-7.5 w-12.5 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-grey-300'
      }`}
      onClick={() => onChange(!checked)}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-6.5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  )
}

export default Switch
