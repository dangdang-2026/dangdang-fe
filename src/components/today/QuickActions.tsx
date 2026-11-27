import iconDrop from '@/assets/icons/quick/drop.svg'
import iconFile from '@/assets/icons/quick/file.svg'
import iconInsulin from '@/assets/icons/quick/insulin.svg'
import iconList from '@/assets/icons/quick/list.svg'
import iconPhone from '@/assets/icons/quick/phone.svg'

type QuickActionsProps = {
  // 인슐린 모드면 마지막 칸이 연락 메모 대신 인슐린
  insulinMode: boolean
  onInputGlucose: () => void
  onOpenRecords: () => void
  onOpenReport: () => void
  onInsulin: () => void
  onContactMemo: () => void
}

// Figma E-01·H-13 오늘 바로가기 네 칸
function QuickActions({
  insulinMode,
  onInputGlucose,
  onOpenRecords,
  onOpenReport,
  onInsulin,
  onContactMemo,
}: QuickActionsProps) {
  const actions = [
    { icon: iconDrop, label: '혈당 입력', onClick: onInputGlucose },
    // 기록 탭이 빠져서 기록 화면은 여기로
    { icon: iconList, label: '기록', onClick: onOpenRecords },
    { icon: iconFile, label: '리포트', onClick: onOpenReport },
    insulinMode
      ? { icon: iconInsulin, label: '인슐린', onClick: onInsulin }
      : { icon: iconPhone, label: '연락 메모', onClick: onContactMemo },
  ]

  return (
    // 양옆을 살짝 들여 칸 사이를 좁힘
    <nav aria-label="바로가기" className="flex justify-between px-4">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          className="text-grey-700 flex flex-col items-center gap-2 text-xs leading-normal font-medium"
          onClick={action.onClick}
        >
          <span className="shadow-quick rounded-full bg-white p-4">
            <img src={action.icon} alt="" width={24} height={24} />
          </span>
          {action.label}
        </button>
      ))}
    </nav>
  )
}

export default QuickActions
