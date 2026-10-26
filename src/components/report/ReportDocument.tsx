import { formatMonthDay, formatTime } from '@/utils/date'
import { REPORT_SLOT_KEYS, type Report } from '@/utils/report'
import type { Question } from '@/types/visit'

type ReportDocumentProps = {
  report: Report
  periodLabel: string
  title: string
  criteriaLines: string[]
  questions: Question[]
  createdAt: Date
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 인쇄·PDF용 A4 1쪽 리포트. 화면에는 숨기고 인쇄할 때만 보임
function ReportDocument({
  report,
  periodLabel,
  title,
  criteriaLines,
  questions,
  createdAt,
}: ReportDocumentProps) {
  // 자기 전은 기록이 있을 때만 열 추가
  const columns = report.slots.filter((slot) => REPORT_SLOT_KEYS.includes(slot.key))

  return (
    <article className="text-grey-900 flex flex-col gap-4 bg-white text-xs leading-normal">
      <header className="border-grey-900 flex items-end justify-between border-b-2 pb-2">
        <div>
          <h1 className="text-t4">{title}</h1>
          <p className="text-grey-700">{periodLabel}</p>
        </div>
        <p className="text-grey-600 text-right">
          {criteriaLines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
      </header>

      <section className="flex gap-6">
        <p>
          측정 <b>{report.measured}</b>
        </p>
        <p>
          빈칸 <b>{report.blanks}</b>
        </p>
        <p>
          나중 입력 <b>{report.lateEntries}</b>
        </p>
        <p>
          70 미만 <b>{report.lows.length ? `${report.lows.length}번` : '없음'}</b>
        </p>
      </section>

      <section>
        <h2 className="mb-1 font-bold">시점별 목표 밖 / 측정</h2>
        <p className="flex flex-wrap gap-x-5">
          {report.slots.map((slot) => (
            <span key={slot.key}>
              {slot.label} <b>{slot.outOfTarget ?? '–'}</b> / {slot.total}
            </span>
          ))}
        </p>
      </section>

      <section>
        <h2 className="mb-1 font-bold">날짜별 원값(mg/dL)</h2>
        <table className="border-grey-400 w-full border-collapse border text-center">
          <thead className="bg-grey-100">
            <tr>
              <th className="border-grey-400 border px-1 py-0.5">날짜</th>
              {columns.map((slot) => (
                <th key={slot.key} className="border-grey-400 border px-1 py-0.5">
                  {slot.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.days.map(({ date, cells }) => (
              <tr key={date.toISOString()}>
                <td className="border-grey-400 border px-1 py-0.5">
                  {formatMonthDay(date)}({WEEKDAYS[date.getDay()]})
                </td>
                {columns.map((slot) => {
                  const cell = cells[slot.key]
                  return (
                    <td key={slot.key} className="border-grey-400 border px-1 py-0.5">
                      {cell ? (
                        <>
                          <span className={cell.isOutOfTarget ? 'font-bold underline' : ''}>
                            {cell.record.value}
                          </span>
                          {cell.marks.length > 0 && (
                            <span className="text-grey-600 text-caption block font-medium">
                              {cell.marks.join('·')}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-grey-400">–</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-grey-600 mt-1">
          밑줄 굵은 글씨: 적어 둔 목표 밖 · 늦게 잼: 예정보다 늦게 측정 · 나중 입력: 측정 후 시간이
          지나 입력 · 수정됨: 입력 뒤 고친 값
        </p>
      </section>

      {report.lows.length > 0 && (
        <section>
          <h2 className="mb-1 font-bold">70 미만 기록</h2>
          <p>
            {report.lows
              .map((record) => {
                const at = new Date(record.measuredAt)
                return `${formatMonthDay(at)} ${formatTime(at)} ${record.value}`
              })
              .join(' · ')}
          </p>
        </section>
      )}

      <section>
        <h2 className="mb-1 font-bold">물어볼 것</h2>
        {questions.length ? (
          <ol className="list-decimal pl-4">
            {questions.map((question) => (
              <li key={question.id}>{question.text}</li>
            ))}
          </ol>
        ) : (
          <p className="text-grey-600">적어 둔 질문이 없어요</p>
        )}
      </section>

      <footer className="border-grey-300 text-grey-600 border-t pt-2">
        해석이나 권고 없이 기록만 담았어요 · {formatMonthDay(createdAt)} {formatTime(createdAt)}{' '}
        기기에서 만듦
      </footer>
    </article>
  )
}

export default ReportDocument
