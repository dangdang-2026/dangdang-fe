import { useState, type PointerEvent } from 'react'
import type { DayPoint } from '@/utils/stats'

// Figma 그래프 영역 350x212. 선은 x 2~344, y 20~168, 날짜 글자는 아래
const WIDTH = 350
const HEIGHT = 212
const LEFT = 2
const RIGHT = 344
const TOP = 20
const BOTTOM = 168

type StatsChartProps = {
  current: DayPoint[]
  // 비교할 지난 기간. 없으면 이번 기간만
  previous: DayPoint[] | null
  target: number | null
  selected: number | null
  onSelect: (index: number | null) => void
}

const shortDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`

// Figma D-17·D-18 혈당 통계 그래프. 누르거나 밀면 그날 값 짚어 보기
function StatsChart({ current, previous, target, selected, onSelect }: StatsChartProps) {
  const [dragging, setDragging] = useState(false)
  const length = current.length
  const values = [...current, ...(previous ?? [])]
    .map((day) => day.value)
    .filter((value): value is number => value !== null)
  const min = Math.min(...values, target ?? Infinity) - 15
  const max = Math.max(...values, target ?? -Infinity) + 15

  const x = (index: number) =>
    length > 1 ? LEFT + (index * (RIGHT - LEFT)) / (length - 1) : (LEFT + RIGHT) / 2
  const y = (value: number) => BOTTOM - ((value - min) / (max - min)) * (BOTTOM - TOP)

  const points = (days: DayPoint[]) =>
    days.flatMap((day, index) => (day.value === null ? [] : [{ x: x(index), y: y(day.value) }]))
  const linePath = (list: { x: number; y: number }[]) =>
    list.map((point, index) => `${index ? 'L' : 'M'}${point.x} ${point.y}`).join(' ')

  const currentPoints = points(current)
  const previousPoints = previous ? points(previous.slice(0, length)) : []
  const last = currentPoints.at(-1)
  const areaPath = currentPoints.length
    ? `${linePath(currentPoints)} L${last!.x} ${BOTTOM} L${currentPoints[0].x} ${BOTTOM} Z`
    : ''

  // 1주는 날마다, 그보다 길면 처음·가운데·끝
  const labelIndexes =
    length <= 7 ? current.map((_, index) => index) : [0, Math.floor((length - 1) / 2), length - 1]

  const pick = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const position = ((event.clientX - box.left) / box.width) * WIDTH
    const index = Math.round(((position - LEFT) / (RIGHT - LEFT)) * (length - 1))
    const clamped = Math.min(length - 1, Math.max(0, index))
    // 기록이 없는 날은 짚지 않음
    onSelect(current[clamped]?.value === null ? null : clamped)
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
        pick(event)
      }}
      onPointerMove={(event) => dragging && pick(event)}
      onPointerUp={() => setDragging(false)}
      onPointerLeave={() => setDragging(false)}
    >
      <defs>
        <linearGradient id="stats-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--color-primary)" stopOpacity="0.18" />
          <stop offset="1" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {target !== null && (
        <>
          <line
            x1={0}
            x2={WIDTH}
            y1={y(target)}
            y2={y(target)}
            strokeDasharray="4 4"
            className="stroke-grey-300"
          />
          <text
            x={WIDTH}
            y={y(target) - 6}
            textAnchor="end"
            className="fill-grey-600 text-caption font-medium"
          >
            내 기준 {target}
          </text>
        </>
      )}

      {previousPoints.length > 1 && (
        <path
          d={linePath(previousPoints)}
          fill="none"
          strokeWidth={1.5}
          strokeDasharray="3 3"
          className="stroke-grey-300"
        />
      )}
      {areaPath && <path d={areaPath} fill="url(#stats-area)" />}
      {currentPoints.length > 1 && (
        <path
          d={linePath(currentPoints)}
          fill="none"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-primary"
        />
      )}
      {length <= 7 &&
        currentPoints.map((point) => (
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
          <line x1={x(selected)} x2={x(selected)} y1={6} y2={BOTTOM} className="stroke-grey-500" />
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
          // 양 끝 날짜는 그래프 밖으로 안 나가게 안쪽으로 붙임
          textAnchor={order === 0 ? 'start' : order === labelIndexes.length - 1 ? 'end' : 'middle'}
          className="fill-grey-600 text-caption font-normal"
        >
          {shortDate(current[index].date)}
        </text>
      ))}
    </svg>
  )
}

export default StatsChart
