import { MOCK_POSTS } from '@/mocks/community'

export const NICKNAME_MIN = 2
export const NICKNAME_MAX = 10

const ADJECTIVES = ['포근한', '말랑한', '졸린', '달달한', '단단한', '상큼한', '느긋한', '동글한']
const NOUNS = ['고구마', '두부', '감자', '단호박', '콩', '귤', '복숭아', '옥수수']

// 서버 중복 확인 전까지 mock 글쓴이 이름을 쓰는 중인 이름으로
const TAKEN = new Set(
  MOCK_POSTS.flatMap((post) => [post.author, ...post.comments.map((item) => item.author)]).map(
    (author) => author.nickname,
  ),
)

const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)]

// 예: 포근한 고구마. 쓰는 중인 이름은 피함
export function createNickname(exclude?: string) {
  for (;;) {
    const name = `${pick(ADJECTIVES)} ${pick(NOUNS)}`
    if (!TAKEN.has(name) && name !== exclude) return name
  }
}

export type NicknameCheck = 'ok' | 'length' | 'chars' | 'taken'

// 2~10자, 한글·영문·숫자(띄어쓰기 가능)
export function checkNickname(name: string, current?: string | null): NicknameCheck {
  const trimmed = name.trim()
  if (trimmed.length < NICKNAME_MIN || trimmed.length > NICKNAME_MAX) return 'length'
  if (!/^[가-힣a-zA-Z0-9 ]+$/.test(trimmed)) return 'chars'
  if (trimmed !== current && TAKEN.has(trimmed)) return 'taken'
  return 'ok'
}
