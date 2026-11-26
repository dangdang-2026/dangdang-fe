import { Navigate, useNavigate, useSearchParams } from 'react-router'
import iconRefresh from '@/assets/icons/community/refresh.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import CommunityEmpty from '@/components/community/CommunityEmpty'
import MorePostsButton from '@/components/community/MorePostsButton'
import PostRow from '@/components/community/PostRow'
import { ROUTES, communityPostPath } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useMyActivity } from '@/hooks/useMyActivity'
import { useNow } from '@/hooks/useNow'
import { ACTIVITY_LABEL, formatCount, formatRelativeTime, isActivityType } from '@/utils/community'
import type { ActivityType } from '@/utils/community'

type ActivityListProps = {
  type: ActivityType
}

function ActivityList({ type }: ActivityListProps) {
  const navigate = useNavigate()
  const now = useNow()
  const list = useMyActivity(type)
  const openPost = (id: string) => navigate(communityPostPath(id))

  if (list.status === 'loading') {
    return <p className="text-grey-500 py-20 text-center text-sm leading-normal">불러오는 중…</p>
  }
  if (list.status === 'error') {
    return (
      <CommunityEmpty
        variant="sorry"
        title="불러오지 못했어요"
        description="인터넷 연결을 확인하고 다시 시도해 주세요."
        action={{ icon: iconRefresh, label: '다시 불러오기', onClick: list.reload }}
      />
    )
  }
  const empty = type === 'comments' ? list.comments.length === 0 : list.posts.length === 0
  const more = list.hasNext && (
    <MorePostsButton
      loading={list.loadingMore}
      label={type === 'comments' ? '댓글 더 보기' : undefined}
      onClick={list.loadMore}
    />
  )
  const moreFailed = list.moreFailed && (
    <p role="alert" className="text-t7 text-center text-red-500">
      더 불러오지 못했어요. 다시 눌러 주세요
    </p>
  )
  // 비어 있어도 서버에 다음 장이 있으면 더 보기를 남김
  if (empty) {
    return (
      <>
        <p className="text-grey-500 py-20 text-center text-sm leading-normal">아직 없어요</p>
        {moreFailed}
        {more}
      </>
    )
  }

  return (
    <>
      <ul className="mt-2">
        {type === 'comments'
          ? list.comments.map((comment) => (
              <li key={comment.id}>
                {/* 내 댓글 한 줄. Figma 화면이 없어 게시판 글 한 줄 모양을 따름 */}
                <button
                  type="button"
                  className="border-grey-100 flex w-full flex-col items-start gap-1.5 border-b py-4 text-left"
                  onClick={() => openPost(comment.postId)}
                >
                  <span className="text-grey-900 line-clamp-2 w-full text-base leading-normal font-medium">
                    {comment.body}
                  </span>
                  <span className="text-t7 text-grey-600 w-full truncate leading-snug">
                    {comment.postTitle}
                  </span>
                  <span className="text-t7 text-grey-400 flex items-center gap-1.5 leading-snug">
                    {formatRelativeTime(comment.createdAt, now)}
                    <span aria-hidden className="text-grey-300">
                      ·
                    </span>
                    공감 {formatCount(comment.likes)}
                  </span>
                </button>
              </li>
            ))
          : list.posts.map((post) => (
              <li key={post.id}>
                <PostRow post={post} now={now} onClick={() => openPost(post.id)} />
              </li>
            ))}
      </ul>
      {moreFailed}
      {more}
    </>
  )
}

// M-14에서 들어가는 내 활동 목록. Figma 화면이 없어 게시판 목록 모양을 그대로 씀
function CommunityActivityPage() {
  const goBack = useGoBack(ROUTES.MY_COMMUNITY)
  const [params] = useSearchParams()
  const type = params.get('type')

  if (!isActivityType(type)) return <Navigate to={ROUTES.MY_COMMUNITY} replace />

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-2 pb-10">
      <SubPageHeader title={ACTIVITY_LABEL[type]} onBack={goBack} />
      {/* 종류가 바뀌면 처음부터 */}
      <ActivityList key={type} type={type} />
    </main>
  )
}

export default CommunityActivityPage
