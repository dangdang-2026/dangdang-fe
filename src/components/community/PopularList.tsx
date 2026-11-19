import { useState } from 'react'
import type { PopularPeriod, PostAudience } from '@/api/posts'
import iconRefresh from '@/assets/icons/community/refresh.svg'
import BoardNotice from '@/components/community/BoardNotice'
import CommunityEmpty from '@/components/community/CommunityEmpty'
import FilterChip from '@/components/community/FilterChip'
import PostRow from '@/components/community/PostRow'
import { usePostList } from '@/hooks/usePostList'
import type { Post } from '@/types/community'
import { POPULAR_PERIOD } from '@/utils/community'

const PERIOD_OPTIONS = (Object.keys(POPULAR_PERIOD) as PopularPeriod[]).map((value) => ({
  value,
  label: POPULAR_PERIOD[value].label,
}))

// 서버 대상은 글쓴이의 지금 임신 상태 기준
const AUDIENCE_OPTIONS: { value: PostAudience; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'pregnant', label: '임신 중' },
  { value: 'postpartum', label: '출산 후' },
]

type PopularListProps = {
  now: Date
  onOpen: (post: Post) => void
  onPolicy: () => void
}

// Figma U-23 인기 게시판. 서버가 공감 + 댓글 많은 순 50개
function PopularList({ now, onOpen, onPolicy }: PopularListProps) {
  const [period, setPeriod] = useState<PopularPeriod>('realtime')
  const [audience, setAudience] = useState<PostAudience>('all')
  const list = usePostList({ sort: 'popular', period, audience })
  const items = list.posts

  return (
    <>
      <div className="flex gap-2 px-5 pt-4 pb-1">
        <FilterChip title="기간" value={period} options={PERIOD_OPTIONS} onChange={setPeriod} />
        <FilterChip
          title="대상"
          value={audience}
          options={AUDIENCE_OPTIONS}
          onChange={setAudience}
        />
      </div>
      <ul className="px-5">
        <li>
          <BoardNotice title="커뮤니티 운영정책 (10.19 업데이트)" onClick={onPolicy} />
        </li>
        {items.map((post) => (
          <li key={post.id}>
            <PostRow post={post} now={now} variant="popular" onClick={() => onOpen(post)} />
          </li>
        ))}
      </ul>
      {list.status === 'error' ? (
        <CommunityEmpty
          variant="sorry"
          title="글을 불러오지 못했어요"
          description="인터넷 연결을 확인하고 다시 시도해 주세요."
          action={{ icon: iconRefresh, label: '다시 불러오기', onClick: list.reload }}
        />
      ) : (
        items.length === 0 && (
          <p className="text-grey-500 py-12 text-center text-sm leading-normal">
            {list.status === 'loading'
              ? '글을 불러오는 중이에요'
              : `${POPULAR_PERIOD[period].label} 인기 글이 아직 없어요`}
          </p>
        )
      )}
    </>
  )
}

export default PopularList
