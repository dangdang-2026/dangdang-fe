import DangdangAvatar from '@/components/common/DangdangAvatar'

type CommunityEmptyProps = {
  variant: 'front' | 'sorry'
  title: string
  description: string
  action: { icon?: string; label: string; onClick: () => void }
}

// Figma U-05 글 없음 · U-07 검색 결과 없음 · U-08 불러오지 못함
function CommunityEmpty({ variant, title, description, action }: CommunityEmptyProps) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-5 py-9 text-center">
      <DangdangAvatar variant={variant} />
      <p className="text-subtitle-1 text-grey-900 tracking-normal">{title}</p>
      <p className="text-grey-600 text-sm leading-relaxed whitespace-pre-line">{description}</p>
      <button
        type="button"
        className="bg-primary text-grey-900 flex items-center gap-1.5 rounded-full py-2.5 pr-4.5 pl-4 text-sm leading-snug font-bold"
        onClick={action.onClick}
      >
        {action.icon && <img src={action.icon} alt="" width={16} height={16} />}
        {action.label}
      </button>
    </div>
  )
}

export default CommunityEmpty
