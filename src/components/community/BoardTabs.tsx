import { useEffect, useRef, useState } from 'react'
import iconCheckYellow from '@/assets/icons/community/check-yellow.svg'
import iconCollapse from '@/assets/icons/community/collapse.svg'
import iconExpand from '@/assets/icons/community/expand.svg'
import { BOARD_LABEL, BOARD_ORDER } from '@/constants/community'
import type { BoardKey } from '@/types/community'

// 전체·인기 + 게시판
export type BoardTab = 'all' | 'popular' | BoardKey

const TABS: { key: BoardTab; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'popular', label: '인기' },
  ...BOARD_ORDER.map((key) => ({ key, label: BOARD_LABEL[key] })),
]

type BoardTabsProps = {
  active: BoardTab
  onSelect: (tab: BoardTab) => void
}

// Figma U-21 카테고리 탭 · U-22 전체 펼침 패널
function BoardTabs({ active, onSelect }: BoardTabsProps) {
  const [expanded, setExpanded] = useState(false)
  const activeRef = useRef<HTMLButtonElement>(null)

  // 고른 탭이 가려지지 않게 가운데로
  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [active])

  const select = (tab: BoardTab) => {
    setExpanded(false)
    onSelect(tab)
  }

  return (
    <>
      <div className="border-grey-100 flex items-center gap-2 border-b pr-3 pl-5">
        <div className="flex flex-1 [scrollbar-width:none] gap-5 overflow-x-auto">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              ref={key === active ? activeRef : undefined}
              type="button"
              aria-current={key === active ? 'page' : undefined}
              className={`shrink-0 border-b-2 pt-3 pb-2 text-base leading-snug ${
                key === active
                  ? 'text-grey-900 border-grey-900 font-bold'
                  : 'text-grey-400 border-transparent font-medium'
              }`}
              onClick={() => select(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="카테고리 펼치기"
          aria-expanded={expanded}
          className="border-grey-200 flex h-7.5 w-8.5 shrink-0 items-center justify-center rounded-lg border bg-white"
          onClick={() => setExpanded(true)}
        >
          <img src={iconExpand} alt="" width={16} height={16} />
        </button>
      </div>

      {expanded && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="닫기"
            className="animate-fade-in absolute inset-0 bg-black/45"
            onClick={() => setExpanded(false)}
          />
          <section
            aria-label="카테고리"
            className="absolute top-0 left-1/2 w-full max-w-107.5 -translate-x-1/2 rounded-b-3xl bg-white pt-12.5"
          >
            <div className="flex flex-col gap-1 pt-3 pr-4 pb-7 pl-5">
              <div className="flex items-center justify-between pb-2">
                <h2 className="text-t6 text-grey-500 font-bold">카테고리</h2>
                <button
                  type="button"
                  aria-label="카테고리 접기"
                  className="border-grey-200 flex h-7.5 w-8.5 items-center justify-center rounded-lg border"
                  onClick={() => setExpanded(false)}
                >
                  <img src={iconCollapse} alt="" width={16} height={16} />
                </button>
              </div>
              <ul className="grid grid-cols-2">
                {TABS.map(({ key, label }) => (
                  <li key={key}>
                    <button
                      type="button"
                      className={`text-subtitle-1 flex items-center gap-1.5 py-3.5 tracking-normal ${
                        key === active ? 'text-grey-900' : 'text-grey-600 font-medium'
                      }`}
                      onClick={() => select(key)}
                    >
                      {label}
                      {key === active && (
                        <img src={iconCheckYellow} alt="선택됨" width={16} height={16} />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

export default BoardTabs
