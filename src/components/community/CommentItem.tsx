import iconAvatar from '@/assets/icons/community/avatar-lg.svg'
import iconHeart from '@/assets/icons/community/heart.svg'
import AuthorBadge from '@/components/community/AuthorBadge'
import { MY_AUTHOR_ID } from '@/constants/community'
import type { CommunityComment } from '@/types/community'
import { formatAuthorWeek, formatRelativeTime } from '@/utils/community'

type CommentItemProps = {
  comment: CommunityComment
  now: Date
  best?: boolean
  liked: boolean
  onLike: () => void
  // 답글에는 답글쓰기 없음
  onReply?: () => void
  onDelete: () => void
}

// Figma U-02b 댓글 한 개. 답글은 들여쓰고 아바타를 작게
function CommentItem({ comment, now, best, liked, onLike, onReply, onDelete }: CommentItemProps) {
  const isReply = !!comment.parentId
  const isMine = comment.author.id === MY_AUTHOR_ID
  const week = formatAuthorWeek(comment.author)

  if (comment.hidden) {
    return (
      <li className="flex gap-2.5">
        <img src={iconAvatar} alt="" width={36} height={36} className="shrink-0 self-start" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-t7 text-grey-500 leading-snug font-medium">운영 정책</p>
          <p className="bg-grey-50 text-grey-400 rounded-2xl px-3.5 py-3 text-sm leading-normal">
            약 이름·용량 이야기가 있어서 가려진 댓글이에요. 약은 병원에 물어봐 주세요.
          </p>
        </div>
      </li>
    )
  }

  return (
    <li className={`flex gap-2.5 ${isReply ? 'pl-10' : ''}`}>
      <img
        src={iconAvatar}
        alt=""
        width={isReply ? 28 : 36}
        height={isReply ? 28 : 36}
        className="shrink-0 self-start"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-t7 flex flex-wrap items-center gap-1.5 leading-snug">
          <span className="text-grey-800 font-medium">{comment.author.nickname}</span>
          {best && <AuthorBadge label="Best" variant="best" />}
          {week && <AuthorBadge label={week} />}
          <span className="text-grey-400">{formatRelativeTime(comment.createdAt, now)}</span>
          {isMine && <span className="text-grey-500">내 댓글</span>}
        </p>
        <p className="bg-grey-50 text-t6 text-grey-900 rounded-2xl px-3.5 py-3 whitespace-pre-wrap">
          {comment.body}
        </p>
        <div className="text-t7 text-grey-500 flex items-center gap-3 leading-snug">
          {onReply && (
            <button type="button" className="underline" onClick={onReply}>
              답글쓰기
            </button>
          )}
          <button
            type="button"
            aria-pressed={liked}
            className={`flex items-center gap-1 ${liked ? 'font-bold text-red-500' : ''}`}
            onClick={onLike}
          >
            공감
            <img src={iconHeart} alt="" width={14} height={14} />
            {comment.likes}
          </button>
          {isMine && (
            <button type="button" onClick={onDelete}>
              삭제
            </button>
          )}
        </div>
      </div>
    </li>
  )
}

export default CommentItem
