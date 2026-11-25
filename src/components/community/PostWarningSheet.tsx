import iconAlert from '@/assets/icons/alert.svg'
import BottomSheet from '@/components/common/BottomSheet'
import { usePrimaryHospital } from '@/hooks/usePrimaryHospital'
import type { PostWarning } from '@/utils/postCheck'

// 병원이 없을 때 가까운 분만실을 찾는 곳. 중앙응급의료센터 응급의료포털
const FIND_DELIVERY_ROOM_URL = 'https://www.e-gen.or.kr'

const DOSE = {
  title: '약 용량 이야기가 들어 있어요',
  description:
    '용량은 사람마다 병원에서 정해 줘요. 이대로 올리면 다른 분이 따라 할 수 있어서 글이 가려질 수 있어요.',
  primary: '그 부분 빼고 고쳐 쓰기',
  secondary: '그대로 올리기',
}

const BIG_BUTTON = 'flex h-14 items-center justify-center text-base leading-snug font-bold'

type PostWarningSheetProps = {
  warning: PostWarning
  // 고쳐 쓰기 · 시트 닫기: 올리지 않고 글쓰기로
  onBack: () => void
  onPostAnyway: () => void
}

// Figma U-15 약·용량 감지
function DoseWarning({ warning, onBack, onPostAnyway }: PostWarningSheetProps) {
  return (
    <BottomSheet label={DOSE.title} onClose={onBack}>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-t4 text-grey-900 flex items-center gap-2">
          <img src={iconAlert} alt="" width={20} height={20} />
          {DOSE.title}
        </h2>
        <p className="text-grey-600 text-sm leading-normal">{DOSE.description}</p>
      </div>
      <p className="text-t6 text-grey-900 rounded-xl bg-red-50 px-4 py-3.5 font-medium">
        “{warning.quote}”
      </p>
      <button
        type="button"
        className="bg-primary text-grey-900 rounded-key py-4 text-base leading-snug font-bold"
        onClick={onBack}
      >
        {DOSE.primary}
      </button>
      <button
        type="button"
        className="text-grey-600 self-center text-sm leading-snug font-medium underline"
        onClick={onPostAnyway}
      >
        {DOSE.secondary}
      </button>
    </BottomSheet>
  )
}

// Figma U-30 위급할 수 있는 말 · U-30b 병원 미등록. 글을 올리기 전에 바로 전화로 이어 줌
function UrgentWarning({ warning, onBack, onPostAnyway }: PostWarningSheetProps) {
  const hospital = usePrimaryHospital()
  // 병원 번호가 없으면 119가 주 버튼
  const hasHospital = !!hospital.phone
  const title = hasHospital ? '지금은 병원에 먼저 연락해 주세요' : '지금은 119에 먼저 연락해 주세요'

  return (
    <BottomSheet label={title} onClose={onBack}>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl leading-snug font-bold text-red-700">{title}</h2>
        <p className="text-t6 text-grey-700 font-normal">
          출혈이나 태동이 줄어든 느낌, 심한 통증은
          <br />
          글로 기다리지 말고 바로 연락해 주세요.
        </p>
      </div>
      <p className="bg-grey-100 rounded-key text-grey-700 px-4 py-3.5 text-sm leading-normal">
        “{warning.quote}”
      </p>
      {hasHospital ? (
        <>
          <a
            href={`tel:${hospital.phone}`}
            className={`${BIG_BUTTON} bg-primary rounded-xl text-white`}
          >
            {hospital.name} 분만실에 전화
          </a>
          <a
            href="tel:119"
            className={`${BIG_BUTTON} rounded-2xl border border-red-500 bg-white text-red-700`}
          >
            119에 전화
          </a>
        </>
      ) : (
        <>
          <a href="tel:119" className={`${BIG_BUTTON} rounded-2xl bg-red-500 text-white`}>
            119에 전화
          </a>
          <a
            href={FIND_DELIVERY_ROOM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${BIG_BUTTON} border-grey-200 text-grey-900 rounded-2xl border bg-white`}
          >
            가까운 분만실 번호 찾기
          </a>
        </>
      )}
      <p className="text-grey-600 text-center text-sm leading-normal">
        마음이 많이 힘들 땐{' '}
        <a href="tel:109" className="font-bold text-blue-500 underline">
          109
        </a>
        {' · '}
        <a href="tel:15770199" className="font-bold text-blue-500 underline">
          1577-0199
        </a>
      </p>
      <button
        type="button"
        className="text-grey-600 h-11 self-center text-sm leading-snug font-medium"
        onClick={onPostAnyway}
      >
        그래도 글 올리기
      </button>
    </BottomSheet>
  )
}

function PostWarningSheet(props: PostWarningSheetProps) {
  return props.warning.kind === 'urgent' ? <UrgentWarning {...props} /> : <DoseWarning {...props} />
}

export default PostWarningSheet
