import { useState } from 'react'
import CommunityEmpty from '@/components/community/CommunityEmpty'
import PostCard from '@/components/community/PostCard'
import SortToggle from '@/components/community/SortToggle'
import type { Post, PostSort } from '@/types/community'
import { isMedicalQuery, searchPosts, sortPosts } from '@/utils/community'

type SearchResultsProps = {
  query: string
  posts: Post[]
  now: Date
  onOpen: (post: Post) => void
  // 진료와 관련된 검색어면 진료 때 물어볼 것으로
  onAsk: () => void
  onWrite: () => void
}

// Figma U-06 검색 결과 · U-07 검색 결과 없음
function SearchResults({ query, posts, now, onOpen, onAsk, onWrite }: SearchResultsProps) {
  const [sort, setSort] = useState<PostSort>('popular')
  const results = sortPosts(searchPosts(posts, query), sort)
  const medical = isMedicalQuery(query)

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
            ? { label: '진료 때 물어볼 것에 적기', onClick: onAsk }
            : { label: '질문 글 쓰기', onClick: onWrite }
        }
      />
    )
  }

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-2.5 pb-1.5">
        <p className="text-t7 text-grey-800 leading-snug font-bold">글 {results.length}개</p>
        <SortToggle value={sort} onChange={setSort} />
      </div>
      <ul>
        {results.map((post) => (
          <li key={post.id}>
            <PostCard post={post} now={now} highlight={query} onClick={() => onOpen(post)} />
          </li>
        ))}
      </ul>
    </>
  )
}

export default SearchResults
