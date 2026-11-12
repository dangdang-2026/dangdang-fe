import { useEffect, useState } from 'react'
import { SEARCH_KEYWORD_MAX, SEARCH_KEYWORD_MIN, searchHospitals } from '@/api/careSites'
import iconSearch from '@/assets/icons/search.svg'
import iconChevron from '@/assets/icons/postpartum/chevron-md.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useHospitalStore } from '@/stores/useHospitalStore'
import type { HospitalInfo } from '@/types/hospital'
import { objectParticle } from '@/utils/josa'

// 입력을 멈추고 기다렸다 찾음. 글자마다 서버를 부르지 않게
const SEARCH_DELAY_MS = 300

type SearchResult = {
  keyword: string
  status: 'loading' | 'done' | 'error'
  items: HospitalInfo[]
}

// Figma C-21 병원 찾기 · C-22 찾는 병원 없음. 심평원에 등록된 병원에서 찾음
function HospitalSearchPage() {
  const goBack = useGoBack(ROUTES.MY_HOSPITALS)
  const setDraft = useHospitalStore((state) => state.setDraft)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState<SearchResult | null>(null)
  const keyword = query.trim()
  const searchable = keyword.length >= SEARCH_KEYWORD_MIN

  useEffect(() => {
    if (!searchable) return
    // 늦게 온 이전 검색어 결과는 버림
    let stale = false
    const timer = window.setTimeout(() => {
      setSearch({ keyword, status: 'loading', items: [] })
      searchHospitals(keyword)
        .then((items) => {
          if (!stale) setSearch({ keyword, status: 'done', items })
        })
        .catch(() => {
          // 심평원 연결이 안 되면(CARE_SITE_50201) 직접 적기로 안내
          if (!stale) setSearch({ keyword, status: 'error', items: [] })
        })
    }, SEARCH_DELAY_MS)
    return () => {
      stale = true
      window.clearTimeout(timer)
    }
  }, [keyword, searchable])

  // 지금 검색어의 결과만 보여 줌
  const current = searchable && search?.keyword === keyword ? search : null
  const results = current?.items ?? []
  const notFound = current?.status === 'done' && results.length === 0
  const failed = current?.status === 'error'

  const guide =
    keyword && !searchable
      ? '병원 이름을 두 글자 이상 적어 주세요'
      : current?.status === 'loading'
        ? '병원을 찾고 있어요'
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
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-10 break-keep">
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

        {notFound || failed ? (
          <div className="flex flex-col gap-6 pt-16">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <p className="text-grey-900 text-lg leading-snug font-bold">
                {failed
                  ? '지금은 병원을 찾을 수 없어요'
                  : `‘${keyword}’${objectParticle(keyword)} 찾지 못했어요`}
              </p>
              <p className="text-t7 text-grey-600">
                {failed
                  ? '잠시 후 다시 찾거나, 직접 적어 주세요.'
                  : '이름 일부만 넣어 다시 찾거나, 직접 적어 주세요.'}
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
                {results.map((item) => (
                  <li key={item.hiraCode ?? item.name}>
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
            {manualButton}
          </>
        )}
      </div>
    </main>
  )
}

export default HospitalSearchPage
