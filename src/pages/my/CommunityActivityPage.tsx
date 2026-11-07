import { Navigate, useNavigate, useSearchParams } from 'react-router'
import SubPageHeader from '@/components/common/SubPageHeader'
import PostRow from '@/components/community/PostRow'
import { ROUTES, communityPostPath } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useNow } from '@/hooks/useNow'
import { useCommunityStore } from '@/stores/useCommunityStore'
import { ACTIVITY_LABEL, filterActivity, isActivityType, sortPosts } from '@/utils/community'

// M-14에서 들어가는 내 활동 목록. Figma 화면이 없어 게시판 목록 모양을 그대로 씀
function CommunityActivityPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.MY_COMMUNITY)
  const now = useNow()
  const [params] = useSearchParams()
  const posts = useCommunityStore((state) => state.posts)
  const likedPostIds = useCommunityStore((state) => state.likedPostIds)
  const type = params.get('type')

  if (!isActivityType(type)) return <Navigate to={ROUTES.MY_COMMUNITY} replace />

  const items = sortPosts(filterActivity(posts, type, likedPostIds), 'latest')

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-10">
      <SubPageHeader title={ACTIVITY_LABEL[type]} onBack={goBack} />
      {items.length === 0 ? (
        <p className="text-grey-500 py-20 text-center text-sm leading-normal">아직 없어요</p>
      ) : (
        <ul className="mt-2">
          {items.map((post) => (
            <li key={post.id}>
              <PostRow post={post} now={now} onClick={() => navigate(communityPostPath(post.id))} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default CommunityActivityPage
