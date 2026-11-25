import { apiClient, type BaseResponse } from '@/api/axios'

export type AnnouncementSlot = 'SPLASH' | 'COMMUNITY'

// 백엔드 AnnouncementResponse. NEWS 당당 소식 · AD 제휴(화면에 AD 표시)
export type Announcement = {
  id: number
  slot: AnnouncementSlot
  kind: 'NEWS' | 'AD'
  title: string
  imageUrl: string | null
  // /로 시작하는 앱 경로나 https
  linkUrl: string | null
  // 당당 소식 카드로 열 때
  contentCardId: number | null
  // 연결된 카드 요약. 카드가 없으면 null
  card: { slideCount: number; sourceCount: number; checkedOn: string | null } | null
  activeFrom: string
  activeTo: string | null
}

// 지금 걸린 소식 · 광고 카드. 당당 소식이 먼저, 없으면 []
export async function getAnnouncements(slot: AnnouncementSlot) {
  const { data } = await apiClient.get<BaseResponse<Announcement[]>>('/announcements', {
    params: { slot },
  })
  return data.data ?? []
}
