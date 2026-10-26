import iconGo from '@/assets/icons/community/go.svg'

type BoardNoticeProps = {
  title: string
  onClick: () => void
}

// Figma U-21 게시판 맨 위 공지 한 줄
function BoardNotice({ title, onClick }: BoardNoticeProps) {
  return (
    <button
      type="button"
      className="border-grey-100 flex w-full flex-col items-start gap-2 border-b py-4.5 text-left"
      onClick={onClick}
    >
      <span className="bg-grey-100 text-grey-700 rounded-md px-2 py-0.5 text-xs leading-snug font-medium">
        공지사항
      </span>
      <span className="text-grey-900 text-base leading-snug font-bold">{title}</span>
      <span className="text-t7 text-grey-500 flex items-center gap-0.5 leading-snug font-medium">
        보러가기
        <img src={iconGo} alt="" width={12} height={12} />
      </span>
    </button>
  )
}

export default BoardNotice
