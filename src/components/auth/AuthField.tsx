import type { ReactNode } from 'react'

export type FieldHelper = {
  icon: string
  text: string
  tone: 'error' | 'info' | 'success'
  action?: { label: string; onClick: () => void }
}

const HELPER_TONE: Record<FieldHelper['tone'], string> = {
  error: 'text-red-500',
  info: 'text-blue-700',
  success: 'text-green-500',
}

type AuthFieldProps = {
  label: string
  inputId: string
  invalid?: boolean
  helper?: FieldHelper | null
  // 안내 대신 칸 아래에 둘 내용. 예: 비밀번호 조건
  footer?: ReactNode
  // 오른쪽에 버튼이 붙는 칸은 오른쪽 여백을 줄임
  tightEnd?: boolean
  // 입력칸 + 오른쪽 아이콘 버튼
  children: ReactNode
}

// Figma 입력/이메일·비밀번호·인증번호 공통 틀: 라벨 + 회색 칸(포커스 노랑, 오류 빨강 테두리) + 안내 한 줄
function AuthField({
  label,
  inputId,
  invalid = false,
  helper,
  footer,
  tightEnd = false,
  children,
}: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-body-3 text-grey-700">
        {label}
      </label>
      <div
        className={`bg-grey-100 flex h-14 items-center gap-2 rounded-xl pl-4 ring-inset ${
          tightEnd ? 'pr-2' : 'pr-4'
        } ${invalid ? 'ring-2 ring-red-500' : 'focus-within:ring-primary focus-within:ring-2'}`}
      >
        {children}
      </div>
      {helper ? (
        <p id={`${inputId}-helper`} className="text-body-3 flex items-start gap-1">
          <img src={helper.icon} alt="" width={16} height={16} className="mt-0.5 shrink-0" />
          <span className={HELPER_TONE[helper.tone]}>{helper.text}</span>
          {helper.action && (
            <button
              type="button"
              className="text-grey-900 shrink-0"
              onClick={helper.action.onClick}
            >
              {helper.action.label}
            </button>
          )}
        </p>
      ) : (
        footer
      )}
    </div>
  )
}

export default AuthField
