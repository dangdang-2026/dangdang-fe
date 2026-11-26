import { useState } from 'react'
import { createPortal } from 'react-dom'
import iconLoading from '@/assets/icons/auth/loading.svg'
import BottomSheet from '@/components/common/BottomSheet'
import RangeSheet from '@/components/stats/RangeSheet'
import { addDays, formatMonthDay } from '@/utils/date'
import type { DateRange } from '@/utils/stats'

type Choice = '7d' | '30d' | 'custom' | 'all'

type RecordDeleteRangeSheetProps = {
  today: Date
  // 가장 오래된 기록 날. 전체 기간 · 직접 고르기 시작
  start: Date
  loading: boolean
  onDelete: (range: DateRange) => void
  onClose: () => void
}

const LABEL: Record<Choice, string> = {
  '7d': '지난 7일',
  '30d': '지난 30일',
  custom: '기간 직접 고르기',
  all: '전체 기간',
}

// Figma M-07c 기록 지우기(기간 고르기). 고르면 빨간 버튼에 그 기간
function RecordDeleteRangeSheet({
  today,
  start,
  loading,
  onDelete,
  onClose,
}: RecordDeleteRangeSheetProps) {
  const [choice, setChoice] = useState<Choice>('7d')
  const [custom, setCustom] = useState<DateRange | null>(null)
  const [rangeSheet, setRangeSheet] = useState(false)

  const rangeOf = (key: Choice): DateRange | null => {
    if (key === '7d') return { from: addDays(today, -6), to: today }
    if (key === '30d') return { from: addDays(today, -29), to: today }
    if (key === 'custom') return custom
    return { from: start < today ? start : today, to: today }
  }
  const describe = (key: Choice) => {
    if (key === 'all') return '지금까지 남긴 모든 기록'
    const range = rangeOf(key)
    if (!range) return '시작일과 끝날을 골라요'
    return `${formatMonthDay(range.from)} ~ ${formatMonthDay(range.to)}`
  }
  const range = rangeOf(choice)
  const buttonLabel =
    choice === 'all'
      ? '전체 기록 지우기'
      : choice === 'custom'
        ? '고른 기간 기록 지우기'
        : `${LABEL[choice]} 기록 지우기`

  return (
    <BottomSheet label="기록 지우기" onClose={onClose}>
      <h2 className="text-t4 text-grey-900">어느 기간의 기록을 지울까요?</h2>

      <div className="flex flex-col gap-2" role="radiogroup" aria-label="지울 기간">
        {(Object.keys(LABEL) as Choice[]).map((key) => {
          const selected = choice === key
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`rounded-key flex items-center gap-3 border px-4 py-3.5 text-left ${
                selected ? 'border-yellow-300 bg-yellow-50' : 'border-grey-100 bg-grey-50'
              }`}
              onClick={() => {
                setChoice(key)
                // 직접 고르기는 달력 시트로
                if (key === 'custom') setRangeSheet(true)
              }}
            >
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  selected ? 'border-primary bg-white' : 'border-grey-300'
                }`}
              >
                {selected && <span className="bg-primary size-2 rounded-full" />}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-t6 text-grey-900 font-bold">{LABEL[key]}</span>
                <span className="text-t7 text-grey-600">{describe(key)}</span>
              </span>
            </button>
          )
        })}
      </div>

      <p className="text-t6 text-grey-700">
        지운 기록은 진료 리포트에서도 빠지고
        <br />
        되돌릴 수 없어요.
      </p>

      <div className="flex flex-col">
        <button
          type="button"
          disabled={!range || loading}
          aria-busy={loading}
          className="text-subtitle-1 disabled:bg-grey-100 disabled:text-grey-400 relative h-14 rounded-xl bg-red-600 leading-none font-bold text-white"
          onClick={() => range && onDelete(range)}
        >
          <span className={loading ? 'opacity-0' : undefined}>{buttonLabel}</span>
          {loading && (
            <img
              src={iconLoading}
              alt=""
              width={31}
              height={7}
              className="absolute top-1/2 left-1/2 -translate-1/2"
            />
          )}
        </button>
        <button
          type="button"
          disabled={loading}
          className="text-body-2 text-grey-700 mt-2 h-11 font-medium"
          onClick={onClose}
        >
          취소
        </button>
      </div>

      {/* 기간 시트 안에서 열어도 화면 기준으로 뜨게 body로 */}
      {rangeSheet &&
        createPortal(
          <RangeSheet
            title="지울 기간"
            actionLabel={(picked) =>
              `${formatMonthDay(picked.from)} ~ ${formatMonthDay(picked.to)} 고르기`
            }
            today={today}
            start={start < today ? start : today}
            initial={custom}
            onApply={(picked) => {
              setCustom(picked)
              setRangeSheet(false)
            }}
            onClose={() => setRangeSheet(false)}
          />,
          document.body,
        )}
    </BottomSheet>
  )
}

export default RecordDeleteRangeSheet
