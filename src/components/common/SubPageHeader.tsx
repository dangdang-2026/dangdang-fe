import iconBack from '@/assets/icons/back.svg'

type SubPageHeaderProps = {
  title: string
  onBack: () => void
}

// 탭 바 없는 화면 머리: 뒤로 + 가운데 제목
function SubPageHeader({ title, onBack }: SubPageHeaderProps) {
  return (
    <header className="relative flex h-14 items-center">
      <button type="button" aria-label="뒤로" onClick={onBack}>
        <img src={iconBack} alt="" width={24} height={24} />
      </button>
      <h1 className="text-subtitle-1 text-grey-900 absolute left-1/2 -translate-x-1/2">{title}</h1>
    </header>
  )
}

export default SubPageHeader
