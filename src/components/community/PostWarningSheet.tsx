import iconAlert from '@/assets/icons/alert.svg'
import BottomSheet from '@/components/common/BottomSheet'
import { MOCK_HOSPITAL } from '@/mocks/hospital'
import type { PostWarning } from '@/utils/postCheck'

const CONTENT = {
  dose: {
    title: '약 용량 이야기가 들어 있어요',
    description:
      '용량은 사람마다 병원에서 정해 줘요. 이대로 올리면 다른 분이 따라 할 수 있어서 글이 가려질 수 있어요.',
    primary: '그 부분 빼고 고쳐 쓰기',
    secondary: '그대로 올리기',
  },
  urgent: {
    title: '지금은 병원에 먼저 연락해 주세요',
    description:
      '출혈이나 태동이 줄어든 느낌, 심한 통증은 글로 기다리지 말고 다니는 병원이나 분만실에 바로 연락하세요.',
    primary: `${MOCK_HOSPITAL.name}에 먼저 연락할게요`,
    secondary: '그래도 글 올리기',
  },
}

type PostWarningSheetProps = {
  warning: PostWarning
  // 고쳐 쓰기·병원에 연락: 올리지 않고 글쓰기로
  onBack: () => void
  onPostAnyway: () => void
}

// Figma U-15 약·용량 감지 · U-30 위급할 수 있는 말
function PostWarningSheet({ warning, onBack, onPostAnyway }: PostWarningSheetProps) {
  const content = CONTENT[warning.kind]

  return (
    <BottomSheet label={content.title} onClose={onBack}>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-t4 text-grey-900 flex items-center gap-2">
          <img src={iconAlert} alt="" width={20} height={20} />
          {content.title}
        </h2>
        <p className="text-grey-600 text-sm leading-normal">{content.description}</p>
      </div>
      <p className="text-t6 text-grey-900 rounded-xl bg-red-50 px-4 py-3.5 font-medium">
        “{warning.quote}”
      </p>
      <button
        type="button"
        className="bg-primary text-grey-900 rounded-key py-4 text-base leading-snug font-bold"
        onClick={onBack}
      >
        {content.primary}
      </button>
      {warning.kind === 'urgent' && (
        <p className="text-grey-500 text-center text-xs leading-normal">
          마음이 많이 힘들 땐 <a href="tel:109">109</a>(자살예방상담) ·{' '}
          <a href="tel:15770199">1577-0199</a>(정신건강 위기상담)
        </p>
      )}
      <button
        type="button"
        className="text-grey-600 self-center text-sm leading-snug font-medium underline"
        onClick={onPostAnyway}
      >
        {content.secondary}
      </button>
    </BottomSheet>
  )
}

export default PostWarningSheet
