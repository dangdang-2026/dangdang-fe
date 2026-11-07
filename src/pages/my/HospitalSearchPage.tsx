import { useState } from 'react'
import iconSearch from '@/assets/icons/search.svg'
import iconChevron from '@/assets/icons/postpartum/chevron-md.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { MOCK_HOSPITAL_DIRECTORY } from '@/mocks/hospital'
import { useHospitalStore } from '@/stores/useHospitalStore'
import type { HospitalInfo } from '@/types/hospital'
import { objectParticle } from '@/utils/josa'

// Figma C-21 병원 찾기 · C-22 찾는 병원 없음. 심평원 연동 전까지 목업 목록에서 찾음
function HospitalSearchPage() {
  const goBack = useGoBack(ROUTES.MY_HOSPITALS)
  const setDraft = useHospitalStore((state) => state.setDraft)
  const [query, setQuery] = useState('')
  const keyword = query.trim()
  const results = keyword
    ? MOCK_HOSPITAL_DIRECTORY.filter((item) =>
        item.name.replace(/\s/g, '').includes(keyword.replace(/\s/g, '')),
      )
    : []

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
            autoFocus
            enterKeyHint="search"
            aria-label="병원 이름"
            placeholder="병원 이름을 적어 주세요"
            className="text-body-2 text-grey-900 placeholder:text-grey-400 min-w-0 flex-1 bg-transparent outline-none"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        {keyword && results.length === 0 ? (
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
            <p className="text-t7 text-grey-600">건강보험심사평가원에 등록된 병원에서 찾아요</p>
            {results.length > 0 && (
              <ul className="border-grey-200 divide-grey-100 divide-y overflow-hidden rounded-2xl border">
                {results.map((item) => (
                  <li key={item.name}>
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
