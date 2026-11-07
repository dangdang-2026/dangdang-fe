import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import iconAskPencil from '@/assets/icons/community/ask-pencil.svg'
import iconCorrection from '@/assets/icons/community/correction.svg'
import iconNewsCheck from '@/assets/icons/community/news-check.svg'
import iconNewsLike from '@/assets/icons/community/news-like.svg'
import iconNewsLink from '@/assets/icons/community/news-link.svg'
import iconNewsSave from '@/assets/icons/community/news-save.svg'
import iconSourceArrow from '@/assets/icons/community/source-arrow.svg'
import iconSourceInfo from '@/assets/icons/community/source-info.svg'
import iconWithdrawn from '@/assets/icons/community/withdrawn.svg'
import BottomSheet from '@/components/common/BottomSheet'
import SubPageHeader from '@/components/common/SubPageHeader'
import Toast from '@/components/common/Toast'
import NewsAskSheet from '@/components/community/NewsAskSheet'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { MOCK_NEWS } from '@/mocks/news'
import { useCommunityStore } from '@/stores/useCommunityStore'
import { useVisitStore } from '@/stores/useVisitStore'
import { parseDateKey } from '@/utils/date'

// 예: 10/19
const formatShortDate = (key: string) => {
  const date = parseDateKey(key)
  return date ? `${date.getMonth() + 1}/${date.getDate()}` : ''
}

// Figma U-26 당당 소식 카드뉴스 상세 · U-26b 정정된 카드 · U-26c 내려간 카드 · U-28 물어볼 것에 적기
function NewsDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.COMMUNITY_NEWS)
  const card = MOCK_NEWS.find((item) => item.id === id)
  const likedNewsIds = useCommunityStore((state) => state.likedNewsIds)
  const savedNewsIds = useCommunityStore((state) => state.savedNewsIds)
  const toggleLikeNews = useCommunityStore((state) => state.toggleLikeNews)
  const toggleSaveNews = useCommunityStore((state) => state.toggleSaveNews)
  const addQuestion = useVisitStore((state) => state.addQuestion)
  const [slide, setSlide] = useState(0)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [askOpen, setAskOpen] = useState(false)
  const [correctionOpen, setCorrectionOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = () => setToast(null)
  const closeSources = () => setSourcesOpen(false)
  const closeAsk = () => setAskOpen(false)

  if (!card) return <Navigate to={ROUTES.COMMUNITY_NEWS} replace />

  // 출처를 다시 확인하느라 내린 카드
  if (card.withdrawn) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-13 pb-32">
        <SubPageHeader title="당당 소식" onBack={goBack} />
        <div className="flex flex-col items-center gap-3 pt-35 text-center">
          <img src={iconWithdrawn} alt="" width={40} height={40} />
          <h2 className="text-grey-900 text-lg leading-snug font-bold">
            이 카드는 다시 확인하고 있어요
          </h2>
          <p className="text-grey-700 text-sm leading-snug">
            출처를 다시 확인하는 동안 잠시 내렸어요.
            <br />
            다른 공식 자료는 진료 탭 › 공식 자료에서 볼 수 있어요.
          </p>
        </div>
        <div className="border-grey-100 fixed bottom-0 left-1/2 w-full max-w-107.5 -translate-x-1/2 border-t bg-white px-5 pt-2.5 pb-[max(--spacing(4),env(safe-area-inset-bottom))]">
          <button
            type="button"
            className="bg-primary rounded-key h-13 w-full text-base leading-snug font-bold text-white"
            onClick={() => navigate(ROUTES.COMMUNITY_NEWS)}
          >
            당당 소식 모아보기
          </button>
        </div>
      </main>
    )
  }

  const liked = likedNewsIds.includes(card.id)
  const saved = savedNewsIds.includes(card.id)
  const checkedAt = formatShortDate(card.checkedAt)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setToast('링크를 복사했어요')
    } catch {
      setToast('링크를 복사하지 못했어요')
    }
  }

  const actions = [
    {
      icon: iconNewsLike,
      label: '공감',
      active: liked,
      onClick: () => toggleLikeNews(card.id),
    },
    {
      icon: iconNewsSave,
      label: saved ? '저장됨' : '저장',
      active: saved,
      onClick: () => {
        toggleSaveNews(card.id)
        setToast(saved ? '저장을 풀었어요' : '저장한 카드에 담았어요')
      },
    },
    { icon: iconNewsLink, label: '링크 복사', active: false, onClick: copyLink },
  ]

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-32">
      <SubPageHeader title="당당 소식" onBack={goBack} />

      <article className="mt-3 flex flex-col gap-4">
        {card.correction && (
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-blue-50 py-3 pr-3 pl-3.5 text-left text-sm leading-snug text-blue-700"
            onClick={() => setCorrectionOpen(true)}
          >
            <img src={iconCorrection} alt="" width={16} height={16} />
            <span className="flex-1 font-bold">
              {formatShortDate(card.correction.on)} 정정 · {card.correction.summary}
            </span>
            <span className="font-medium">고친 내용 ›</span>
          </button>
        )}
        <p className="flex items-center gap-1.5 text-xs leading-snug">
          <span className="text-grey-800 flex items-center gap-1 rounded-md bg-yellow-50 px-2 py-0.5 font-bold">
            <img src={iconNewsCheck} alt="" width={12} height={12} />
            당당 공식
          </span>
          <span className="text-grey-500 font-medium">
            {card.series} · {checkedAt}
          </span>
        </p>
        <h2 className="text-t3 text-grey-900 leading-snug">{card.title}</h2>

        {/* 옆으로 넘기는 카드. 스크롤 위치로 몇 번째인지 셈 */}
        <ul
          aria-label="카드"
          className="-mx-5 flex snap-x snap-mandatory [scrollbar-width:none] gap-3 overflow-x-auto px-5"
          onScroll={(event) => {
            const { scrollLeft, clientWidth } = event.currentTarget
            setSlide(Math.round(scrollLeft / (clientWidth - 28)))
          }}
        >
          {card.slides.map((item, index) => (
            <li
              key={item.headline}
              aria-label={`${index + 1} / ${card.slides.length}`}
              className="rounded-banner flex h-100 w-full shrink-0 snap-center flex-col gap-3.5 bg-yellow-50 p-6"
            >
              <p className="flex justify-between text-xs leading-snug">
                <span className="text-grey-800 font-bold">{item.eyebrow}</span>
                <span className="text-grey-500 font-medium">
                  {index + 1} / {card.slides.length}
                </span>
              </p>
              {item.source && (
                <p className="text-grey-700 text-base leading-snug font-bold">{item.source}</p>
              )}
              <p className="text-grey-900 text-title-2 leading-snug break-keep">{item.headline}</p>
              <p className="text-grey-700 text-base leading-snug font-medium break-keep">
                {item.body}
              </p>
              {index < card.slides.length - 1 && (
                <p className="text-t7 text-grey-500 mt-auto font-medium">넘겨서 다음 카드 보기 →</p>
              )}
            </li>
          ))}
        </ul>
        <p aria-hidden className="flex justify-center gap-1.5">
          {card.slides.map((item, index) => (
            <span
              key={item.headline}
              className={`h-1.5 rounded-full ${index === slide ? 'bg-primary w-4.5' : 'bg-grey-300 w-1.5'}`}
            />
          ))}
        </p>

        <button
          type="button"
          className="bg-grey-100 flex items-center gap-2 rounded-xl py-3 pr-3 pl-3.5 text-left"
          onClick={() => setSourcesOpen(true)}
        >
          <img src={iconSourceInfo} alt="" width={16} height={16} />
          <span className="text-t7 text-grey-700 flex-1 font-medium">
            출처 {card.sources.length}곳 · 확인일 {checkedAt}
          </span>
          <img src={iconSourceArrow} alt="" width={14} height={14} />
        </button>

        <div className="flex gap-2">
          {actions.map(({ icon, label, active, onClick }) => (
            <button
              key={label}
              type="button"
              aria-pressed={active}
              className={`text-t7 flex items-center gap-1.5 rounded-full border py-2 pr-3.5 pl-3 ${
                active
                  ? 'border-primary text-grey-900 font-bold'
                  : 'border-grey-200 text-grey-700 font-medium'
              }`}
              onClick={onClick}
            >
              <img src={icon} alt="" width={16} height={16} />
              {label}
            </button>
          ))}
        </div>
        <p className="text-grey-500 text-xs leading-snug">
          일반 정보예요. 내 몸에 맞는 기준은 진료 때 물어봐 주세요.
        </p>
      </article>

      <div className="border-grey-100 fixed bottom-0 left-1/2 w-full max-w-107.5 -translate-x-1/2 border-t bg-white px-5 pt-2.5 pb-[max(--spacing(4),env(safe-area-inset-bottom))]">
        <button
          type="button"
          className="bg-primary rounded-key flex h-13 w-full items-center justify-center gap-1.5 text-base leading-snug font-bold text-white"
          onClick={() => setAskOpen(true)}
        >
          <img src={iconAskPencil} alt="" width={18} height={18} />
          물어볼 것에 적기
        </button>
      </div>

      {correctionOpen && card.correction && (
        <BottomSheet label="고친 내용" onClose={() => setCorrectionOpen(false)}>
          <h2 className="text-t4 text-grey-900">{formatShortDate(card.correction.on)} 고친 내용</h2>
          <p className="text-body-2 text-grey-800 font-normal">{card.correction.detail}</p>
          <button
            type="button"
            className="bg-grey-100 text-grey-800 rounded-key py-4 text-base leading-snug font-bold"
            onClick={() => setCorrectionOpen(false)}
          >
            닫기
          </button>
        </BottomSheet>
      )}
      {sourcesOpen && (
        <BottomSheet label="출처" onClose={closeSources}>
          <h2 className="text-t4 text-grey-900">출처 {card.sources.length}곳</h2>
          <ul className="text-body-2 text-grey-800 flex list-disc flex-col gap-1.5 pl-5 font-normal">
            {card.sources.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
          <p className="text-t7 text-grey-500">확인일 {checkedAt} · 바뀌면 다시 확인해 고쳐요</p>
          <button
            type="button"
            className="bg-grey-100 text-grey-800 rounded-key py-4 text-base leading-snug font-bold"
            onClick={closeSources}
          >
            닫기
          </button>
        </BottomSheet>
      )}
      {askOpen && (
        <NewsAskSheet
          questions={card.questions}
          onSubmit={(questions) => {
            questions.forEach((question) => addQuestion(question))
            setAskOpen(false)
            setToast(`진료 탭 물어볼 것에 ${questions.length}개 적었어요`)
          }}
          onClose={closeAsk}
        />
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default NewsDetailPage
