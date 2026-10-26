import { useCallback, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import iconBack from '@/assets/icons/back.svg'
import iconGo from '@/assets/icons/community/go.svg'
import iconInfoSm from '@/assets/icons/community/info-sm.svg'
import iconPencil from '@/assets/icons/community/pencil.svg'
import iconRefresh from '@/assets/icons/community/refresh.svg'
import iconSearchHeader from '@/assets/icons/community/search-header.svg'
import BottomSheet from '@/components/common/BottomSheet'
import Toast from '@/components/common/Toast'
import BoardTabs, { type BoardTab } from '@/components/community/BoardTabs'
import CommunityEmpty from '@/components/community/CommunityEmpty'
import PostRow from '@/components/community/PostRow'
import SortToggle from '@/components/community/SortToggle'
import { BOARD_LABEL, BOARD_ORDER, LATEST_ONLY_BOARDS } from '@/constants/community'
import { ROUTES, communityBoardPath, communityPostPath } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useNow } from '@/hooks/useNow'
import { useOnline } from '@/hooks/useOnline'
import { useVisiblePosts } from '@/hooks/useVisiblePosts'
import type { BoardKey, PostSort } from '@/types/community'
import { sortPosts } from '@/utils/community'

const COMING_SOON = '다음 업데이트에서 열려요'

const GUIDE_RULES = [
  '내 경험과 하루를 편하게 나눠 주세요.',
  '진단·처방·약 용량 이야기는 다니는 병원에 물어봐 주세요.',
  '다른 분의 숫자와 비교하거나 평가하지 않아요.',
]

const isBoardKey = (value?: string): value is BoardKey => BOARD_ORDER.includes(value as BoardKey)

// Figma U-21 카테고리 게시판 · U-05 글 없음 · U-29 식단 게시판(최신순만)
function BoardPage() {
  const { board } = useParams()
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.COMMUNITY)
  const now = useNow()
  const { online, recheck } = useOnline()
  const posts = useVisiblePosts()
  const [sort, setSort] = useState<PostSort>('latest')
  const [guideOpen, setGuideOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])
  const closeGuide = useCallback(() => setGuideOpen(false), [])

  if (!isBoardKey(board)) return <Navigate to={ROUTES.COMMUNITY} replace />

  const label = BOARD_LABEL[board]
  const latestOnly = LATEST_ONLY_BOARDS.includes(board)
  const boardPosts = sortPosts(
    posts.filter((post) => post.board === board),
    latestOnly ? 'latest' : sort,
  )

  const selectTab = (tab: BoardTab) => {
    if (tab === board) return
    if (tab === 'all') navigate(ROUTES.COMMUNITY)
    else if (tab === 'popular') setToast(COMING_SOON)
    else navigate(communityBoardPath(tab), { replace: true })
  }

  const notices = [
    { title: `${label} 게시판 이렇게 써 주세요`, onClick: () => setGuideOpen(true) },
    {
      title: '커뮤니티 운영정책 (10.19 업데이트)',
      onClick: () => navigate(ROUTES.COMMUNITY_POLICY),
    },
  ]

  return (
    <main className="pt-12.5">
      <header className="flex h-14 items-center justify-between px-4">
        <button type="button" aria-label="뒤로" onClick={goBack}>
          <img src={iconBack} alt="" width={24} height={24} />
        </button>
        <h1 className="text-subtitle-1 text-grey-900 tracking-normal">커뮤니티</h1>
        <button
          type="button"
          aria-label="검색"
          onClick={() => navigate(ROUTES.COMMUNITY, { state: { focusSearch: true } })}
        >
          <img src={iconSearchHeader} alt="" width={24} height={24} />
        </button>
      </header>

      <BoardTabs active={board} onSelect={selectTab} />

      <p className="bg-grey-50 flex items-center gap-2 px-5 py-3.5">
        <img src={iconInfoSm} alt="" width={16} height={16} />
        <span className="text-grey-800 flex-1 text-sm leading-snug font-medium">
          진단·처방·약 이야기는 병원에 물어봐 주세요
        </span>
      </p>

      {!online ? (
        <CommunityEmpty
          variant="sorry"
          title="글을 불러오지 못했어요"
          description="인터넷 연결을 확인하고 다시 시도해 주세요."
          action={{ icon: iconRefresh, label: '다시 불러오기', onClick: recheck }}
        />
      ) : (
        <>
          <div className="flex justify-end px-5 pt-4 pb-1">
            {latestOnly ? (
              <p className="text-grey-500 text-xs leading-snug">
                최신순 · {label} 게시판은 인기순을 쓰지 않아요
              </p>
            ) : (
              <SortToggle value={sort} onChange={setSort} />
            )}
          </div>

          <ul className="px-5">
            {notices.map(({ title, onClick }) => (
              <li key={title}>
                <button
                  type="button"
                  className="border-grey-100 flex w-full flex-col items-start gap-2 border-b py-4.5 text-left"
                  onClick={onClick}
                >
                  <span className="bg-grey-100 text-grey-700 rounded-md px-2 py-0.5 text-xs leading-snug font-medium">
                    공지사항
                  </span>
                  <span className="text-grey-900 text-base leading-snug font-bold">{title}</span>
                  <span className="text-t7 text-grey-500 flex items-center gap-0.5 leading-snug font-medium">
                    보러가기
                    <img src={iconGo} alt="" width={12} height={12} />
                  </span>
                </button>
              </li>
            ))}
            {boardPosts.map((post) => (
              <li key={post.id}>
                <PostRow
                  post={post}
                  now={now}
                  showBody={latestOnly}
                  onClick={() => navigate(communityPostPath(post.id))}
                />
              </li>
            ))}
          </ul>

          {boardPosts.length === 0 && (
            <CommunityEmpty
              variant="front"
              title="아직 글이 없어요"
              description="비슷한 시기를 지나는 분들께 첫 이야기를 남겨 주세요."
              action={{
                icon: iconPencil,
                label: '첫 글 쓰기',
                onClick: () => navigate(`${ROUTES.COMMUNITY_WRITE}?board=${board}`),
              }}
            />
          )}
        </>
      )}

      {guideOpen && (
        <BottomSheet label={`${label} 게시판 안내`} onClose={closeGuide}>
          <h2 className="text-t4 text-grey-900">{label} 게시판 이렇게 써 주세요</h2>
          <ul className="text-body-2 text-grey-700 flex list-disc flex-col gap-1.5 pl-5 font-normal">
            {GUIDE_RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
          <button
            type="button"
            className="text-subtitle-1 bg-grey-100 text-grey-700 h-14 rounded-xl leading-none"
            onClick={closeGuide}
          >
            확인
          </button>
        </BottomSheet>
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default BoardPage
