type AuthorBadgeProps = {
  label: string
  // Best는 흰 바탕, 주수는 노란 바탕, 산후는 파란 바탕
  variant?: 'week' | 'best'
}

// Figma U-02 주수 배지 · Best 배지
function AuthorBadge({ label, variant = 'week' }: AuthorBadgeProps) {
  return (
    <span
      className={`text-caption rounded-full border px-2 py-px font-bold ${
        variant === 'best'
          ? 'border-primary text-grey-800 bg-white'
          : label.startsWith('산후')
            ? 'border-blue-50 bg-blue-50 text-blue-700'
            : 'text-grey-800 border-yellow-300 bg-yellow-50'
      }`}
    >
      {label}
    </span>
  )
}

export default AuthorBadge
