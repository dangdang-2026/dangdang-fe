import BottomSheet from '@/components/common/BottomSheet'
import DangdangAvatar from '@/components/common/DangdangAvatar'
import { getDirectionParticle } from '@/utils/meal'

type RestrictedSheetProps = {
  // 풀리는 날. null이면 운영자가 풀 때까지
  until: Date | null
  // 제한 사유 문구. 모르면 null
  reason: string | null
  // 이 제한에 이의 신청을 이미 했는지
  appealed: boolean
  onPolicy: () => void
  onAppeal: () => void
  onClose: () => void
}

// Figma U-17 이용 제한 중. 읽기·공감은 그대로
function RestrictedSheet({
  until,
  reason,
  appealed,
  onPolicy,
  onAppeal,
  onClose,
}: RestrictedSheetProps) {
  return (
    <BottomSheet label="이용 제한" onClose={onClose}>
      <div className="flex flex-col items-center gap-2 text-center">
        <DangdangAvatar variant="sorry" />
        <h2 className="text-t4 text-grey-900">
          {until
            ? `${until.getMonth() + 1}월 ${until.getDate()}일까지 글·댓글을 쓸 수 없어요`
            : '지금은 글·댓글을 쓸 수 없어요'}
        </h2>
        <p className="text-grey-600 text-sm leading-normal">
          {reason
            ? `‘${reason}’${getDirectionParticle(reason)} 가려진 글이`
            : '운영정책에 맞지 않는 글이'}
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
        {appealed ? (
          <span className="text-grey-400">이의 신청 접수됨</span>
        ) : (
          <button type="button" className="underline" onClick={onAppeal}>
            이의 신청하기
          </button>
        )}
      </p>
    </BottomSheet>
  )
}

export default RestrictedSheet
