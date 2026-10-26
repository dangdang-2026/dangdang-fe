import { useState } from 'react'
import BoardNotice from '@/components/community/BoardNotice'
import FilterChip from '@/components/community/FilterChip'
import PostRow from '@/components/community/PostRow'
import type { Post } from '@/types/community'
import { POPULAR_PERIOD, getPopularPosts, type PopularPeriod } from '@/utils/community'

type Audience = 'all' | 'near'

const PERIOD_OPTIONS = (Object.keys(POPULAR_PERIOD) as PopularPeriod[]).map((value) => ({
  value,
  label: POPULAR_PERIOD[value].label,
}))

const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'near', label: '비슷한 주수' },
]

type PopularListProps = {
  posts: Post[]
  now: Date
  // 출산예정일을 모르면 null. 비슷한 주수 필터에 씀
  myWeek: number | null
  onOpen: (post: Post) => void
  onPolicy: () => void
  onNeedDueDate: () => void
}

// Figma U-23 인기 게시판(실시간)
function PopularList({ posts, now, myWeek, onOpen, onPolicy, onNeedDueDate }: PopularListProps) {
  const [period, setPeriod] = useState<PopularPeriod>('realtime')
  const [audience, setAudience] = useState<Audience>('all')
  const items = getPopularPosts(posts, period, now, audience === 'near' ? myWeek : null)

  const changeAudience = (value: Audience) => {
    if (value === 'near' && myWeek === null) onNeedDueDate()
    else setAudience(value)
  }

  return (
    <>
      <div className="flex gap-2 px-5 pt-4 pb-1">
        <FilterChip title="기간" value={period} options={PERIOD_OPTIONS} onChange={setPeriod} />
        <FilterChip
          title="대상"
          value={audience}
          options={AUDIENCE_OPTIONS}
          onChange={changeAudience}
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
      {items.length === 0 && (
        <p className="text-grey-500 py-12 text-center text-sm leading-normal">
          {POPULAR_PERIOD[period].label} 인기 글이 아직 없어요
        </p>
      )}
    </>
  )
}

export default PopularList
