import iconDelete from '@/assets/icons/delete.svg'

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

type GlucoseKeypadProps = {
  onDigit: (digit: string) => void
  onDelete: () => void
}

const KEY_CLASS =
  'bg-grey-50 text-grey-900 active:bg-grey-100 flex h-14.5 items-center justify-center rounded-key text-2xl font-medium'

function GlucoseKeypad({ onDigit, onDelete }: GlucoseKeypadProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {DIGITS.map((digit) => (
        <button key={digit} type="button" className={KEY_CLASS} onClick={() => onDigit(digit)}>
          {digit}
        </button>
      ))}
      {/* 왼쪽 아래 빈칸 */}
      <span />
      <button type="button" className={KEY_CLASS} onClick={() => onDigit('0')}>
        0
      </button>
      <button type="button" aria-label="지우기" className={KEY_CLASS} onClick={onDelete}>
        <img src={iconDelete} alt="" width={24} height={24} />
      </button>
    </div>
  )
}

export default GlucoseKeypad
