import ConfirmSheet from '@/components/common/ConfirmSheet'
import { objectParticle } from '@/utils/josa'

type HospitalDeleteSheetProps = {
  name: string
  onConfirm: () => void
  onClose: () => void
}

// Figma C-20 다니는 병원 지우기 확인. 함께 지워지는 것 · 남는 것
function HospitalDeleteSheet({ name, onConfirm, onClose }: HospitalDeleteSheetProps) {
  return (
    <ConfirmSheet
      title={`${name}${objectParticle(name)} 지울까요?`}
      summary={[
        { label: '함께 지워져요', value: '다음 진료일 · 진료 알림' },
        { label: '그대로 남아요', value: '혈당 기록 · 만든 리포트' },
      ]}
      description={'연락 기준 메모에 적은 전화번호와\n내 식사 안내의 ‘받은 곳’은 그대로 남아요.'}
      confirmLabel="지우기"
      danger
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
}

export default HospitalDeleteSheet
