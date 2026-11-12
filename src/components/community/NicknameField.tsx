import { useState } from 'react'
import { getNicknameSuggestion } from '@/api/communityProfile'
import iconAlert from '@/assets/icons/alert.svg'
import iconCheckGreen from '@/assets/icons/community/check-green.svg'
import iconShuffle from '@/assets/icons/community/shuffle.svg'
import { NICKNAME_MAX, NICKNAME_MIN, type NicknameCheck } from '@/utils/nickname'

const RULE = `${NICKNAME_MIN}~${NICKNAME_MAX}자, 한글·영문·숫자`

const ERROR_MESSAGE: Record<Exclude<NicknameCheck, 'ok' | 'checking'>, string> = {
  length: `${RULE}로 적어 주세요`,
  chars: `${RULE}만 쓸 수 있어요`,
  taken: '이미 누가 쓰고 있는 이름이에요. 다른 이름을 적거나 ↻를 눌러 보세요.',
}

type NicknameFieldProps = {
  value: string
  check: NicknameCheck
  onChange: (value: string) => void
}

// Figma U-04·M-16 닉네임 입력칸 + 새 이름 만들기 + 확인 문구
function NicknameField({ value, check, onChange }: NicknameFieldProps) {
  const [suggesting, setSuggesting] = useState(false)
  // 서버가 추천할 이름을 못 찾으면 직접 적도록 안내. 다시 적으면 지움
  const [suggestFailed, setSuggestFailed] = useState(false)
  const failed = suggestFailed && check === 'ok'
  // 확인 중엔 빨간 표시 없이 기다림
  const invalid = failed || (check !== 'ok' && check !== 'checking')

  const change = (next: string) => {
    setSuggestFailed(false)
    onChange(next)
  }

  // 서버가 지금 아무도 안 쓰는 이름을 골라 줌
  const suggest = async () => {
    if (suggesting) return
    setSuggesting(true)
    try {
      change(await getNicknameSuggestion())
    } catch {
      setSuggestFailed(true)
    } finally {
      setSuggesting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <label
          className={`focus-within:border-primary flex h-13 flex-1 items-center gap-2 rounded-xl border bg-white pr-3 pl-4 ${
            invalid ? 'border-red-500' : 'border-grey-200'
          }`}
        >
          <input
            value={value}
            maxLength={NICKNAME_MAX}
            aria-label="닉네임"
            aria-invalid={invalid}
            className="text-grey-900 min-w-0 flex-1 text-base leading-snug font-medium outline-none"
            onChange={(event) => change(event.target.value)}
          />
          <span className="text-grey-500 text-xs">
            {value.length}/{NICKNAME_MAX}
          </span>
        </label>
        <button
          type="button"
          aria-label="다른 이름 만들기"
          disabled={suggesting}
          className="border-grey-200 bg-grey-100 flex size-13 shrink-0 items-center justify-center rounded-xl border"
          onClick={() => void suggest()}
        >
          <img src={iconShuffle} alt="" width={20} height={20} />
        </button>
      </div>
      <p
        className={`flex items-start gap-1 text-xs leading-snug font-medium ${
          invalid ? 'text-red-500' : 'text-grey-500'
        }`}
      >
        <img
          src={invalid ? iconAlert : iconCheckGreen}
          alt=""
          width={14}
          height={14}
          className="mt-px"
        />
        {failed
          ? '추천할 이름을 찾지 못했어요. 직접 적어 주세요'
          : check === 'checking'
            ? '쓸 수 있는 이름인지 확인하고 있어요'
            : check === 'ok'
              ? `쓸 수 있는 이름이에요 · ${RULE}`
              : ERROR_MESSAGE[check]}
      </p>
    </div>
  )
}

export default NicknameField
