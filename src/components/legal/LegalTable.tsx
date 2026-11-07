export type LegalRow = {
  label: string
  value: string
  // 동의 거부 권리처럼 꼭 읽어야 하는 줄
  highlight?: boolean
}

type LegalTableProps = {
  // 있으면 회색 머리 줄. 예: 구분 · 항목
  head?: [string, string]
  rows: LegalRow[]
}

// Figma N-02·N-04·N-05 두 칸 표
function LegalTable({ head, rows }: LegalTableProps) {
  return (
    <dl className="border-grey-200 divide-grey-100 w-full divide-y overflow-hidden rounded-xl border">
      {head && (
        <div className="bg-grey-50 text-grey-700 flex gap-3 px-3.5 py-2.5 text-xs leading-snug font-bold">
          <dt className="w-22 shrink-0">{head[0]}</dt>
          <dd className="flex-1">{head[1]}</dd>
        </div>
      )}
      {rows.map(({ label, value, highlight }) => (
        <div
          key={label}
          className={`flex gap-3 px-3.5 py-3 text-xs leading-normal ${highlight ? 'bg-yellow-50' : ''}`}
        >
          <dt className="text-body-3 text-grey-800 w-22 shrink-0 font-bold">{label}</dt>
          <dd className="text-t7 text-grey-700 flex-1">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export default LegalTable
