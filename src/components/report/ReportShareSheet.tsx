import iconDownload from '@/assets/icons/download.svg'
import iconEyeOff from '@/assets/icons/eye-off.svg'
import iconPrinter from '@/assets/icons/printer.svg'
import iconShareYellow from '@/assets/icons/share-yellow.svg'
import iconShield from '@/assets/icons/shield-md.svg'
import BottomSheet from '@/components/common/BottomSheet'
import VisitMenuRow from '@/components/visit/VisitMenuRow'

type ReportShareSheetProps = {
  hideName: boolean
  onToggleHideName: () => void
  onSavePhoto: () => void
  // PDF · 인쇄는 브라우저 인쇄 창 하나로
  onPrint: () => void
  onShare: () => void
  onClose: () => void
}

// Figma C-07 리포트 전하기. 사진 · PDF는 기기에서 만들어 고른 곳으로만
function ReportShareSheet({
  hideName,
  onToggleHideName,
  onSavePhoto,
  onPrint,
  onShare,
  onClose,
}: ReportShareSheetProps) {
  return (
    <BottomSheet label="리포트 전하기" onClose={onClose}>
      <h2 className="text-t4 text-grey-900">리포트를 어떻게 전할까요?</h2>

      <div className="-my-2 flex flex-col">
        <div className="px-1 py-3.5">
          <VisitMenuRow
            icon={iconDownload}
            primary
            title="사진으로 저장"
            description="사진첩에서 바로 꺼내 보여 줄 수 있어요"
            onClick={onSavePhoto}
          />
        </div>
        <div className="px-1 py-3.5">
          <VisitMenuRow
            icon={iconPrinter}
            primary
            title="PDF · 인쇄"
            description="종이나 파일을 받는 병원에 내요"
            onClick={onPrint}
          />
        </div>
        <div className="px-1 py-3.5">
          <VisitMenuRow
            icon={iconShareYellow}
            primary
            title="공유하기"
            description="카카오톡·메일 등 내가 고른 곳으로만 보내요"
            onClick={onShare}
          />
        </div>
        <div className="flex items-center gap-3 px-1 py-3.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-yellow-50">
            <img src={iconEyeOff} alt="" width={20} height={20} />
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-grey-900 text-base leading-normal font-bold">
              리포트에서 이름 가리기
            </span>
            <span className="text-t7 text-grey-500">가족 등 병원 밖으로 보낼 때 이름을 빼요</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={hideName}
            aria-label="리포트에서 이름 가리기"
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              hideName ? 'bg-primary' : 'bg-grey-300'
            }`}
            onClick={onToggleHideName}
          >
            <span
              className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow-sm transition-transform ${
                hideName ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </div>

      <p className="bg-grey-50 rounded-key flex items-center gap-2 px-3.5 py-3">
        <img src={iconShield} alt="" width={16} height={16} />
        <span className="text-body-3 text-grey-700">
          사진 · PDF는 기기에서 만들어 내가 고른 곳으로만 보내요.
          <br />
          사진첩에 저장하면 휴대폰 백업에 함께 올라갈 수 있어요.
        </span>
      </p>

      <button
        type="button"
        className="bg-grey-100 text-grey-600 h-14 rounded-xl text-sm leading-normal"
        onClick={onClose}
      >
        닫기
      </button>
    </BottomSheet>
  )
}

export default ReportShareSheet
