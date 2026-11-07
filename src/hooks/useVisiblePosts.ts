import { useMemo } from 'react'
import { useCommunityStore } from '@/stores/useCommunityStore'

// 안 보기로 한 사람의 글은 목록에서 뺌
export function useVisiblePosts() {
  const posts = useCommunityStore((state) => state.posts)
  const blockedAuthors = useCommunityStore((state) => state.blockedAuthors)
  return useMemo(() => {
    const blocked = new Set(blockedAuthors.map((author) => author.id))
    return posts.filter((post) => !blocked.has(post.author.id))
  }, [posts, blockedAuthors])
}
