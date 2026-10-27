import iconAgreeCheck from '@/assets/icons/onboarding/agree-check.svg'
import iconAgreeCheckLg from '@/assets/icons/onboarding/agree-check-lg.svg'

type CheckCircleProps = {
  checked: boolean
  // 모두 동의는 26px, 항목은 22px
  size?: 'md' | 'lg'
}

// Figma A-01 동의 동그라미. 켜지면 노란 원 + 체크
function CheckCircle({ checked, size = 'md' }: CheckCircleProps) {
  const lg = size === 'lg'
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full border-2 ${
        lg ? 'size-6.5' : 'size-5.5'
      } ${checked ? 'bg-primary border-primary' : 'border-grey-300 bg-white'}`}
    >
      {checked && (
        <img
          src={lg ? iconAgreeCheckLg : iconAgreeCheck}
          alt=""
          width={lg ? 15.6 : 13.2}
          height={lg ? 15.6 : 13.2}
        />
      )}
    </span>
  )
}

export default CheckCircle
