import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import iconCatAll from '@/assets/icons/community/cat-all.svg'
import iconCatNews from '@/assets/icons/community/cat-news.svg'
import iconCatPopular from '@/assets/icons/community/cat-popular.svg'
import iconInfo from '@/assets/icons/community/info.svg'
import iconNoticeClose from '@/assets/icons/community/notice-close.svg'
import iconPencil from '@/assets/icons/community/pencil.svg'
import iconRefresh from '@/assets/icons/community/refresh.svg'
import iconSearch from '@/assets/icons/community/search.svg'
import iconBell from '@/assets/icons/my/bell.svg'
import Toast from '@/components/common/Toast'
import CommunityEmpty from '@/components/community/CommunityEmpty'
import NicknameSheet from '@/components/community/NicknameSheet'
import PostCard from '@/components/community/PostCard'
import SortToggle from '@/components/community/SortToggle'
import { BOARD_ICON, BOARD_LABEL, BOARD_ORDER } from '@/constants/community'
import { ROUTES, communityBoardPath, communityPostPath } from '@/constants/routes'
import { useNow } from '@/hooks/useNow'
import { useOnline } from '@/hooks/useOnline'
import { useVisiblePosts } from '@/hooks/useVisiblePosts'
import { useCommunityStore } from '@/stores/useCommunityStore'
import type { PostSort } from '@/types/community'
import { sortPosts } from '@/utils/community'

const COMING_SOON = '다음 업데이트에서 열려요'

type Category = { key: string; label: string; icon: string; onClick: () => void }

// Figma U-01 커뮤니티 메인 · U-08 불러오지 못함
function CommunityPage() {
  const navigate = useNavigate()
  const now = useNow()
  const { online, recheck } = useOnline()
  const posts = useVisiblePosts()
  const noticeDismissed = useCommunityStore((state) => state.noticeDismissed)
  const dismissNotice = useCommunityStore((state) => state.dismissNotice)
  const nickname = useCommunityStore((state) => state.nickname)
  const setNickname = useCommunityStore((state) => state.setNickname)
  const [sort, setSort] = useState<PostSort>('popular')
  // 닉네임이 없으면 처음 들어올 때 바로 정하기
  const [nicknameOpen, setNicknameOpen] = useState(nickname === null)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])
  const closeNickname = useCallback(() => setNicknameOpen(false), [])

  const comingSoon = () => setToast(COMING_SOON)
  // 글쓰기는 닉네임을 정한 뒤에
  const startWriting = () => {
    if (nickname) navigate(ROUTES.COMMUNITY_WRITE)
    else setNicknameOpen(true)
  }
  const categories: Category[] = [
    // 검색·인기·당당 소식은 다음 이슈
    { key: 'news', label: '당당 소식', icon: iconCatNews, onClick: comingSoon },
    { key: 'popular', label: '인기', icon: iconCatPopular, onClick: comingSoon },
    ...BOARD_ORDER.flatMap((board) => {
      const icon = BOARD_ICON[board]
      if (!icon) return []
      return [
        {
          key: board,
          label: BOARD_LABEL[board],
          icon,
          onClick: () => navigate(communityBoardPath(board)),
        },
      ]
    }),
  ]

  return (
    <main className="pt-12.5">
      <header className="flex items-center justify-between px-5 py-2">
        <h1 className="text-t3 text-grey-900">커뮤니티</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="알림 설정"
            onClick={() => navigate(ROUTES.MY_NOTIFICATIONS)}
          >
            <img src={iconBell} alt="" width={24} height={24} />
          </button>
          <button
            type="button"
            className="bg-primary text-grey-900 flex items-center gap-1 rounded-full py-1.5 pr-3.5 pl-3 text-sm leading-snug font-bold"
            onClick={startWriting}
          >
            <img src={iconPencil} alt="" width={16} height={16} />
            글쓰기
          </button>
        </div>
      </header>

      <div className="px-5 pt-2 pb-3">
        <button
          type="button"
          className="bg-grey-50 flex w-full items-center gap-2 rounded-xl px-3.5 py-3 text-left"
          onClick={comingSoon}
        >
          <img src={iconSearch} alt="" width={20} height={20} />
          <span className="text-body-2 text-grey-400 font-normal">궁금한 걸 검색해 보세요</span>
        </button>
      </div>

      <nav
        aria-label="카테고리"
        className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-4 pt-1.5 pb-3.5"
      >
        <span className="flex w-16 shrink-0 flex-col items-center gap-1.5">
          <span className="border-primary flex size-13 items-center justify-center rounded-2xl border-2 bg-yellow-100">
            <img src={iconCatAll} alt="" width={28} height={28} />
          </span>
          <span className="text-grey-900 text-xs leading-snug font-bold">전체</span>
        </span>
        {categories.map(({ key, label, icon, onClick }) => (
          <button
            key={key}
            type="button"
            className="flex w-16 shrink-0 flex-col items-center gap-1.5"
            onClick={onClick}
          >
            <span className="flex size-13 items-center justify-center rounded-2xl bg-yellow-50">
              <img src={icon} alt="" width={28} height={28} />
            </span>
            <span className="text-grey-700 text-xs leading-snug font-medium">{label}</span>
          </button>
        ))}
      </nav>

      {!online ? (
        <CommunityEmpty
          variant="sorry"
          title="글을 불러오지 못했어요"
          description="인터넷 연결을 확인하고 다시 시도해 주세요."
          action={{ icon: iconRefresh, label: '다시 불러오기', onClick: recheck }}
        />
      ) : (
        <>
          {!noticeDismissed && (
            <div className="px-5 pb-2">
              <p className="bg-grey-50 flex items-center gap-2 rounded-full py-2.5 pr-3 pl-3.5">
                <img src={iconInfo} alt="" width={18} height={18} />
                <span className="text-t7 text-grey-700 flex-1 leading-snug font-medium">
                  진단·처방·약 이야기는 병원에 물어봐 주세요
                </span>
                <button type="button" aria-label="안내 닫기" onClick={dismissNotice}>
                  <img src={iconNoticeClose} alt="" width={16} height={16} />
                </button>
              </p>
            </div>
          )}

          <div className="border-grey-50 mt-2 flex justify-end border-t-8 px-5 pt-2.5 pb-1.5">
            <SortToggle value={sort} onChange={setSort} />
          </div>
          <ul>
            {sortPosts(posts, sort).map((post) => (
              <li key={post.id}>
                <PostCard
                  post={post}
                  now={now}
                  onClick={() => navigate(communityPostPath(post.id))}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {nicknameOpen && (
        <NicknameSheet
          mode="first"
          current={nickname}
          onSubmit={(name, showWeek) => {
            setNickname(name, showWeek)
            setNicknameOpen(false)
            setToast(`‘${name}’ 님, 반가워요`)
          }}
          onPolicy={comingSoon}
          onClose={closeNickname}
        />
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default CommunityPage
