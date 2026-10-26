type AuthorBadgeProps = {
  label: string
  // Best는 흰 바탕, 주수는 노란 바탕
  variant?: 'week' | 'best'
}

// Figma U-02 주수 배지 · Best 배지
function AuthorBadge({ label, variant = 'week' }: AuthorBadgeProps) {
  return (
    <span
      className={`text-caption text-grey-800 rounded-full border px-2 py-px font-bold ${
        variant === 'best' ? 'border-primary bg-white' : 'border-yellow-300 bg-yellow-50'
      }`}
    >
      {label}
    </span>
  )
}

export default AuthorBadge
