import iconDelete from '@/assets/icons/delete.svg'

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

type GlucoseKeypadProps = {
  onDigit: (digit: string) => void
  onDelete: () => void
  // 왼쪽 아래 HI/LO 키. 없으면 빈칸(둘러보기)
  onMeterLimit?: () => void
}

const KEY_CLASS =
  'bg-grey-50 text-grey-900 active:bg-grey-100 flex h-14.5 items-center justify-center rounded-key text-2xl font-medium'

function GlucoseKeypad({ onDigit, onDelete, onMeterLimit }: GlucoseKeypadProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {DIGITS.map((digit) => (
        <button key={digit} type="button" className={KEY_CLASS} onClick={() => onDigit(digit)}>
          {digit}
        </button>
      ))}
      {/* 혈당계에 HI · LO가 떴을 때. 둘러보기엔 빈칸 */}
      {onMeterLimit ? (
        <button
          type="button"
          className="bg-grey-50 text-grey-700 active:bg-grey-100 rounded-key flex h-14.5 items-center justify-center text-base font-bold"
          onClick={onMeterLimit}
        >
          HI/LO
        </button>
      ) : (
        <span />
      )}
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
