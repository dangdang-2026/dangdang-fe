import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { getAnnouncements, type Announcement, type AnnouncementSlot } from '@/api/announcements'
import { communityNewsPath } from '@/constants/routes'

// 칸에 걸린 첫 카드. 없거나 못 받으면 null
export function useAnnouncement(slot: AnnouncementSlot, enabled = true) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  useEffect(() => {
    if (!enabled) return
    let stale = false
    getAnnouncements(slot)
      .then((items) => {
        if (!stale) setAnnouncement(items[0] ?? null)
      })
      .catch(() => {})
    return () => {
      stale = true
    }
  }, [slot, enabled])
  return enabled ? announcement : null
}

// 카드 누르면: 당당 소식 카드 → 소식 상세, 앱 경로 → 그 화면, https → 새 창
export function useOpenAnnouncement() {
  const navigate = useNavigate()
  return (announcement: Announcement) => {
    if (announcement.contentCardId !== null) {
      navigate(communityNewsPath(String(announcement.contentCardId)))
      return
    }
    const link = announcement.linkUrl
    if (!link) return
    if (link.startsWith('/')) navigate(link)
    else if (link.startsWith('https://')) window.open(link, '_blank', 'noopener')
  }
}

// 카드 위 작은 글. 제휴는 AD 표시
export const getAnnouncementLabel = (announcement: Announcement) =>
  announcement.kind === 'AD' ? 'AD · 제휴' : '당당 소식'
