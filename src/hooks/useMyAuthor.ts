import { MY_AUTHOR_ID } from '@/constants/community'
import { useCommunityStore } from '@/stores/useCommunityStore'
import { useProfileStore } from '@/stores/useProfileStore'
import type { Author } from '@/types/community'
import { getPregnancyAge } from '@/utils/pregnancy'

// 내 글·댓글에 붙는 글쓴이. 닉네임을 안 정했으면 null
export function useMyAuthor(): Author | null {
  const nickname = useCommunityStore((state) => state.nickname)
  const showWeek = useCommunityStore((state) => state.showWeek)
  const dueDate = useProfileStore((state) => state.dueDate)
  if (!nickname) return null
  const age = showWeek ? getPregnancyAge(dueDate, new Date()) : null
  return { id: MY_AUTHOR_ID, nickname, pregnancyWeek: age?.weeks ?? null }
}
