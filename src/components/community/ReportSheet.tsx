import { useState } from 'react'
import BottomSheet from '@/components/common/BottomSheet'
import type { ReportReason } from '@/types/community'

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'medical', label: '진단·처방, 약 이름·용량 권유' },
  { value: 'compare', label: '혈당 수치 비교·순위' },
  { value: 'ad', label: '광고·판매·후원 요청' },
  { value: 'privacy', label: '개인정보 노출' },
  { value: 'abuse', label: '비방·혐오·성적인 글' },
  { value: 'etc', label: '기타' },
]

type ReportSheetProps = {
  onSubmit: (reason: ReportReason) => void
  onClose: () => void
}

// Figma U-12 신고 사유 고르기
function ReportSheet({ onSubmit, onClose }: ReportSheetProps) {
  const [reason, setReason] = useState<ReportReason>('medical')

  return (
    <BottomSheet label="신고하기" onClose={onClose}>
      <div className="-mt-6 flex flex-col gap-1">
        <h2 className="text-t4 text-grey-900">신고 이유를 골라 주세요</h2>
        <p className="text-grey-500 text-sm leading-normal">
          신고한 사람은 글쓴이에게 알려지지 않아요.
        </p>
      </div>
      <ul role="radiogroup" aria-label="신고 이유" className="flex flex-col">
        {REASONS.map(({ value, label }) => (
          <li key={value}>
            <button
              type="button"
              role="radio"
              aria-checked={reason === value}
              className={`flex w-full items-center gap-3 py-3 text-base leading-snug ${
                reason === value ? 'text-grey-900 font-bold' : 'text-grey-800'
              }`}
              onClick={() => setReason(value)}
            >
              <span
                aria-hidden
                className={`flex size-5.5 items-center justify-center rounded-full border-2 ${
                  reason === value ? 'border-primary bg-primary' : 'border-grey-300'
                }`}
              >
                {reason === value && <span className="size-2 rounded-full bg-white" />}
              </span>
              {label}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="bg-primary text-grey-900 rounded-key py-4 text-base leading-snug font-bold"
        onClick={() => onSubmit(reason)}
      >
        신고하기
      </button>
    </BottomSheet>
  )
}

export default ReportSheet
