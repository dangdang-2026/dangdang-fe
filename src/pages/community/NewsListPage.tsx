import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import SubPageHeader from '@/components/common/SubPageHeader'
import { ROUTES, communityNewsPath } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { getCards, getSavedCards } from '@/api/cards'
import type { NewsSummary } from '@/types/news'

type Tab = 'all' | 'saved'

const TABS: { value: Tab; label: string }[] = [
  { value: 'all', label: '전체 카드' },
  { value: 'saved', label: '저장한 카드' },
]

// 예: 10/19
const formatShortDate = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`

// 탭별 서버 카드. 저장한 카드엔 내려간 카드도 남음. 받기 전 undefined, 실패하면 null
function useCards(tab: Tab) {
  const [result, setResult] = useState<{ tab: Tab; cards: NewsSummary[] | null } | null>(null)
  useEffect(() => {
    let stale = false
    ;(tab === 'all' ? getCards() : getSavedCards())
      .then((cards) => {
        if (!stale) setResult({ tab, cards })
      })
      .catch(() => {
        if (!stale) setResult({ tab, cards: null })
      })
    return () => {
      stale = true
    }
  }, [tab])
  return result?.tab === tab ? result.cards : undefined
}

// Figma U-27 당당 소식 모아보기
function NewsListPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.COMMUNITY)
  const [tab, setTab] = useState<Tab>('all')
  const all = useCards(tab)
  const cards = all ?? []
  const seriesTitle = [...new Set(cards.map((card) => card.series))].join(' · ')

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-2 pb-10">
      <SubPageHeader title="당당 소식" onBack={goBack} />

      <div className="mt-3 flex flex-col gap-4.5">
        <div role="tablist" className="flex gap-5">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              className={`text-t6 border-b-2 pb-1.5 ${
                tab === value
                  ? 'text-grey-900 border-grey-900 font-bold'
                  : 'text-grey-500 border-transparent font-medium'
              }`}
              onClick={() => setTab(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-t7 text-grey-500">모든 카드에 공식 출처와 확인일이 있어요.</p>

        {cards.length === 0 ? (
          <p className="text-grey-500 py-16 text-center text-sm leading-normal">
            {all === undefined
              ? '소식을 불러오는 중이에요'
              : all === null
                ? '소식을 불러오지 못했어요. 잠시 후 다시 열어 주세요'
                : tab === 'all'
                  ? '아직 올라온 소식이 없어요'
                  : '카드에서 저장을 누르면 여기에 모여요'}
          </p>
        ) : (
          <section className="flex flex-col gap-2.5">
            <h2 className="text-t6 text-grey-900 leading-snug font-bold">{seriesTitle}</h2>
            <ul className="grid grid-cols-2 gap-3">
              {cards.map((card) => (
                <li key={card.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col gap-2 text-left"
                    onClick={() => navigate(communityNewsPath(card.id))}
                  >
                    <span className="flex h-50 w-full flex-col gap-1.5 rounded-2xl bg-yellow-50 p-3.5 font-bold">
                      <span className="text-caption text-grey-800 font-bold">{card.series}</span>
                      <span className="text-grey-900 text-base leading-snug">{card.title}</span>
                    </span>
                    {/* 내려간 카드는 수가 0이라 확인일로 */}
                    <span className="text-grey-600 text-xs leading-snug">
                      {card.slideCount > 0
                        ? `출처 ${card.sourceCount} · ${card.slideCount}장`
                        : `확인일 ${formatShortDate(card.checkedAt)}`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}

export default NewsListPage
