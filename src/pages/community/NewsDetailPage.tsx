import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { getErrorCode } from '@/api/axios'
import { getCard, reactCard, saveCard, unreactCard, unsaveCard } from '@/api/cards'
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
import { saveQuestion } from '@/stores/useVisitStore'
import type { NewsCard } from '@/types/news'
import { parseDateKey } from '@/utils/date'

// 예: 10/19
const formatShortDate = (key: string) => {
  const date = parseDateKey(key)
  return date ? `${date.getMonth() + 1}/${date.getDate()}` : ''
}

// 서버 카드 하나. 받기 전 undefined, 실패하면 null
function useCard(id: string | undefined) {
  const [result, setResult] = useState<{ id: string; card: NewsCard | null } | null>(null)
  useEffect(() => {
    if (!id) return
    let stale = false
    getCard(id)
      .then((card) => {
        if (!stale) setResult({ id, card })
      })
      .catch(() => {
        if (!stale) setResult({ id, card: null })
      })
    return () => {
      stale = true
    }
  }, [id])
  return id && result?.id === id ? result.card : id ? undefined : null
}

// Figma U-26 당당 소식 카드뉴스 상세 · U-26b 정정된 카드 · U-26c 내려간 카드 · U-28 물어볼 것에 적기
function NewsDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.COMMUNITY_NEWS)
  const card = useCard(id)
  // 공감 · 저장을 누른 뒤 값. 누르기 전엔 서버 값
  const [reactedNow, setReactedNow] = useState<{ id: string; reacted: boolean } | null>(null)
  // 공감 요청이 오가는 동안은 다시 누르지 않게. 공감 · 취소가 엇갈려 서버와 화면이 어긋나지 않게
  const [likePending, setLikePending] = useState(false)
  const [savedNow, setSavedNow] = useState<{ id: string; saved: boolean } | null>(null)
  const [slide, setSlide] = useState(0)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [askOpen, setAskOpen] = useState(false)
  const [correctionOpen, setCorrectionOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = () => setToast(null)
  const closeSources = () => setSourcesOpen(false)
  const closeAsk = () => setAskOpen(false)

  // 받는 중이거나 못 받았으면 안내만
  if (!card) {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-2 pb-32">
        <SubPageHeader title="당당 소식" onBack={goBack} />
        <p className="text-grey-500 py-16 text-center text-sm leading-normal">
          {card === undefined
            ? '소식을 불러오는 중이에요'
            : '소식을 불러오지 못했어요. 잠시 후 다시 열어 주세요'}
        </p>
      </main>
    )
  }

  // 출처를 다시 확인하느라 내린 카드
  if (card.withdrawn) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-2 pb-32">
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

  const liked = reactedNow?.id === card.id ? reactedNow.reacted : !!card.reacted
  const saved = savedNow?.id === card.id ? savedNow.saved : !!card.saved

  // 화면엔 바로 바꾸고 서버에 못 남기면 되돌림
  const toggleSave = () => {
    const next = !saved
    setSavedNow({ id: card.id, saved: next })
    setToast(next ? '저장한 카드에 담았어요' : '저장을 풀었어요')
    ;(next ? saveCard(card.id) : unsaveCard(card.id)).catch((error) => {
      setSavedNow({ id: card.id, saved })
      setToast(
        getErrorCode(error) === 'CARD_40901'
          ? '내려간 카드라 저장할 수 없어요'
          : '저장하지 못했어요. 잠시 후 다시 시도해 주세요',
      )
    })
  }

  // 공감도 화면엔 바로 바꾸고 서버에 못 남기면 되돌림. 공감 수는 보여 주지 않음
  const toggleLike = () => {
    if (likePending) return
    setLikePending(true)
    const next = !liked
    setReactedNow({ id: card.id, reacted: next })
    ;(next ? reactCard(card.id) : unreactCard(card.id))
      .catch((error) => {
        setReactedNow({ id: card.id, reacted: liked })
        setToast(
          getErrorCode(error) === 'CARD_40903'
            ? '내려간 카드라 공감할 수 없어요'
            : '공감하지 못했어요. 잠시 후 다시 시도해 주세요',
        )
      })
      .finally(() => setLikePending(false))
  }
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
      onClick: toggleLike,
    },
    {
      icon: iconNewsSave,
      label: saved ? '저장됨' : '저장',
      active: saved,
      onClick: toggleSave,
    },
    { icon: iconNewsLink, label: '링크 복사', active: false, onClick: copyLink },
  ]

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-2 pb-32">
      <SubPageHeader title="당당 소식" onBack={goBack} />

      <article className="mt-3 flex flex-col gap-4">
        {/* 자세히가 있으면 눌러서 보는 띠, 없으면 요약 띠만 */}
        {card.correction &&
          (card.correction.detail ? (
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
          ) : (
            <p className="flex items-center gap-2 rounded-xl bg-blue-50 py-3 pr-3 pl-3.5 text-sm leading-snug text-blue-700">
              <img src={iconCorrection} alt="" width={16} height={16} />
              <span className="flex-1 font-bold">
                {formatShortDate(card.correction.on)} 정정 · {card.correction.summary}
              </span>
            </p>
          ))}
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

      {correctionOpen && card.correction?.detail && (
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
            setAskOpen(false)
            setToast(`진료 탭 물어볼 것에 ${questions.length}개 적었어요`)
            Promise.all(questions.map((question) => saveQuestion(question))).catch(() =>
              setToast('물어볼 것을 저장하지 못했어요. 잠시 후 다시 시도해 주세요'),
            )
          }}
          onClose={closeAsk}
        />
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default NewsDetailPage
