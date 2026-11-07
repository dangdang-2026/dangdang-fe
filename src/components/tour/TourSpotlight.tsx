import { useEffect, useState, type RefObject } from 'react'
import tail from '@/assets/images/tour/bubble-tail.svg'
import body52 from '@/assets/images/tour/body-52.svg'
import hello52 from '@/assets/images/tour/hello-52.svg'
import type { TourStep, TourTarget } from '@/constants/tour'

// 대상과 고리 사이 기본 여백
const DEFAULT_PAD = 6
// 고리 바깥에서 퍼지는 고리까지
const PULSE_GAP = 8
// 구멍과 말풍선 사이
const GUIDE_GAP = 20
// 말풍선이 아래에 들어갈 높이(말풍선 + 건너뛰기 + 탭 바)
const GUIDE_SPACE = 320

type Hole = { top: number; left: number; width: number; height: number; radius: number }

type TourSpotlightProps = {
  rootRef: RefObject<HTMLElement | null>
  step: TourStep
  index: number
  total: number
  onNext: () => void
  onSkip: () => void
}

function findTarget(root: HTMLElement, target: TourTarget) {
  if ('selector' in target) return root.querySelector<HTMLElement>(target.selector)
  return (
    [...root.querySelectorAll<HTMLElement>('button')].find((button) =>
      button.textContent?.includes(target.text),
    ) ?? null
  )
}

function measureHole(element: HTMLElement, step: TourStep): Hole {
  const box = element.getBoundingClientRect()
  const pad = step.pad ?? DEFAULT_PAD
  // rounded-full은 높이 절반까지만
  const ownRadius = Math.min(
    parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0,
    box.height / 2,
  )
  return {
    top: box.top - pad,
    left: box.left - pad,
    width: box.width + pad * 2,
    height: box.height + pad * 2,
    radius: (ownRadius || step.radius || 0) + pad,
  }
}

// Figma A-05b~A-05g 대상만 밝히고 당당이 말풍선으로 설명
function TourSpotlight({ rootRef, step, index, total, onNext, onSkip }: TourSpotlightProps) {
  const [hole, setHole] = useState<Hole | null>(null)
  const last = index === total - 1

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const measure = () => {
      const element = findTarget(root, step.target)
      if (element) setHole(measureHole(element, step))
    }
    const frame = requestAnimationFrame(measure)
    // 시트가 올라오는 애니메이션이 끝난 뒤 위치로 다시 잼
    root.addEventListener('animationend', measure)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(frame)
      root.removeEventListener('animationend', measure)
      window.removeEventListener('resize', measure)
    }
  }, [rootRef, step])

  const bottom = hole ? hole.top + hole.height : 0
  const below = hole ? bottom + GUIDE_SPACE <= window.innerHeight : true
  const centerX = hole ? hole.left + hole.width / 2 : 0

  return (
    <div role="dialog" aria-modal="true" aria-label="가이드 투어" className="fixed inset-0 z-70">
      {hole ? (
        <>
          <div
            aria-hidden
            className="shadow-spotlight absolute border-3 border-yellow-500"
            style={{
              top: hole.top,
              left: hole.left,
              width: hole.width,
              height: hole.height,
              borderRadius: hole.radius,
            }}
          />
          <div
            aria-hidden
            className="animate-spotlight-pulse absolute border-2 border-yellow-500 motion-reduce:animate-none"
            style={{
              top: hole.top - PULSE_GAP,
              left: hole.left - PULSE_GAP,
              width: hole.width + PULSE_GAP * 2,
              height: hole.height + PULSE_GAP * 2,
              borderRadius: hole.radius + PULSE_GAP,
            }}
          />
          {/* 꼬리는 대상 가운데를 가리킴 */}
          <img
            src={tail}
            alt=""
            className={`absolute -translate-x-1/2 ${below ? '-translate-y-full' : 'rotate-180'}`}
            style={{ left: centerX, top: below ? bottom + GUIDE_GAP : hole.top - GUIDE_GAP }}
          />
          <div
            className="absolute inset-x-0 mx-auto flex w-full max-w-107.5 items-start gap-2 px-5"
            style={
              below
                ? { top: bottom + GUIDE_GAP }
                : { bottom: window.innerHeight - hole.top + GUIDE_GAP }
            }
          >
            <span
              aria-hidden
              className="relative size-13 shrink-0 overflow-hidden rounded-full bg-yellow-50"
            >
              <span className="absolute -top-0.5 -left-1 size-15.5">
                <img src={body52} alt="" className="absolute top-2/15 left-7/40 max-w-none" />
                <img src={hello52} alt="" className="absolute inset-0 max-w-none" />
              </span>
            </span>
            <div className="shadow-guide rounded-banner flex min-w-0 flex-1 flex-col gap-1.5 bg-white px-4.5 py-4">
              <h2 className="text-grey-900 text-base leading-normal font-bold">{step.title}</h2>
              <p className="text-grey-700 text-sm leading-normal">{step.description}</p>
              <div className="flex items-center justify-between pt-1.5">
                <span className="text-t7 text-grey-500 font-medium">
                  {index + 1} / {total}
                </span>
                <button
                  type="button"
                  autoFocus
                  className="bg-primary rounded-full px-4 py-2 text-sm leading-snug font-bold text-white"
                  onClick={onNext}
                >
                  {last ? '완료' : '다음'}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div aria-hidden className="bg-veil absolute inset-0" />
      )}

      <button
        type="button"
        className="absolute bottom-[calc(--spacing(23)+max(--spacing(5),env(safe-area-inset-bottom)))] left-1/2 -translate-x-1/2 text-sm leading-snug font-medium text-white"
        onClick={onSkip}
      >
        건너뛰기
      </button>
    </div>
  )
}

export default TourSpotlight
