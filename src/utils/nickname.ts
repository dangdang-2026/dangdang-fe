export const NICKNAME_MIN = 2
export const NICKNAME_MAX = 10

const ADJECTIVES = ['포근한', '말랑한', '졸린', '달달한', '단단한', '상큼한', '느긋한', '동글한']
const NOUNS = ['고구마', '두부', '감자', '단호박', '콩', '귤', '복숭아', '옥수수']

const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)]

// 예: 포근한 고구마. 서버 추천을 받기 전 잠깐 보여 줄 이름
export function createNickname() {
  return `${pick(ADJECTIVES)} ${pick(NOUNS)}`
}

// checking: 서버에서 쓰는 사람이 있는지 확인하는 중
export type NicknameCheck = 'ok' | 'length' | 'chars' | 'taken' | 'checking'

// 2~10자, 한글·영문·숫자(띄어쓰기 가능). 서버와 같은 규칙. 중복은 서버에서 확인
export function checkNicknameFormat(name: string): 'ok' | 'length' | 'chars' {
  const trimmed = name.trim()
  if (trimmed.length < NICKNAME_MIN || trimmed.length > NICKNAME_MAX) return 'length'
  if (!/^[가-힣a-zA-Z0-9 ]+$/.test(trimmed)) return 'chars'
  return 'ok'
}
