import iconMenuDelete from '@/assets/icons/community/menu-delete.svg'
import iconMenuEdit from '@/assets/icons/community/menu-edit.svg'
import iconMenuHide from '@/assets/icons/community/menu-hide.svg'
import iconMenuLink from '@/assets/icons/community/menu-link.svg'
import iconMenuReport from '@/assets/icons/community/menu-report.svg'
import BottomSheet from '@/components/common/BottomSheet'

type MenuItem = { icon: string; label: string; danger?: boolean; onClick: () => void }

type PostMoreSheetProps = {
  mine: boolean
  onEdit: () => void
  onDelete: () => void
  onReport: () => void
  onBlock: () => void
  onCopyLink: () => void
  onClose: () => void
}

// Figma U-10 내 글 더보기 · U-11 다른 사람 글 더보기
function PostMoreSheet({
  mine,
  onEdit,
  onDelete,
  onReport,
  onBlock,
  onCopyLink,
  onClose,
}: PostMoreSheetProps) {
  const items: MenuItem[] = mine
    ? [
        { icon: iconMenuEdit, label: '수정하기', onClick: onEdit },
        { icon: iconMenuDelete, label: '삭제하기', danger: true, onClick: onDelete },
      ]
    : [
        { icon: iconMenuReport, label: '신고하기', danger: true, onClick: onReport },
        { icon: iconMenuHide, label: '이 사람 글 안 보기', onClick: onBlock },
        { icon: iconMenuLink, label: '링크 복사', onClick: onCopyLink },
      ]

  return (
    <BottomSheet label="더보기" onClose={onClose}>
      <ul className="-mt-6 flex flex-col gap-2">
        {items.map(({ icon, label, danger, onClick }) => (
          <li key={label}>
            <button
              type="button"
              className={`flex w-full items-center gap-3 py-3.5 pl-1 text-base leading-snug font-medium ${
                danger ? 'text-red-500' : 'text-grey-900'
              }`}
              onClick={onClick}
            >
              <img src={icon} alt="" width={22} height={22} />
              {label}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="bg-grey-100 text-grey-800 rounded-key py-4 text-base leading-snug font-bold"
        onClick={onClose}
      >
        닫기
      </button>
    </BottomSheet>
  )
}

export default PostMoreSheet
