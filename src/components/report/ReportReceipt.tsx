import dashedLine from '@/assets/images/report/dashed-line.svg'
import receiptEdge from '@/assets/images/report/receipt-edge.svg'
import type { Report } from '@/utils/report'

type ReportReceiptProps = {
  report: Report
  // 리포트 머리글
  periodLabel: string
  title: string
  criteriaLines: string[]
  questionCount: number
}

function Divider() {
  return <img src={dashedLine} alt="" height={2} className="h-0.5 w-full" />
}

// Figma C-06 영수증 모양 리포트 요약. 원값 표는 PDF에만 담음
function ReportReceipt({
  report,
  periodLabel,
  title,
  criteriaLines,
  questionCount,
}: ReportReceiptProps) {
  const stats = [
    ['측정', report.measured],
    ['빈칸', report.blanks],
    ['나중 입력', report.lateEntries],
  ] as const
  const details = [
    ['70 미만', report.lows.length ? `${report.lows.length}번` : '없음'],
    ['원값 표', 'PDF 1쪽 아래'],
    ['물어볼 것', `${questionCount}개`],
  ]

  return (
    <div>
      <article className="shadow-receipt flex flex-col gap-3.5 rounded-t-3xl bg-white px-5.5 pt-5.5 pb-2.5">
        <header className="flex flex-col gap-1">
          <p className="text-body-3 text-grey-500">{periodLabel}</p>
          <h2 className="text-t4 text-grey-900">{title}</h2>
          <p className="text-grey-500 text-xs leading-normal">
            {criteriaLines.map((line, index) => (
              <span key={line}>
                {index > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
        </header>

        <dl className="flex gap-2">
          {stats.map(([label, value]) => (
            <div
              key={label}
              className="bg-grey-50 rounded-key flex flex-1 flex-col-reverse items-center gap-0.5 py-2.5"
            >
              <dt className="text-grey-500 text-xs leading-normal font-medium">{label}</dt>
              <dd className="text-t3 text-grey-900">{value}</dd>
            </div>
          ))}
        </dl>

        <Divider />

        <div className="text-t7 text-grey-500 flex justify-between font-bold">
          <span>시점</span>
          <span>목표 밖 / 측정</span>
        </div>
        <ul className="flex flex-col gap-3.5">
          {report.slots.map((slot) => (
            <li key={slot.key} className="flex items-center justify-between">
              <span className="text-body-2 text-grey-800">{slot.label}</span>
              <span className="flex items-baseline gap-0.5">
                <span className="text-subtitle-1 text-grey-900">{slot.outOfTarget ?? '–'}</span>
                <span className="text-grey-400 text-sm leading-normal font-medium">
                  / {slot.total}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <Divider />

        <dl className="text-t7 flex flex-col gap-1.5">
          {details.map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <dt className="text-grey-500">{label}</dt>
              <dd className="text-grey-700 font-bold">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-grey-800 text-xs leading-normal font-medium">
          해석이나 권고 없이 기록만 담았어요
        </p>
      </article>
      {/* 영수증 아래 물결 */}
      <img src={receiptEdge} alt="" height={18} className="h-4.5 w-full" />
    </div>
  )
}

export default ReportReceipt
