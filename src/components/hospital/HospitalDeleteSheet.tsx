import BottomSheet from '@/components/common/BottomSheet'
import { objectParticle } from '@/utils/josa'

type HospitalDeleteSheetProps = {
  name: string
  onConfirm: () => void
  onClose: () => void
}

// Figma C-20 다니는 병원 지우기 확인. 기록·리포트는 남음
function HospitalDeleteSheet({ name, onConfirm, onClose }: HospitalDeleteSheetProps) {
  return (
    <BottomSheet label="병원 지우기" onClose={onClose}>
      <h2 className="text-t4 text-grey-900">
        {name}
        {objectParticle(name)} 지울까요?
      </h2>
      <p className="text-t6 text-grey-700">
        이 병원의 다음 진료일과 알림도 함께 지워져요.
        <br />
        남긴 혈당 기록과 만든 리포트는 그대로예요.
      </p>
      <button
        type="button"
        className="bg-primary rounded-key mt-4 py-4 text-base leading-snug font-bold text-white"
        onClick={onConfirm}
      >
        지우기
      </button>
      <button
        type="button"
        className="text-grey-600 self-center text-sm leading-snug font-medium"
        onClick={onClose}
      >
        취소
      </button>
    </BottomSheet>
  )
}

export default HospitalDeleteSheet
