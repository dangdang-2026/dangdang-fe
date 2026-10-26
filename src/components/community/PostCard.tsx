import iconAvatar from '@/assets/icons/community/avatar.svg'
import iconComment from '@/assets/icons/community/comment.svg'
import iconFire from '@/assets/icons/community/fire.svg'
import iconView from '@/assets/icons/community/view.svg'
import { BOARD_LABEL } from '@/constants/community'
import type { Post } from '@/types/community'
import {
  formatAuthorWeek,
  formatCount,
  formatRelativeTime,
  getBestComment,
  isPopular,
  splitHighlight,
} from '@/utils/community'

type PostCardProps = {
  post: Post
  now: Date
  // 검색어. 제목에서 노랗게 강조
  highlight?: string
  onClick: () => void
}

const chipClass =
  'bg-grey-100 text-grey-700 flex items-center gap-0.5 rounded-md px-2 py-0.5 text-xs leading-snug font-medium'

// Figma U-01 메인 글 카드: 칩 · 제목 · 본문 두 줄 · 베스트 댓글 · 주수·시간·조회·댓글
function PostCard({ post, now, highlight = '', onClick }: PostCardProps) {
  const best = getBestComment(post)
  const meta = [formatAuthorWeek(post.author), formatRelativeTime(post.createdAt, now)]
    .filter(Boolean)
    .join(' · ')

  return (
    <button
      type="button"
      className="border-grey-100 flex w-full flex-col gap-2 border-t p-5 text-left"
      onClick={onClick}
    >
      <span className="flex gap-1.5">
        {isPopular(post) && (
          <span className={chipClass}>
            <img src={iconFire} alt="" width={14} height={14} />
            인기
          </span>
        )}
        <span className={chipClass}>{BOARD_LABEL[post.board]}</span>
        {post.poll && (
          <span className="text-grey-800 rounded-md border border-yellow-300 bg-yellow-50 px-2 py-0.5 text-xs leading-snug font-bold">
            투표
          </span>
        )}
      </span>
      <span className="text-subtitle-1 text-grey-900 w-full truncate tracking-normal">
        {post.hidden
          ? '운영정책에 따라 가려진 글이에요'
          : splitHighlight(post.title, highlight).map((part, index) =>
              part.match ? (
                <mark key={index} className="bg-transparent text-yellow-600">
                  {part.text}
                </mark>
              ) : (
                part.text
              ),
            )}
      </span>
      {!post.hidden && <span className="text-t6 text-grey-600 line-clamp-2">{post.body}</span>}
      {best && (
        <span className="flex w-full items-center gap-1.5 text-sm leading-snug">
          <span aria-hidden className="text-grey-300 text-t7">
            ㄴ
          </span>
          <img src={iconAvatar} alt="" width={20} height={20} />
          <span className="text-grey-600 min-w-0 flex-1 truncate">{best.body}</span>
        </span>
      )}
      <span className="text-t7 text-grey-500 flex w-full items-center justify-between leading-snug">
        <span>{meta}</span>
        <span className="flex items-center gap-1">
          <img src={iconView} alt="조회" width={16} height={16} />
          {formatCount(post.views)}
          <img src={iconComment} alt="댓글" width={16} height={16} className="ml-1.5" />
          {formatCount(post.comments.length)}
        </span>
      </span>
    </button>
  )
}

export default PostCard
