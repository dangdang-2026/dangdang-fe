import BottomSheet from '@/components/common/BottomSheet'
import DangdangAvatar from '@/components/common/DangdangAvatar'

type RestrictedSheetProps = {
  until: Date
  onPolicy: () => void
  onAppeal: () => void
  onClose: () => void
}

// Figma U-17 이용 제한 중. 읽기·공감은 그대로
function RestrictedSheet({ until, onPolicy, onAppeal, onClose }: RestrictedSheetProps) {
  return (
    <BottomSheet label="이용 제한" onClose={onClose}>
      <div className="flex flex-col items-center gap-2 text-center">
        <DangdangAvatar variant="sorry" />
        <h2 className="text-t4 text-grey-900">
          {until.getMonth() + 1}월 {until.getDate()}일까지 글·댓글을 쓸 수 없어요
        </h2>
        <p className="text-grey-600 text-sm leading-normal">
          ‘진단·처방, 약 이름·용량 권유’로 가려진 글이
          <br />
          여러 번 있었어요. 글 읽기와 공감은 그대로 할 수 있어요.
        </p>
      </div>
      <button
        type="button"
        className="bg-primary text-grey-900 rounded-key py-4 text-base leading-snug font-bold"
        onClick={onClose}
      >
        확인
      </button>
      <p className="text-grey-600 flex justify-center gap-5 text-sm leading-snug font-medium">
        <button type="button" className="underline" onClick={onPolicy}>
          운영정책 보기
        </button>
        <button type="button" className="underline" onClick={onAppeal}>
          이의 신청하기
        </button>
      </p>
    </BottomSheet>
  )
}

export default RestrictedSheet
