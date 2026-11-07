import type { Criteria } from '@/types/criteria'
import type { NoteExtraction, NoteFinding } from '@/types/visit'

const MOCK_DELAY_MS = 1200
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
// 시각을 안 들었으면 오전·오후 대표 시각으로. 진료 탭에서 고칠 수 있음
const DEFAULT_HOUR = { 오전: 9, 오후: 14 } as const
const UNCHANGED = '바뀌지 않은 것 같아요'

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

// 쉼표로 이어진 말도 따로 봐서 "그대로"가 옆 항목에 번지지 않게
const splitSentences = (text: string) =>
  text
    .split(/[.,\n]/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

const isKeep = (sentence: string) => /그대로|지금처럼|유지/.test(sentence)

// 메모에 날짜만 있으면 올해, 이미 지났으면 내년으로
function toVisitDate(
  month: number,
  day: number,
  meridiem: string | undefined,
  hour: number | undefined,
  now: Date,
) {
  const base = meridiem === '오후' ? DEFAULT_HOUR.오후 : DEFAULT_HOUR.오전
  const hours = hour === undefined ? base : meridiem === '오후' && hour < 12 ? hour + 12 : hour
  const at = new Date(now.getFullYear(), month - 1, day, hours)
  if (at < now) at.setFullYear(at.getFullYear() + 1)
  return at
}

// 서버 연동 전 목업. 실제로는 AI가 3가지만 찾고 근거 문장을 붙여 줌
export async function extractVisitNote(
  text: string,
  current: Pick<Criteria, 'postMealHours' | 'targets'>,
  now = new Date(),
): Promise<NoteExtraction> {
  await wait(MOCK_DELAY_MS)

  const findings: NoteFinding[] = []
  let insulinQuote: string | null = null
  const has = (key: NoteFinding['key']) => findings.some((item) => item.key === key)

  for (const sentence of splitSentences(text)) {
    // 인슐린 이름·용량은 정리하지 않음
    if (sentence.includes('인슐린')) {
      insulinQuote ??= sentence
      continue
    }

    const postMeal = sentence.match(/식후\s*(?:[12]\s*시간\s*)?목표[^0-9]*(\d{2,3})/)
    if (postMeal && !has('postMeal')) {
      const value = Number(postMeal[1])
      const keep = isKeep(sentence) || value === current.targets.postMeal
      findings.push({
        key: 'postMeal',
        value,
        text: `${value} 미만`,
        quote: sentence,
        needsCheck: keep ? UNCHANGED : null,
      })
    }

    const hours = sentence.match(/식후\s*([12])\s*시간.*?(재|측정)/)
    if (hours && !has('postMealHours')) {
      const value = Number(hours[1])
      const keep = isKeep(sentence) || value === current.postMealHours
      findings.push({
        key: 'postMealHours',
        value,
        text: `식후 ${value}시간`,
        quote: sentence,
        needsCheck: keep ? UNCHANGED : null,
      })
    }

    const fasting = sentence.match(/공복[^0-9]*(\d{2,3})/)
    if (fasting && !has('fasting')) {
      const value = Number(fasting[1])
      const keep = isKeep(sentence) || value === current.targets.fasting
      findings.push({
        key: 'fasting',
        value,
        text: `${value} 미만`,
        quote: sentence,
        needsCheck: keep ? UNCHANGED : null,
      })
    }

    const visit = sentence.match(
      /(\d{1,2})\s*월\s*(\d{1,2})\s*일\s*(오전|오후)?\s*(?:(\d{1,2})\s*시)?/,
    )
    if (visit && sentence.includes('진료') && !has('nextVisit')) {
      const [, month, day, meridiem, hour] = visit
      const at = toVisitDate(
        Number(month),
        Number(day),
        meridiem,
        hour ? Number(hour) : undefined,
        now,
      )
      const time = hour ? `${meridiem ?? ''} ${hour}시`.trim() : (meridiem ?? '')
      findings.push({
        key: 'nextVisit',
        value: at.toISOString(),
        text: `${at.getMonth() + 1}월 ${at.getDate()}일 (${WEEKDAYS[at.getDay()]}) ${time}`.trim(),
        quote: sentence,
        needsCheck: null,
      })
    }
  }

  // 측정 시점 → 목표 → 다음 진료일 → 애매한 것 순
  const ORDER = ['postMealHours', 'postMeal', 'fasting', 'nextVisit']
  findings.sort(
    (a, b) =>
      Number(!!a.needsCheck) - Number(!!b.needsCheck) ||
      ORDER.indexOf(a.key) - ORDER.indexOf(b.key),
  )
  return { findings, insulinQuote }
}
