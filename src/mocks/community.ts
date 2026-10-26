import type { Author, CommunityComment, Post } from '@/types/community'

// 지금부터 몇 분 전
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()

const AUTHORS: Record<string, Author> = {
  sweetPotato: { id: 'u1', nickname: '포근한 고구마', pregnancyWeek: 27 },
  tofu: { id: 'u2', nickname: '말랑한 두부', pregnancyWeek: 31 },
  potato: { id: 'u3', nickname: '졸린 감자', pregnancyWeek: 25 },
  anon: { id: 'u4', nickname: '익명 산모', pregnancyWeek: 29 },
  bean: { id: 'u5', nickname: '단단한 콩', pregnancyWeek: 30 },
  pumpkin: { id: 'u6', nickname: '달달한 단호박', pregnancyWeek: 34 },
}

const comment = (
  id: string,
  author: Author,
  body: string,
  minutes: number,
  likes: number,
): CommunityComment => ({ id, author, body, createdAt: minutesAgo(minutes), likes })

// API 연동 전 커뮤니티 첫 화면용 글
export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    board: 'measure',
    title: '식후 1시간 알림, 밖에 있을 때 다들 어떻게 하세요?',
    body: '회사에서 점심 먹고 알림이 오면 화장실 가서 재는데 매번 눈치가 보여요. 다른 분들은 어떻게 하시는지 궁금해요.',
    author: AUTHORS.sweetPotato,
    createdAt: minutesAgo(120),
    views: 1204,
    likes: 86,
    comments: [
      comment(
        'c1',
        AUTHORS.tofu,
        '저는 측정 키트를 파우치에 넣어 다니고, 회의 중이면 늦게 잼으로 적어요',
        100,
        32,
      ),
      {
        ...comment(
          'c1-1',
          AUTHORS.bean,
          '화장실 말고 수유실이나 탕비실 쓰는 분도 있더라고요!',
          50,
          9,
        ),
        parentId: 'c1',
      },
      comment(
        'c2',
        AUTHORS.potato,
        '저도 화장실에서 재요. 처음엔 어색했는데 금방 익숙해져요',
        40,
        11,
      ),
      { ...comment('c5', AUTHORS.anon, '', 30, 0), hidden: true },
    ],
  },
  {
    id: 'p2',
    board: 'mind',
    title: '진단받고 계속 자책하게 돼요',
    body: '제가 뭘 잘못 먹어서 그런가 싶고, 숫자 하나에 하루 기분이 왔다 갔다 해요.',
    author: AUTHORS.potato,
    createdAt: minutesAgo(60 * 26),
    views: 3410,
    likes: 214,
    comments: [
      comment(
        'c3',
        AUTHORS.pumpkin,
        '저도 그랬어요. 혼자 끙끙 앓지 말고 여기 털어놔요',
        60 * 25,
        58,
      ),
      comment('c4', AUTHORS.bean, '내 탓이 아니라고 의사 선생님도 그러셨어요. 힘내요', 60 * 24, 21),
    ],
  },
  {
    id: 'p3',
    board: 'diet',
    title: '남편이랑 저녁 메뉴 같이 정하는 팁 있을까요?',
    body: '같이 먹으려니 매번 메뉴 고르기가 어려워요. 다들 어떻게 맞추세요?',
    author: AUTHORS.bean,
    createdAt: minutesAgo(60 * 24 * 3),
    views: 870,
    likes: 12,
    comments: [],
  },
  {
    id: 'p4',
    board: 'measure',
    title: '밤에 공복 알림 끄는 법 아세요? 자다가 깨서 다시 잠이 안 와요',
    body: '공복 혈당은 아침에만 재면 된다고 들었는데 알림이 너무 일찍 와요.',
    author: AUTHORS.tofu,
    createdAt: minutesAgo(10),
    views: 48,
    likes: 3,
    comments: [],
  },
  {
    id: 'p5',
    board: 'measure',
    title: '측정 알림 소리가 너무 커서 회의 때 민망했어요ㅠㅠ 진동으로만 바꿀 수 있나요',
    body: '폰 설정에서 바꾸면 되는 건지 앱에서 바꾸는 건지 모르겠어요.',
    author: AUTHORS.potato,
    createdAt: minutesAgo(60),
    views: 103,
    likes: 5,
    comments: [],
  },
  {
    id: 'p6',
    board: 'diet',
    title: '외식할 때 메뉴 어떻게 고르세요?',
    body: '회사 근처 식당이 다 국밥이라 고민이에요. 다들 어떤 메뉴 고르시나요?',
    author: AUTHORS.anon,
    createdAt: minutesAgo(3),
    views: 12,
    likes: 0,
    comments: [],
  },
  {
    id: 'p7',
    board: 'visit',
    title: '첫 외래 다녀왔어요. 생각보다 무섭지 않았어요',
    body: '기록 화면 보여드리니까 선생님이 금방 확인하셨어요. 물어볼 것 미리 적어 가길 잘했어요.',
    author: AUTHORS.pumpkin,
    createdAt: minutesAgo(60 * 5),
    views: 420,
    likes: 27,
    comments: [],
  },
]
