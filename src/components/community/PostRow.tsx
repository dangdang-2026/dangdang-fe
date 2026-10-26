import iconCommentSm from '@/assets/icons/community/comment-sm.svg'
import iconViewSm from '@/assets/icons/community/view-sm.svg'
import type { Post } from '@/types/community'
import { formatAuthorWeek, formatCount, formatRelativeTime } from '@/utils/community'

type PostRowProps = {
  post: Post
  now: Date
  // 식단 게시판은 글쓴이 대신 본문 한 줄
  showBody?: boolean
  // 인기 게시판은 인기 칩 + 제목 옆 댓글 수
  variant?: 'default' | 'popular'
  onClick: () => void
}

// Figma U-21 게시판 글 한 줄 · U-23 인기 글 한 줄
function PostRow({ post, now, showBody, variant = 'default', onClick }: PostRowProps) {
  const author = [post.author.nickname, formatAuthorWeek(post.author)].filter(Boolean).join(' · ')
  const popular = variant === 'popular'

  return (
    <button
      type="button"
      className="border-grey-100 flex w-full flex-col items-start gap-1.5 border-b py-4 text-left"
      onClick={onClick}
    >
      {popular && (
        <span className="text-grey-800 rounded-md bg-yellow-100 px-2 py-0.5 text-xs leading-snug font-bold">
          인기
        </span>
      )}
      <span
        className={`text-grey-900 w-full text-base leading-normal font-medium ${popular ? 'line-clamp-2' : 'truncate'}`}
      >
        {post.hidden ? '운영정책에 따라 가려진 글이에요' : post.title}
        {popular && <span className="text-grey-500 ml-2 font-bold">({post.comments.length})</span>}
      </span>
      <span className="text-t7 text-grey-600 w-full truncate leading-snug">
        {showBody ? post.body : author}
      </span>
      <span className="text-t7 text-grey-400 flex items-center gap-1.5 leading-snug">
        {formatRelativeTime(post.createdAt, now)}
        <span aria-hidden className="text-grey-300">
          ·
        </span>
        <img src={iconViewSm} alt="조회" width={14} height={14} />
        {formatCount(post.views)}
        {!popular && (
          <>
            <img src={iconCommentSm} alt="댓글" width={14} height={14} />
            {formatCount(post.comments.length)}
          </>
        )}
      </span>
    </button>
  )
}

export default PostRow
