import BottomSheet from '@/components/common/BottomSheet'

type RecordDeleteSheetProps = {
  onConfirm: () => void
  onClose: () => void
}

// Figma D-11 기록 삭제 확인
function RecordDeleteSheet({ onConfirm, onClose }: RecordDeleteSheetProps) {
  return (
    <BottomSheet label="기록 삭제 확인" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <h2 className="text-t4 text-grey-900">이 기록을 지울까요?</h2>
        <p className="text-t6 text-grey-700">
          지운 기록은 진료 리포트에서도 빠져요.
          <br />
          지운 뒤에는 되돌릴 수 없어요.
        </p>
      </div>
      <button
        type="button"
        className="text-subtitle-1 bg-primary mt-8.5 h-14 rounded-xl leading-none text-white"
        onClick={onConfirm}
      >
        지우기
      </button>
      <button type="button" className="text-grey-600 py-1 text-sm leading-normal" onClick={onClose}>
        취소
      </button>
    </BottomSheet>
  )
}

export default RecordDeleteSheet
