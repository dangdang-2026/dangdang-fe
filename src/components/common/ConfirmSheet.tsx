import type { ReactNode } from 'react'
import iconLoading from '@/assets/icons/auth/loading.svg'
import BottomSheet from '@/components/common/BottomSheet'

type ConfirmSheetProps = {
  title: string
  // 회색 상자 안 「이름 · 값」 줄. 예: 식후 측정 1시간 → 2시간
  summary?: { label: string; value: string }[]
  // 줄 대신 회색 상자에 직접 그릴 내용. 예: 지우는 혈당 기록
  detail?: ReactNode
  description?: ReactNode
  confirmLabel: string
  // 동의 철회 · 지우기처럼 되돌리기 어려우면 빨간 버튼
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

// Figma M-03b · M-04b · M-12 · D-11 · C-20 · M-18 확인 · 지우기 시트: 제목 + 요약 + 설명 + 확인 버튼 + 취소
function ConfirmSheet({
  title,
  summary,
  detail,
  description,
  confirmLabel,
  danger,
  loading,
  onConfirm,
  onClose,
}: ConfirmSheetProps) {
  return (
    <BottomSheet label={title} onClose={onClose}>
      <h2 className="text-t4 text-grey-900">{title}</h2>
      {summary && (
        <dl className="bg-grey-50 rounded-key flex flex-col gap-2 p-4">
          {summary.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <dt className="text-grey-700 text-sm font-medium">{label}</dt>
              <dd className="text-t6 text-grey-900 text-right font-bold">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {detail && <div className="bg-grey-50 rounded-key px-4 py-3.5">{detail}</div>}
      {description && (
        <div className="text-t6 text-grey-700 whitespace-pre-line">{description}</div>
      )}
      <div className="mt-3 flex flex-col">
        <button
          type="button"
          aria-busy={loading}
          disabled={loading}
          className={`text-subtitle-1 relative h-14 rounded-xl leading-none font-bold text-white ${
            danger ? 'bg-red-600' : 'bg-primary'
          }`}
          onClick={onConfirm}
        >
          <span className={loading ? 'opacity-0' : undefined}>{confirmLabel}</span>
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
    </BottomSheet>
  )
}

export default ConfirmSheet
