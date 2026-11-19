import { useState } from 'react'
import iconRefresh from '@/assets/icons/community/refresh.svg'
import CommunityEmpty from '@/components/community/CommunityEmpty'
import MorePostsButton from '@/components/community/MorePostsButton'
import PostCard from '@/components/community/PostCard'
import SortToggle from '@/components/community/SortToggle'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { usePostList } from '@/hooks/usePostList'
import type { Post, PostSort } from '@/types/community'
import { isMedicalQuery } from '@/utils/community'

const SEARCH_DELAY_MS = 300

type SearchResultsProps = {
  query: string
  now: Date
  onOpen: (post: Post) => void
  // 진료와 관련된 검색어면 진료 때 물어볼 것으로
  onAsk: () => void
  onWrite: () => void
}

// Figma U-06 검색 결과 · U-07 검색 결과 없음
function SearchResults({ query, now, onOpen, onAsk, onWrite }: SearchResultsProps) {
  const [sort, setSort] = useState<PostSort>('popular')
  // 입력을 멈추면 찾음
  const keyword = useDebouncedValue(query.trim(), SEARCH_DELAY_MS)
  const list = usePostList({ sort, q: keyword })
  const results = list.posts
  const medical = isMedicalQuery(query)

  if (list.status === 'loading') {
    return <p className="text-grey-500 py-12 text-center text-sm leading-normal">찾는 중이에요</p>
  }
  if (list.status === 'error') {
    return (
      <CommunityEmpty
        variant="sorry"
        title="글을 찾지 못했어요"
        description="인터넷 연결을 확인하고 다시 시도해 주세요."
        action={{ icon: iconRefresh, label: '다시 찾기', onClick: list.reload }}
      />
    )
  }

  if (results.length === 0) {
    return (
      <CommunityEmpty
        variant="sorry"
        title={`‘${query.trim()}’ 글이 없어요`}
        description={
          medical
            ? '용량처럼 진료와 관련된 건 커뮤니티보다\n병원에 묻는 게 정확해요.'
            : '다른 말로 찾아보거나 직접 물어봐 주세요.'
        }
        action={
          medical
            ? { label: '당당이와 물어볼 말 정리하기', onClick: onAsk }
            : { label: '질문 글 쓰기', onClick: onWrite }
        }
      />
    )
  }

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-2.5 pb-1.5">
        <p className="text-t7 text-grey-800 leading-snug font-bold">
          글 {results.length}개{list.hasNext && '+'}
        </p>
        <SortToggle value={sort} onChange={setSort} />
      </div>
      <ul>
        {results.map((post) => (
          <li key={post.id}>
            <PostCard post={post} now={now} highlight={query} onClick={() => onOpen(post)} />
          </li>
        ))}
      </ul>
      {list.hasNext && <MorePostsButton loading={list.loadingMore} onClick={list.loadMore} />}
    </>
  )
}

export default SearchResults
