import iconAlert from '@/assets/icons/alert.svg'
import iconCheckGreen from '@/assets/icons/community/check-green.svg'
import iconShuffle from '@/assets/icons/community/shuffle.svg'
import { NICKNAME_MAX, NICKNAME_MIN, createNickname, type NicknameCheck } from '@/utils/nickname'

const RULE = `${NICKNAME_MIN}~${NICKNAME_MAX}자, 한글·영문·숫자`

const ERROR_MESSAGE: Record<Exclude<NicknameCheck, 'ok'>, string> = {
  length: `${RULE}로 적어 주세요`,
  chars: `${RULE}만 쓸 수 있어요`,
  taken: '이미 누가 쓰고 있는 이름이에요. 다른 이름을 골라 주세요.',
}

type NicknameFieldProps = {
  value: string
  check: NicknameCheck
  onChange: (value: string) => void
}

// Figma U-04·M-16 닉네임 입력칸 + 새 이름 만들기 + 확인 문구
function NicknameField({ value, check, onChange }: NicknameFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <label
          className={`focus-within:border-primary flex h-13 flex-1 items-center gap-2 rounded-xl border bg-white pr-3 pl-4 ${
            check === 'ok' ? 'border-grey-200' : 'border-red-500'
          }`}
        >
          <input
            value={value}
            maxLength={NICKNAME_MAX}
            aria-label="닉네임"
            aria-invalid={check !== 'ok'}
            className="text-grey-900 min-w-0 flex-1 text-base leading-snug font-medium outline-none"
            onChange={(event) => onChange(event.target.value)}
          />
          <span className="text-grey-500 text-xs">
            {value.length}/{NICKNAME_MAX}
          </span>
        </label>
        <button
          type="button"
          aria-label="다른 이름 만들기"
          className="border-grey-200 bg-grey-100 flex size-13 shrink-0 items-center justify-center rounded-xl border"
          onClick={() => onChange(createNickname(value))}
        >
          <img src={iconShuffle} alt="" width={20} height={20} />
        </button>
      </div>
      <p
        className={`flex items-start gap-1 text-xs leading-snug font-medium ${
          check === 'ok' ? 'text-grey-500' : 'text-red-500'
        }`}
      >
        <img
          src={check === 'ok' ? iconCheckGreen : iconAlert}
          alt=""
          width={14}
          height={14}
          className="mt-px"
        />
        {check === 'ok' ? `쓸 수 있는 이름이에요 · ${RULE}` : ERROR_MESSAGE[check]}
      </p>
    </div>
  )
}

export default NicknameField
