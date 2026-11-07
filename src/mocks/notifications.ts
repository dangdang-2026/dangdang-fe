import type { InboxItem } from '@/types/notification'

// 오늘·어제 기준 시각 만들기
const at = (now: Date, daysAgo: number, hours: number, minutes: number) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, hours, minutes).toISOString()

// 알림 API 연동 전 목업. 앱을 처음 열 때의 오늘·어제로 만듦
export function createMockInbox(now = new Date()): InboxItem[] {
  return [
    {
      id: 'n4',
      type: 'measure',
      title: '점심 식후 1시간, 잴 시간이에요',
      body: '12:12에 식사를 시작했어요',
      sentAt: at(now, 0, 13, 12),
      readAt: null,
    },
    {
      id: 'n3',
      type: 'measure',
      title: '공복 혈당을 잴 시간이에요',
      sentAt: at(now, 0, 7, 30),
      readAt: at(now, 0, 7, 32),
    },
    {
      id: 'n2',
      type: 'visitNote',
      title: '진료에서 들은 말을 적어 두세요',
      body: '바뀐 기준·다음 진료일을 메모로 정리해요',
      sentAt: at(now, 1, 15, 0),
      readAt: null,
    },
    {
      id: 'n1',
      type: 'visitToday',
      title: '오늘 오전 10:30 진료예요',
      body: '리포트와 물어볼 것 2개를 챙겨 두었어요',
      sentAt: at(now, 1, 8, 0),
      readAt: at(now, 1, 8, 5),
    },
  ]
}
