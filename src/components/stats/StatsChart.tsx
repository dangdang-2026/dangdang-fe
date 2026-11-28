import { useState, type PointerEvent } from 'react'
import type { DayPoint } from '@/utils/stats'

// Figma D-17 그래프 영역 350x200. 왼쪽 눈금 글자, 선은 x 40~342, y 12~160, 날짜 글자는 아래
const WIDTH = 350
const HEIGHT = 196
const LEFT = 40
const RIGHT = 342
const TOP = 12
const BOTTOM = 160
// 낮은 값 기준(mg/dL). 기준 띠 아래 끝
const LOW = 70
// 눈금 글자끼리 최소 간격(px)
const TICK_GAP = 14

type Point = { x: number; y: number }

type StatsChartProps = {
  current: DayPoint[]
  // 비교할 지난 기간. 없으면 이번 기간만
  previous: DayPoint[] | null
  // 날마다 그날 병원 기준. 없으면 null(기준 띠 없음)
  targets: (number | null)[]
  selected: number | null
  // toggle: 처음 누를 때만 같은 날을 다시 누르면 풀기. 끄는 동안엔 옮기기만
  onSelect: (index: number | null, toggle: boolean) => void
}

const shortDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`

// 기록 없는 날에서 끊은 선 조각들
function segments(days: DayPoint[], toPoint: (index: number, value: number) => Point) {
  const result: Point[][] = []
  let run: Point[] = []
  days.forEach((day, index) => {
    if (day.value === null) {
      if (run.length) result.push(run)
      run = []
      return
    }
    run.push(toPoint(index, day.value))
  })
  if (run.length) result.push(run)
  return result
}

const linePath = (list: Point[]) =>
  list.map((point, index) => `${index ? 'L' : 'M'}${point.x} ${point.y}`).join(' ')

// Figma D-17·D-18·D-21 혈당 통계 그래프. 누르거나 밀면 그날 값 짚어 보기
function StatsChart({ current, previous, targets, selected, onSelect }: StatsChartProps) {
  const [dragging, setDragging] = useState(false)
  const length = current.length
  const values = [...current, ...(previous ?? [])]
    .map((day) => day.value)
    .filter((value): value is number => value !== null)
  const goals = targets.filter((value): value is number => value !== null)
  // 눈금: 아래 70(더 낮은 값이 있으면 그 아래), 위는 값 · 기준보다 넉넉히 10 단위로
  const bottom = Math.min(LOW, Math.floor((Math.min(...values) - 5) / 10) * 10)
  const top = Math.max(
    Math.ceil((Math.max(...values, LOW) + 10) / 10) * 10,
    goals.length ? Math.ceil((Math.max(...goals) + 25) / 10) * 10 : 0,
  )
  const x = (index: number) =>
    length > 1 ? LEFT + (index * (RIGHT - LEFT)) / (length - 1) : (LEFT + RIGHT) / 2
  const y = (value: number) => BOTTOM - ((value - bottom) / (top - bottom)) * (BOTTOM - TOP)
  // 눈금 글자: 지금 기준 · 70 · 지난 기준 · 위 · 아래 순으로, 가까워 겹치는 글자는 뺌
  const ticks = [goals.at(-1), LOW, ...goals.slice(0, -1).reverse(), top, bottom].reduce<number[]>(
    (kept, tick) =>
      tick === undefined || kept.some((other) => Math.abs(y(other) - y(tick)) < TICK_GAP)
        ? kept
        : [...kept, tick],
    [],
  )
  const toPoint = (index: number, value: number) => ({ x: x(index), y: y(value) })

  const currentRuns = segments(current, toPoint)
  const previousRuns = previous ? segments(previous.slice(0, length), toPoint) : []
  const last = currentRuns.at(-1)?.at(-1)

  // 기준 띠: 날마다 그날 기준까지, 기준이 바뀐 날에서 계단
  const half = length > 1 ? (RIGHT - LEFT) / (length - 1) / 2 : (RIGHT - LEFT) / 2
  const bands = targets.flatMap((goal, index) => {
    if (goal === null) return []
    const from = Math.max(LEFT, x(index) - half)
    const to = Math.min(RIGHT, x(index) + half)
    return [{ index, from, to, goal }]
  })
  const goalPath = bands
    .map((band, index) => {
      const previousBand = bands[index - 1]
      // 바로 앞 날과 이어진 띠면 계단 세로선으로 잇기
      const joined = previousBand && previousBand.index === band.index - 1
      return `${joined ? 'L' : 'M'}${band.from} ${y(band.goal)} L${band.to} ${y(band.goal)}`
    })
    .join(' ')

  // 1주는 날마다, 그보다 길면 처음·가운데·끝
  const labelIndexes =
    length <= 7 ? current.map((_, index) => index) : [0, Math.floor((length - 1) / 2), length - 1]

  const pick = (event: PointerEvent<SVGSVGElement>, toggle: boolean) => {
    const box = event.currentTarget.getBoundingClientRect()
    const position = ((event.clientX - box.left) / box.width) * WIDTH
    const index = Math.round(((position - LEFT) / (RIGHT - LEFT)) * (length - 1))
    const clamped = Math.min(length - 1, Math.max(0, index))
    // 기록이 없는 날은 짚지 않음
    onSelect(current[clamped]?.value === null ? null : clamped, toggle)
  }

  const selectedDay = selected !== null ? current[selected] : null
  const previousDay = selected !== null ? previous?.[selected] : null

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="기간별 혈당 그래프"
      className="w-full touch-none overflow-visible select-none"
      onPointerDown={(event) => {
        setDragging(true)
        pick(event, true)
      }}
      onPointerMove={(event) => dragging && pick(event, false)}
      onPointerUp={() => setDragging(false)}
      onPointerLeave={() => setDragging(false)}
    >
      <defs>
        <linearGradient id="stats-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--color-primary)" stopOpacity="0.18" />
          <stop offset="1" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {bands.map((band) => (
        <rect
          key={band.from}
          x={band.from}
          y={y(band.goal)}
          width={band.to - band.from}
          height={Math.max(0, y(LOW) - y(band.goal))}
          className="fill-grey-100"
        />
      ))}
      {goalPath && <path d={goalPath} fill="none" className="stroke-grey-300" />}

      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={LEFT - 6} x2={WIDTH} y1={y(tick)} y2={y(tick)} className="stroke-grey-100" />
          <text x={0} y={y(tick) + 4} className="fill-grey-600 text-caption font-medium">
            {tick}
          </text>
        </g>
      ))}

      {previousRuns.map(
        (run) =>
          run.length > 1 && (
            <path
              key={run[0].x}
              d={linePath(run)}
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              className="stroke-grey-300"
            />
          ),
      )}
      {length <= 7 &&
        previousRuns
          .flat()
          .map((point) => (
            <circle key={point.x} cx={point.x} cy={point.y} r={2.5} className="fill-grey-300" />
          ))}
      {currentRuns.map((run) => (
        <g key={run[0].x}>
          {run.length > 1 && (
            <path
              d={`${linePath(run)} L${run.at(-1)!.x} ${BOTTOM} L${run[0].x} ${BOTTOM} Z`}
              fill="url(#stats-area)"
            />
          )}
          {run.length > 1 && (
            <path
              d={linePath(run)}
              fill="none"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="stroke-primary"
            />
          )}
        </g>
      ))}
      {/* 1주 · 앞뒤가 끊긴 하루 값은 점으로 */}
      {currentRuns
        .flatMap((run) => (length <= 7 || run.length === 1 ? run : []))
        .map((point) => (
          <circle
            key={point.x}
            cx={point.x}
            cy={point.y}
            r={3.5}
            strokeWidth={2}
            className="stroke-primary fill-white"
          />
        ))}
      {last && selected === null && (
        <circle
          cx={last.x}
          cy={last.y}
          r={4}
          strokeWidth={2}
          className="fill-primary stroke-white"
        />
      )}

      {selectedDay?.value != null && selected !== null && (
        <>
          <line x1={x(selected)} x2={x(selected)} y1={0} y2={BOTTOM} className="stroke-grey-500" />
          {previousDay?.value != null && (
            <circle cx={x(selected)} cy={y(previousDay.value)} r={4} className="fill-grey-300" />
          )}
          <circle
            cx={x(selected)}
            cy={y(selectedDay.value)}
            r={4.75}
            strokeWidth={2.5}
            className="fill-primary stroke-white"
          />
        </>
      )}

      {labelIndexes.map((index, order) => (
        <text
          key={index}
          x={x(index)}
          y={HEIGHT - 8}
          // 1주는 가운데 맞춤, 길면 양 끝 날짜를 안쪽으로 붙임
          textAnchor={
            length <= 7
              ? 'middle'
              : order === 0
                ? 'start'
                : order === labelIndexes.length - 1
                  ? 'end'
                  : 'middle'
          }
          className="fill-grey-600 text-caption font-normal"
        >
          {shortDate(current[index].date)}
        </text>
      ))}
    </svg>
  )
}

export default StatsChart
