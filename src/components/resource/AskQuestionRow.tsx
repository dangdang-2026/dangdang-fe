import iconChevronMd from '@/assets/icons/postpartum/chevron-md.svg'
import iconPencil from '@/assets/icons/resources/pencil.svg'

type AskQuestionRowProps = {
  label: string
  onClick: () => void
}

// Figma C-13·C-16 물어볼 것에 적기 줄
function AskQuestionRow({ label, onClick }: AskQuestionRowProps) {
  return (
    <button
      type="button"
      className="bg-grey-50 rounded-key flex w-full items-center gap-2.5 py-3.5 pr-3.5 pl-4 text-left"
      onClick={onClick}
    >
      <img src={iconPencil} alt="" width={20} height={20} />
      <span className="text-grey-900 flex-1 text-sm leading-snug font-medium">{label}</span>
      <img src={iconChevronMd} alt="" width={16} height={16} />
    </button>
  )
}

export default AskQuestionRow
