import { useRef, useState, type PointerEvent } from 'react'
import iconArrowRight from '@/assets/icons/arrow-right.svg'

// 끝까지의 80% 넘게 밀면 실행
const COMPLETE_RATIO = 0.8

type SlideToSaveProps = {
  label: string
  onComplete: () => void
}

// Figma C-06 밀어서 저장. 눌러도(키보드 포함) 바로 실행
function SlideToSave({ label, onComplete }: SlideToSaveProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLButtonElement>(null)
  const startX = useRef<number | null>(null)
  const moved = useRef(false)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)

  const maxOffset = () => {
    const track = trackRef.current
    const knob = knobRef.current
    if (!track || !knob) return 0
    // 양옆 안쪽 여백 6px씩 제외
    return track.clientWidth - knob.offsetWidth - 12
  }

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    startX.current = event.clientX
    moved.current = false
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (startX.current === null) return
    const delta = event.clientX - startX.current
    if (Math.abs(delta) > 4) moved.current = true
    setOffset(Math.min(Math.max(delta, 0), maxOffset()))
  }

  const handlePointerUp = () => {
    if (startX.current === null) return
    startX.current = null
    setDragging(false)
    if (moved.current && offset >= maxOffset() * COMPLETE_RATIO) onComplete()
    setOffset(0)
  }

  return (
    <div
      ref={trackRef}
      className="border-hero-to relative flex h-16 items-center gap-3.5 rounded-full border-2 bg-white p-1.5"
    >
      <button
        ref={knobRef}
        type="button"
        aria-label={label}
        className={`bg-primary relative z-10 flex h-13 w-19 shrink-0 touch-none items-center justify-center rounded-full ${
          dragging ? '' : 'transition-transform'
        }`}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          startX.current = null
          setDragging(false)
          setOffset(0)
        }}
        onClick={() => {
          // 밀지 않고 누르기만 했을 때
          if (!moved.current) onComplete()
        }}
      >
        <img src={iconArrowRight} alt="" width={22} height={22} />
      </button>
      <span aria-hidden className="text-body-2 text-grey-500">
        {label}
      </span>
    </div>
  )
}

export default SlideToSave
