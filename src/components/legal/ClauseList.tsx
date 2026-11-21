import { useState, type ReactNode } from 'react'
import iconChevDown from '@/assets/icons/legal/chev-down.svg'
import iconChevUp from '@/assets/icons/legal/chev-up.svg'
import LegalTable, { type LegalRow } from '@/components/legal/LegalTable'

export type Clause = {
  title: string
  description?: string
  // 펼쳤을 때 본문. 없으면 확정 전 안내
  body?: ReactNode
  // 본문 대신 다른 문서로 이동. 예: 제6조 국외 이전
  onOpen?: () => void
}

type ClauseListProps = {
  clauses: Clause[]
}

// Figma N-01·N-02 전체 조항 목차. 누르면 그 자리에서 펼침
function ClauseList({ clauses }: ClauseListProps) {
  const [opened, setOpened] = useState<string[]>([])

  const toggle = (title: string) =>
    setOpened((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title],
    )

  return (
    <ul className="flex w-full flex-col">
      {clauses.map(({ title, description, body, onOpen }) => {
        const open = opened.includes(title)
        return (
          <li key={title} className="flex flex-col">
            <button
              type="button"
              aria-expanded={onOpen ? undefined : open}
              className="border-grey-100 flex items-center gap-2.5 border-b py-3.5 text-left"
              onClick={() => (onOpen ? onOpen() : toggle(title))}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className={`text-body-2 text-grey-900 ${open ? 'font-bold' : ''}`}>
                  {title}
                </span>
                {description && !open && (
                  <span className="text-t7 text-grey-600">{description}</span>
                )}
              </span>
              <img src={open ? iconChevUp : iconChevDown} alt="" width={16} height={16} />
            </button>
            {open && (
              <div className="pt-5 pb-2">
                {body ?? (
                  <p className="text-grey-600 text-sm leading-6">
                    본문은 법률 검토를 마친 뒤 올려 둘게요.
                  </p>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function ClauseParagraphs({ lines }: { lines: string[] }) {
  return (
    <div className="text-grey-700 flex flex-col text-sm leading-6">
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  )
}

type ClauseBodyProps = {
  lines?: string[]
  rows?: LegalRow[]
  // 표 아래 덧붙이는 한 줄
  note?: string
}

// 조항 본문: 문단 → 두 칸 표 → 덧붙임 순서(N-02 · N-07)
export function ClauseBody({ lines, rows, note }: ClauseBodyProps) {
  return (
    <div className="flex flex-col gap-3">
      {lines && <ClauseParagraphs lines={lines} />}
      {rows && <LegalTable rows={rows} />}
      {note && <p className="text-grey-600 text-xs leading-normal">{note}</p>}
    </div>
  )
}

export default ClauseList
