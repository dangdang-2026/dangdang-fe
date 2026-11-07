import { useState, type KeyboardEvent } from 'react'
import iconAlert from '@/assets/icons/auth/alert.svg'
import iconCapsLock from '@/assets/icons/auth/caps-lock.svg'
import iconCheck from '@/assets/icons/auth/check.svg'
import iconEyeOff from '@/assets/icons/auth/eye-off.svg'
import iconEye from '@/assets/icons/auth/eye.svg'
import AuthField, { type FieldHelper } from '@/components/auth/AuthField'
import PasswordChecks from '@/components/auth/PasswordChecks'
import { checkPassword } from '@/utils/auth'

type NewPasswordFieldsProps = {
  idPrefix: string
  // 비밀번호 바꾸기에선 '새 비밀번호'
  passwordLabel?: string
  password: string
  confirm: string
  onPasswordChange: (value: string) => void
  onConfirmChange: (value: string) => void
  // 다음·바꾸기를 누른 뒤엔 빈칸·조건·다름을 모두 알림
  submitted: boolean
  // 서버가 알려 준 오류. 예: 전에 쓰던 비밀번호
  passwordError?: string | null
}

const INPUT_CLASS =
  'text-grey-900 placeholder:text-grey-500 placeholder:text-input caret-primary min-w-0 flex-1 bg-transparent outline-none'

// 가려 둔 비밀번호는 점을 크게
const secretClass = (value: string, shown: boolean) =>
  value && !shown ? 'text-t4 font-medium' : 'text-input'

// Figma 입력/비밀번호 · 입력/비밀번호 확인. 가입(J)·재설정(R)에서 같이 씀
function NewPasswordFields({
  idPrefix,
  passwordLabel = '비밀번호',
  password,
  confirm,
  onPasswordChange,
  onConfirmChange,
  submitted,
  passwordError,
}: NewPasswordFieldsProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  // 확인 칸은 떠날 때나 제출할 때 다름을 알림
  const [confirmLeft, setConfirmLeft] = useState(false)

  const checks = checkPassword(password)
  const passwordInvalid =
    !!passwordError || checks.space || (submitted && (!password || !checks.length || !checks.mix))
  const confirmEmpty = submitted && !confirm
  const confirmMatch = !!confirm && confirm === password
  const confirmMismatch = (confirmLeft || submitted) && !!confirm && !confirmMatch

  const trackCapsLock = (event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState('CapsLock'))
  }

  const passwordHelper: FieldHelper | null = passwordError
    ? { icon: iconAlert, text: passwordError, tone: 'error' }
    : checks.space
      ? { icon: iconAlert, text: '비밀번호에는 띄어쓰기를 쓸 수 없어요', tone: 'error' }
      : submitted && !password
        ? { icon: iconAlert, text: '비밀번호를 입력해 주세요', tone: 'error' }
        : passwordFocused && capsLock
          ? { icon: iconCapsLock, text: 'Caps Lock이 켜져 있어요', tone: 'info' }
          : null

  const confirmHelper: FieldHelper | null = confirmEmpty
    ? { icon: iconAlert, text: '비밀번호를 한 번 더 입력해 주세요', tone: 'error' }
    : confirmMismatch
      ? { icon: iconAlert, text: '위에 입력한 비밀번호와 달라요', tone: 'error' }
      : confirmMatch
        ? { icon: iconCheck, text: '비밀번호가 같아요', tone: 'success' }
        : null

  const passwordId = `${idPrefix}-password`
  const confirmId = `${idPrefix}-confirm`

  return (
    <>
      <AuthField
        label={passwordLabel}
        inputId={passwordId}
        invalid={passwordInvalid}
        helper={passwordHelper}
        footer={
          (password || submitted) && <PasswordChecks password={password} submitted={submitted} />
        }
      >
        <input
          id={passwordId}
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="8자 이상, 영문·숫자"
          value={password}
          aria-invalid={passwordInvalid}
          aria-describedby={passwordHelper ? `${passwordId}-helper` : undefined}
          className={`${secretClass(password, showPassword)} ${INPUT_CLASS}`}
          onChange={(event) => onPasswordChange(event.target.value)}
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
          onKeyDown={trackCapsLock}
          onKeyUp={trackCapsLock}
        />
        <button
          type="button"
          aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
          aria-pressed={showPassword}
          className="shrink-0"
          onClick={() => setShowPassword((shown) => !shown)}
        >
          <img src={showPassword ? iconEye : iconEyeOff} alt="" width={20} height={20} />
        </button>
      </AuthField>

      <AuthField
        label="비밀번호 확인"
        inputId={confirmId}
        invalid={confirmEmpty || confirmMismatch}
        helper={confirmHelper}
      >
        <input
          id={confirmId}
          type={showConfirm ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="한 번 더 입력해 주세요"
          value={confirm}
          aria-invalid={confirmEmpty || confirmMismatch}
          aria-describedby={confirmHelper ? `${confirmId}-helper` : undefined}
          className={`${secretClass(confirm, showConfirm)} ${INPUT_CLASS}`}
          onChange={(event) => {
            onConfirmChange(event.target.value)
            setConfirmLeft(false)
          }}
          onBlur={() => setConfirmLeft(true)}
        />
        <button
          type="button"
          aria-label={showConfirm ? '비밀번호 확인 숨기기' : '비밀번호 확인 보기'}
          aria-pressed={showConfirm}
          className="shrink-0"
          onClick={() => setShowConfirm((shown) => !shown)}
        >
          <img src={showConfirm ? iconEye : iconEyeOff} alt="" width={20} height={20} />
        </button>
      </AuthField>
    </>
  )
}

export default NewPasswordFields
