import iconCheckOff from '@/assets/icons/auth/check-off.svg'
import iconCheck from '@/assets/icons/auth/check.svg'
import iconCross from '@/assets/icons/auth/cross.svg'
import { checkPassword } from '@/utils/auth'

const RULES = [
  { key: 'length', label: '8자 이상' },
  { key: 'mix', label: '영문·숫자 포함' },
] as const

type PasswordChecksProps = {
  password: string
  // 다음을 누른 뒤엔 안 맞는 항목만 빨간색
  submitted: boolean
}

// Figma 입력/비밀번호 조건: 맞으면 초록 체크, 아직이면 회색, 제출 후 안 맞으면 빨간 X
function PasswordChecks({ password, submitted }: PasswordChecksProps) {
  const checks = checkPassword(password)

  return (
    <p className="text-body-3 flex gap-3">
      {RULES.map(({ key, label }) => {
        const met = checks[key]
        const failed = !met && submitted
        return (
          <span
            key={key}
            className={`flex items-center gap-0.5 ${
              met ? 'text-green-500' : failed ? 'text-red-500' : 'text-grey-500'
            }`}
          >
            <img
              src={met ? iconCheck : failed ? iconCross : iconCheckOff}
              alt=""
              width={16}
              height={16}
            />
            {label}
          </span>
        )
      })}
    </p>
  )
}

export default PasswordChecks
