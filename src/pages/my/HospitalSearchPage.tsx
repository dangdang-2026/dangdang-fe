import { useEffect, useRef, useState } from 'react'
import { SEARCH_KEYWORD_MAX, SEARCH_KEYWORD_MIN, searchHospitals } from '@/api/careSites'
import iconSearch from '@/assets/icons/search.svg'
import iconChevron from '@/assets/icons/postpartum/chevron-md.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import MorePostsButton from '@/components/community/MorePostsButton'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useHospitalStore } from '@/stores/useHospitalStore'
import type { HospitalInfo } from '@/types/hospital'
import { objectParticle } from '@/utils/josa'

// 입력을 멈추고 기다렸다 찾음. 글자마다 서버를 부르지 않게
const SEARCH_DELAY_MS = 300

type SearchResult = {
  // 검색할 때마다 올림. 다시 찾기 · 다른 검색어 뒤에 늦게 온 다음 장은 버림
  run: number
  keyword: string
  status: 'loading' | 'done' | 'error'
  items: HospitalInfo[]
  page: number
  hasNext: boolean
  totalCount: number
  loadingMore: boolean
  // 다음 장을 못 받았는지
  moreFailed: boolean
}

const firstResult = (
  run: number,
  keyword: string,
  status: SearchResult['status'],
): SearchResult => ({
  run,
  keyword,
  status,
  items: [],
  page: 0,
  hasNext: false,
  totalCount: 0,
  loadingMore: false,
  moreFailed: false,
})

// 장 사이에 같은 병원이 또 오면 한 번만. 병원 코드가 없으면 이름 · 주소로
const sameHospital = (a: HospitalInfo, b: HospitalInfo) =>
  a.hiraCode || b.hiraCode
    ? a.hiraCode === b.hiraCode
    : a.name === b.name && a.address === b.address

// 이미 있는 병원 · 이번에 받은 것끼리도 겹치면 한 번만
const addUnique = (base: HospitalInfo[], incoming: HospitalInfo[]) =>
  incoming.reduce(
    (list, item) => (list.some((seen) => sameHospital(seen, item)) ? list : [...list, item]),
    base,
  )

// Figma C-21 병원 찾기 · C-22 찾는 병원 없음. 서버가 받아 둔 심평원 병원 목록에서 찾음
function HospitalSearchPage() {
  const goBack = useGoBack(ROUTES.MY_HOSPITALS)
  const setDraft = useHospitalStore((state) => state.setDraft)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState<SearchResult | null>(null)
  // 다시 찾기를 누르면 같은 검색어로 한 번 더
  const [retry, setRetry] = useState(0)
  const runRef = useRef(0)
  const keyword = query.trim()
  const searchable = keyword.length >= SEARCH_KEYWORD_MIN

  useEffect(() => {
    if (!searchable) return
    // 늦게 온 이전 검색어 결과는 버림
    let stale = false
    const timer = window.setTimeout(() => {
      runRef.current += 1
      const run = runRef.current
      setSearch(firstResult(run, keyword, 'loading'))
      searchHospitals(keyword)
        .then(({ items, hasNext, totalCount }) => {
          if (!stale)
            setSearch({
              ...firstResult(run, keyword, 'done'),
              items: addUnique([], items),
              hasNext,
              totalCount,
            })
        })
        .catch(() => {
          // 검색이 안 되면(CARE_SITE_50201 등) 직접 적기로 안내
          if (!stale) setSearch(firstResult(run, keyword, 'error'))
        })
    }, SEARCH_DELAY_MS)
    return () => {
      stale = true
      window.clearTimeout(timer)
    }
  }, [keyword, searchable, retry])

  // 지금 검색어의 결과만 보여 줌
  const current = searchable && search?.keyword === keyword ? search : null
  const results = current?.items ?? []
  const notFound = current?.status === 'done' && results.length === 0
  const failed = current?.status === 'error'

  // 다음 장. 그사이 새로 검색했으면 늦게 온 결과는 버림
  const loadMore = () => {
    if (!current?.hasNext || current.loadingMore) return
    const page = current.page + 1
    setSearch({ ...current, loadingMore: true, moreFailed: false })
    searchHospitals(current.keyword, page)
      .then(({ items, hasNext, totalCount }) =>
        setSearch((prev) =>
          prev?.run === current.run
            ? {
                ...prev,
                items: addUnique(prev.items, items),
                page,
                hasNext,
                totalCount,
                loadingMore: false,
              }
            : prev,
        ),
      )
      .catch(() =>
        setSearch((prev) =>
          prev?.run === current.run ? { ...prev, loadingMore: false, moreFailed: true } : prev,
        ),
      )
  }

  const guide =
    keyword && !searchable
      ? '병원 이름을 두 글자 이상 적어 주세요'
      : current?.status === 'loading'
        ? '병원을 찾고 있어요'
        : results.length > 0
          ? `${current?.totalCount.toLocaleString('ko-KR')}곳을 찾았어요`
          : '건강보험심사평가원에 등록된 병원에서 찾아요'

  // 고르면 목록으로 돌아가 추가 시트를 엶
  const choose = (info: HospitalInfo, manual: boolean) => {
    setDraft({ info, manual })
    goBack()
  }

  const manualButton = (
    <button
      type="button"
      className="flex justify-center gap-1.5 py-2 text-sm leading-snug"
      onClick={() => choose({ name: keyword }, true)}
    >
      <span className="text-grey-600">찾는 병원이 없나요?</span>
      <span className="text-grey-700 font-bold">직접 적기</span>
    </button>
  )

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-2 pb-10 break-keep">
      <SubPageHeader title="병원 찾기" onBack={goBack} />

      <div className="mt-3 flex flex-col gap-3.5">
        <label className="bg-grey-100 rounded-key focus-within:ring-primary flex items-center gap-2 px-3.5 py-3 focus-within:ring-2">
          <img src={iconSearch} alt="" width={18} height={18} />
          <input
            value={query}
            maxLength={SEARCH_KEYWORD_MAX}
            autoFocus
            enterKeyHint="search"
            aria-label="병원 이름"
            placeholder="병원 이름을 적어 주세요"
            className="text-body-2 text-grey-900 placeholder:text-grey-400 min-w-0 flex-1 bg-transparent outline-none"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        {failed ? (
          // Figma C-21c 병원 검색이 안 됨
          <div className="flex flex-col gap-6 pt-16">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <p className="text-grey-900 text-lg leading-snug font-bold">
                병원 정보를 불러오지 못했어요
              </p>
              <p className="text-t7 text-grey-600">
                병원 검색이 잠시 원활하지 않아요.
                <br />
                잠시 뒤 다시 찾거나, 병원 이름을 직접 적어 주세요.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="text-subtitle-1 bg-primary h-14 rounded-xl leading-none font-bold text-white"
                onClick={() => setRetry((count) => count + 1)}
              >
                다시 찾기
              </button>
              <button
                type="button"
                className="text-grey-700 h-11 text-sm font-bold"
                onClick={() => choose({ name: keyword }, true)}
              >
                직접 적기
              </button>
            </div>
          </div>
        ) : notFound ? (
          <div className="flex flex-col gap-6 pt-16">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <p className="text-grey-900 text-lg leading-snug font-bold">
                ‘{keyword}’{objectParticle(keyword)} 찾지 못했어요
              </p>
              <p className="text-t7 text-grey-600">
                이름 일부만 넣어 다시 찾거나, 직접 적어 주세요.
              </p>
            </div>
            <button
              type="button"
              className="text-subtitle-1 bg-grey-100 text-grey-700 h-14 rounded-xl leading-none"
              onClick={() => choose({ name: keyword }, true)}
            >
              직접 적기
            </button>
          </div>
        ) : (
          <>
            <p className="text-t7 text-grey-600">{guide}</p>
            {results.length > 0 && (
              <ul className="border-grey-200 divide-grey-100 divide-y overflow-hidden rounded-2xl border">
                {results.map((item, index) => (
                  <li key={item.hiraCode ?? `${index}-${item.name}`}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 py-3.5 pr-4 pl-4.5 text-left"
                      onClick={() => choose(item, false)}
                    >
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-grey-900 text-base leading-snug font-bold">
                          {item.name}
                        </span>
                        <span className="text-t7 text-grey-600">
                          {[item.kind, item.address].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <img src={iconChevron} alt="" width={16} height={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {current?.moreFailed && (
              <p role="alert" className="text-t7 text-center text-red-500">
                더 불러오지 못했어요. 다시 눌러 주세요
              </p>
            )}
            {current?.hasNext && (
              <MorePostsButton
                loading={current.loadingMore}
                label="병원 더 보기"
                onClick={loadMore}
              />
            )}
            {manualButton}
          </>
        )}
      </div>
    </main>
  )
}

export default HospitalSearchPage
