import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import iconBack from '@/assets/icons/back.svg'
import iconAvatar from '@/assets/icons/community/avatar-lg.svg'
import iconCommentBar from '@/assets/icons/community/comment-bar.svg'
import iconDots from '@/assets/icons/community/dots.svg'
import iconHeart from '@/assets/icons/community/heart.svg'
import iconHeartBar from '@/assets/icons/community/heart-bar.svg'
import iconHiddenPost from '@/assets/icons/community/hidden-post.svg'
import iconPathChevron from '@/assets/icons/community/path-chevron.svg'
import iconSearchMd from '@/assets/icons/community/search-md.svg'
import iconShare from '@/assets/icons/community/share.svg'
import iconUp from '@/assets/icons/community/up.svg'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Toast from '@/components/common/Toast'
import AuthorBadge from '@/components/community/AuthorBadge'
import CommentComposer from '@/components/community/CommentComposer'
import CommentItem from '@/components/community/CommentItem'
import PostMoreSheet from '@/components/community/PostMoreSheet'
import ReportSheet from '@/components/community/ReportSheet'
import RestrictedSheet from '@/components/community/RestrictedSheet'
import { BOARD_LABEL, MY_AUTHOR_ID } from '@/constants/community'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useMyAuthor } from '@/hooks/useMyAuthor'
import { useNow } from '@/hooks/useNow'
import { useCommunityStore } from '@/stores/useCommunityStore'
import type { CommunityComment } from '@/types/community'
import {
  formatAuthorWeek,
  formatCount,
  formatRelativeTime,
  getBestComment,
} from '@/utils/community'

const COMING_SOON = '다음 업데이트에서 열려요'

// 원 댓글 시간순, 답글은 원 댓글 바로 아래
function orderComments(comments: CommunityComment[]) {
  const byTime = [...comments].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return byTime
    .filter((item) => !item.parentId)
    .flatMap((parent) => [parent, ...byTime.filter((item) => item.parentId === parent.id)])
}

// 댓글 쓰기 대상. parentId가 없으면 글에 댓글
type Composing = { parentId?: string; replyTo: string | null }

// 더보기에서 띄우는 확인창
type Confirming = 'delete' | 'block'

// Figma U-02 글 보기 · U-02b 댓글 · U-18 댓글 쓰는 중 · U-31 내 댓글 삭제 확인
// U-10·U-11 더보기 · U-12·U-13 신고 · U-14 가려진 글 · U-19 글 삭제 · U-20 안 보기
function PostDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.COMMUNITY)
  const now = useNow()
  const me = useMyAuthor()
  const post = useCommunityStore((state) => state.posts.find((item) => item.id === id))
  const likedPostIds = useCommunityStore((state) => state.likedPostIds)
  const likedCommentIds = useCommunityStore((state) => state.likedCommentIds)
  const viewPost = useCommunityStore((state) => state.viewPost)
  const toggleLikePost = useCommunityStore((state) => state.toggleLikePost)
  const toggleLikeComment = useCommunityStore((state) => state.toggleLikeComment)
  const addComment = useCommunityStore((state) => state.addComment)
  const removeComment = useCommunityStore((state) => state.removeComment)
  const restrictedUntil = useCommunityStore((state) => state.restrictedUntil)
  const blockedAuthors = useCommunityStore((state) => state.blockedAuthors)
  const removePost = useCommunityStore((state) => state.removePost)
  const reportPost = useCommunityStore((state) => state.reportPost)
  const blockAuthor = useCommunityStore((state) => state.blockAuthor)
  const [moreOpen, setMoreOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [confirming, setConfirming] = useState<Confirming | null>(null)
  const [restrictedOpen, setRestrictedOpen] = useState(false)
  const [composing, setComposing] = useState<Composing | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])
  const closeComposer = useCallback(() => setComposing(null), [])
  const closeDelete = useCallback(() => setDeletingId(null), [])
  const closeRestricted = useCallback(() => setRestrictedOpen(false), [])
  const closeMore = useCallback(() => setMoreOpen(false), [])
  const closeReport = useCallback(() => setReportOpen(false), [])
  const closeConfirming = useCallback(() => setConfirming(null), [])

  // 들어올 때 조회수 1 올림. 개발 모드 이중 실행에도 한 번만
  const viewedId = useRef<string | null>(null)
  useEffect(() => {
    if (viewedId.current === id) return
    viewedId.current = id
    viewPost(id)
  }, [id, viewPost])

  if (!post) return <Navigate to={ROUTES.COMMUNITY} replace />

  const liked = likedPostIds.includes(post.id)
  const best = getBestComment(post)
  const week = formatAuthorWeek(post.author)
  const mine = post.author.id === MY_AUTHOR_ID
  const blockedIds = new Set(blockedAuthors.map((author) => author.id))
  const comments = orderComments(post.comments.filter((item) => !blockedIds.has(item.author.id)))

  // 더보기 시트를 닫고 다음 단계로
  const fromMore = (next: () => void) => () => {
    setMoreOpen(false)
    next()
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setToast('링크를 복사했어요')
    } catch {
      setToast('링크를 복사하지 못했어요')
    }
  }

  // 닉네임을 정해야 댓글을 남길 수 있음
  const startComment = (target: Composing) => {
    if (!me) setToast('커뮤니티 첫 화면에서 닉네임을 먼저 정해 주세요')
    else if (restrictedUntil && new Date(restrictedUntil) > new Date()) setRestrictedOpen(true)
    else setComposing(target)
  }

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: post.title, url })
      else {
        await navigator.clipboard.writeText(url)
        setToast('링크를 복사했어요')
      }
    } catch {
      // 공유 창을 닫으면 아무것도 안 함
    }
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white pt-12.5 pb-24">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-white px-4">
        <button type="button" aria-label="뒤로" onClick={goBack}>
          <img src={iconBack} alt="" width={24} height={24} />
        </button>
        <h1 className="text-subtitle-1 text-grey-900 tracking-normal">{BOARD_LABEL[post.board]}</h1>
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            aria-label="검색"
            onClick={() => navigate(ROUTES.COMMUNITY, { state: { focusSearch: true } })}
          >
            <img src={iconSearchMd} alt="" width={22} height={22} />
          </button>
          <button type="button" aria-label="더보기" onClick={() => setMoreOpen(true)}>
            <img src={iconDots} alt="" width={22} height={22} />
          </button>
        </div>
      </header>

      {post.hidden ? (
        <section className="flex flex-col items-center gap-2.5 px-6 pt-20 text-center">
          <img src={iconHiddenPost} alt="" width={40} height={40} />
          <h2 className="text-subtitle-1 text-grey-900 tracking-normal">
            운영정책에 따라 가려진 글이에요
          </h2>
          <p className="text-grey-600 text-sm leading-relaxed">
            약 이름·용량을 권하는 내용이 있었어요.
            <br />
            약은 꼭 병원에 물어봐 주세요.
          </p>
          <button
            type="button"
            className="text-grey-600 text-sm leading-snug font-medium underline"
            onClick={() => navigate(ROUTES.COMMUNITY_POLICY)}
          >
            운영정책 보기 ›
          </button>
        </section>
      ) : (
        <>
          <article className="flex flex-col gap-3.5 px-5 pt-3 pb-5">
            <p className="flex items-center gap-1.5 text-xs leading-snug">
              <span className="text-grey-800 rounded-md bg-yellow-50 px-2 py-0.5 font-bold">
                커뮤니티
              </span>
              <img src={iconPathChevron} alt="" width={14} height={14} />
              <span className="bg-grey-100 text-grey-700 rounded-md px-2 py-0.5 font-medium">
                {BOARD_LABEL[post.board]}
              </span>
            </p>
            <h2 className="text-t4 text-grey-900 leading-snug">{post.title}</h2>
            <div className="border-grey-100 flex items-center gap-2.5 border-b pb-3.5">
              <img src={iconAvatar} alt="" width={40} height={40} />
              <div className="flex flex-col gap-0.5 leading-snug">
                <p className="flex items-center gap-1.5">
                  <span className="text-grey-800 text-sm font-medium">{post.author.nickname}</span>
                  {week && <AuthorBadge label={week} />}
                </p>
                <p className="text-grey-500 text-xs">
                  {formatRelativeTime(post.createdAt, now)} · 조회 {formatCount(post.views)}
                </p>
              </div>
            </div>
            <p className="text-grey-800 text-base leading-relaxed whitespace-pre-wrap">
              {post.body}
            </p>
            <div className="flex justify-center gap-2 pt-1.5">
              <button
                type="button"
                aria-pressed={liked}
                className={`border-grey-200 flex items-center gap-1.5 rounded-full border px-4.5 py-2.5 text-sm leading-snug font-medium ${
                  liked ? 'border-red-500 font-bold text-red-500' : 'text-grey-700'
                }`}
                onClick={() => toggleLikePost(post.id)}
              >
                공감 {formatCount(post.likes)}
                <img src={iconHeart} alt="" width={18} height={18} />
              </button>
              <button
                type="button"
                className="border-grey-200 text-grey-700 flex items-center gap-1.5 rounded-full border px-4.5 py-2.5 text-sm leading-snug font-medium"
                onClick={share}
              >
                공유하기
                <img src={iconShare} alt="" width={18} height={18} />
              </button>
            </div>
          </article>

          <section className="border-grey-50 flex flex-col gap-5 border-t-8 px-5 pt-5">
            <h2 className="text-subtitle-1 text-grey-900 tracking-normal">
              댓글 {formatCount(post.comments.length)}개
            </h2>
            {post.comments.length === 0 ? (
              <p className="text-grey-500 py-6 text-center text-sm leading-normal">
                아직 댓글이 없어요. 첫 댓글을 남겨 주세요.
              </p>
            ) : (
              <ul className="flex flex-col gap-5">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    now={now}
                    best={comment.id === best?.id}
                    liked={likedCommentIds.includes(comment.id)}
                    onLike={() => toggleLikeComment(post.id, comment.id)}
                    onReply={
                      comment.parentId
                        ? undefined
                        : () =>
                            startComment({ parentId: comment.id, replyTo: comment.author.nickname })
                    }
                    onDelete={() => setDeletingId(comment.id)}
                  />
                ))}
              </ul>
            )}
          </section>

          {composing && me ? (
            <CommentComposer
              key={composing.parentId ?? 'post'}
              replyTo={composing.replyTo}
              nickname={me.nickname}
              onSubmit={(body) => {
                addComment(post.id, me, body, composing.parentId)
                setComposing(null)
                setToast(composing.parentId ? '답글을 남겼어요' : '댓글을 남겼어요')
              }}
              onClose={closeComposer}
            />
          ) : (
            <nav
              aria-label="글 메뉴"
              className="border-grey-100 fixed bottom-0 left-1/2 z-40 flex h-18 w-full max-w-107.5 -translate-x-1/2 items-center justify-between border-t bg-white px-5 pb-[max(--spacing(4),env(safe-area-inset-bottom))]"
            >
              <button
                type="button"
                className="text-grey-600 flex items-center gap-1.5 text-sm leading-snug font-medium"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <img src={iconUp} alt="" width={20} height={20} />
                맨위로
              </button>
              <div className="flex items-center gap-4.5 text-sm leading-snug font-medium">
                <button
                  type="button"
                  aria-pressed={liked}
                  className={`flex items-center gap-1 ${liked ? 'font-bold text-red-500' : 'text-grey-600'}`}
                  onClick={() => toggleLikePost(post.id)}
                >
                  <img src={iconHeartBar} alt="" width={20} height={20} />
                  공감 {formatCount(post.likes)}
                </button>
                <button
                  type="button"
                  className="text-grey-600 flex items-center gap-1"
                  onClick={() => startComment({ replyTo: null })}
                >
                  <img src={iconCommentBar} alt="" width={20} height={20} />
                  댓글 {formatCount(post.comments.length)}
                </button>
              </div>
            </nav>
          )}
        </>
      )}

      {deletingId && (
        <ConfirmDialog
          title="이 댓글을 지울까요?"
          description="지운 댓글은 되돌릴 수 없어요."
          confirmLabel="삭제"
          danger
          onConfirm={() => {
            removeComment(post.id, deletingId)
            setDeletingId(null)
            setToast('댓글을 지웠어요')
          }}
          onClose={closeDelete}
        />
      )}
      {restrictedOpen && restrictedUntil && (
        <RestrictedSheet
          until={new Date(restrictedUntil)}
          onPolicy={() => navigate(ROUTES.COMMUNITY_POLICY)}
          onAppeal={() => setToast(COMING_SOON)}
          onClose={closeRestricted}
        />
      )}
      {moreOpen && (
        <PostMoreSheet
          mine={mine}
          onEdit={fromMore(() => navigate(`${ROUTES.COMMUNITY_WRITE}?edit=${post.id}`))}
          onDelete={fromMore(() => setConfirming('delete'))}
          onReport={fromMore(() => setReportOpen(true))}
          onBlock={fromMore(() => setConfirming('block'))}
          onCopyLink={fromMore(copyLink)}
          onClose={closeMore}
        />
      )}
      {reportOpen && (
        <ReportSheet
          onSubmit={(reason) => {
            reportPost(post.id, reason)
            setReportOpen(false)
            setToast('신고했어요. 운영정책에 따라 확인할게요.')
          }}
          onClose={closeReport}
        />
      )}
      {confirming === 'delete' && (
        <ConfirmDialog
          title="이 글을 지울까요?"
          description="지운 글과 달린 댓글은 되돌릴 수 없어요."
          confirmLabel="삭제"
          danger
          onConfirm={() => {
            removePost(post.id)
            navigate(ROUTES.COMMUNITY, { replace: true })
          }}
          onClose={closeConfirming}
        />
      )}
      {confirming === 'block' && (
        <ConfirmDialog
          title={`${post.author.nickname}님 글을 안 볼까요?`}
          description="이 사람의 글과 댓글이 보이지 않아요. 마이 › 커뮤니티 설정에서 다시 볼 수 있어요."
          confirmLabel="안 보기"
          onConfirm={() => {
            blockAuthor(post.author)
            goBack()
          }}
          onClose={closeConfirming}
        />
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default PostDetailPage
