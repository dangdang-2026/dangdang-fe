// 올리기 전 확인. 서버 검수 전까지 낱말로만 걸러냄

export type PostWarning = { kind: 'urgent' | 'dose'; quote: string }

// 출혈·태동 감소·심한 통증·위기 표현
const URGENT =
  /피가|피\s?비|출혈|하혈|태동이?\s?(줄|없|안\s?느)|양수|심한\s?통증|배가\s?너무\s?아|경련|숨이\s?차|쓰러|죽고\s?싶|자해/

// 약 이름·용량. 예: 인슐린 8단위, 메트포르민 500mg
const DOSE =
  /(인슐린|메트포르민|약)[^.?!\n]{0,15}?\d+\s?(단위|mg|밀리|알|정)|\d+\s?(단위|mg)\s?(맞|먹|드|올|늘|줄)/

// 걸린 낱말이 든 문장. 너무 길면 앞뒤를 자름
function quoteSentence(text: string, index: number) {
  const start = Math.max(text.lastIndexOf('.', index), text.lastIndexOf('\n', index)) + 1
  const ends = ['.', '?', '!', '\n']
    .map((mark) => text.indexOf(mark, index))
    .filter((position) => position !== -1)
  const end = ends.length > 0 ? Math.min(...ends) : text.length
  const sentence = text.slice(start, end).trim()
  return sentence.length > 30 ? `${sentence.slice(0, 30)}…` : sentence
}

// 위급할 수 있는 말이 먼저, 그다음 약 용량
export function checkPost(text: string): PostWarning | null {
  for (const [kind, pattern] of [
    ['urgent', URGENT],
    ['dose', DOSE],
  ] as const) {
    const match = pattern.exec(text)
    if (match) return { kind, quote: quoteSentence(text, match.index) }
  }
  return null
}
