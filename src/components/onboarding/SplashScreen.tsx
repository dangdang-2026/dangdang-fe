import { useLayoutEffect, useRef } from 'react'
import iconFile from '@/assets/icons/file.svg'
import splashCharacter from '@/assets/images/onboarding/splash-character.svg'
import splashHill from '@/assets/images/onboarding/splash-hill.svg'
import splashPose0 from '@/assets/images/onboarding/splash-pose-0.svg'
import splashPose1 from '@/assets/images/onboarding/splash-pose-1.svg'
import splashPose2 from '@/assets/images/onboarding/splash-pose-2.svg'
import splashPose3 from '@/assets/images/onboarding/splash-pose-3.svg'
import splashPose4 from '@/assets/images/onboarding/splash-pose-4.svg'
import wordmark from '@/assets/images/onboarding/wordmark.svg'
import {
  characterKeyframes,
  HILL_RISE_DELAY_MS,
  HILL_RISE_MS,
  hillRiseKeyframes,
  hopKeyframes,
  poseKeyframes,
  REDUCED_FADE,
  REDUCED_FADE_MS,
  sloganKeyframes,
  SPLASH_FADE_DELAY_MS,
  SPLASH_FADE_MS,
  SPLASH_MOTION_MS,
  splashFadeKeyframes,
  wordmarkKeyframes,
} from '@/constants/splashMotion'

// K0~K4 포즈 + 서 있는 포즈(K5·K6)
const POSES = [splashPose0, splashPose1, splashPose2, splashPose3, splashPose4, splashCharacter]

type SplashScreenProps = {
  // 다시 열 때는 캐릭터를 줄이고 당당 소식 한 장
  news?: { title: string; onOpen: () => void }
  onSkip: () => void
}

// Figma S-01 스플래시(v3 언덕을 통통 넘어오는 당당) · S-01b 재실행 스플래시(당당 소식 카드). 아무 데나 누르면 넘어감
function SplashScreen({ news, onSkip }: SplashScreenProps) {
  const screenRef = useRef<HTMLDivElement>(null)
  const hillCoverRef = useRef<HTMLImageElement>(null)
  const characterRef = useRef<HTMLDivElement>(null)
  const hopRef = useRef<HTMLDivElement>(null)
  const poseRefs = useRef<(HTMLImageElement | null)[]>([])
  const wordmarkRef = useRef<HTMLImageElement>(null)
  const sloganRef = useRef<HTMLParagraphElement>(null)

  // 첫 실행만 전체 모션. 재실행은 화면 페이드만
  // 첫 페인트 전에 K0 상태로 두려고 layout effect 사용
  useLayoutEffect(() => {
    if (news) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const options: KeyframeAnimationOptions = { duration: SPLASH_MOTION_MS, fill: 'both' }
    const animations = reduced
      ? [wordmarkRef.current, sloganRef.current].map((el) =>
          el?.animate(REDUCED_FADE, { duration: REDUCED_FADE_MS, fill: 'both' }),
        )
      : [
          characterRef.current?.animate(characterKeyframes, options),
          hopRef.current?.animate(hopKeyframes, options),
          ...poseRefs.current.map((el, pose) => el?.animate(poseKeyframes(pose), options)),
          wordmarkRef.current?.animate(wordmarkKeyframes, options),
          sloganRef.current?.animate(sloganKeyframes, options),
          hillCoverRef.current?.animate(hillRiseKeyframes, {
            duration: HILL_RISE_MS,
            delay: HILL_RISE_DELAY_MS,
            fill: 'forwards',
          }),
          screenRef.current?.animate(splashFadeKeyframes, {
            duration: SPLASH_FADE_MS,
            delay: SPLASH_FADE_DELAY_MS,
            fill: 'forwards',
          }),
        ]
    return () => animations.forEach((animation) => animation?.cancel())
  }, [news])

  return (
    <div
      ref={screenRef}
      role="presentation"
      className={`fixed inset-0 z-70 mx-auto w-full max-w-107.5 overflow-hidden bg-white ${
        news ? 'animate-fade-in motion-reduce:animate-none' : ''
      }`}
      onClick={onSkip}
    >
      <img
        src={splashHill}
        alt=""
        className={`absolute -left-46 max-w-none ${news ? 'top-90' : 'top-130'}`}
      />
      {news ? (
        <img
          src={splashCharacter}
          alt=""
          width={182}
          height={239}
          className="absolute top-37 left-1/2 -translate-x-1/2"
        />
      ) : (
        <div ref={characterRef} className="absolute top-42 left-11">
          {/* 발끝 기준으로 찌그러지도록 origin-bottom */}
          <div ref={hopRef} className="relative origin-bottom">
            {POSES.map((pose, index) => (
              <img
                key={pose}
                ref={(el) => {
                  poseRefs.current[index] = el
                }}
                src={pose}
                alt=""
                className={`max-w-none ${index === POSES.length - 1 ? '' : 'absolute inset-0 opacity-0'}`}
              />
            ))}
          </div>
        </div>
      )}
      <div
        className={`absolute inset-x-0 flex flex-col items-center gap-3 text-center ${news ? 'top-107' : 'top-154.5'}`}
      >
        <img ref={wordmarkRef} src={wordmark} alt="당당" />
        <p
          ref={sloganRef}
          className="text-grey-800 text-base leading-normal font-medium tracking-tight"
        >
          병원에서 받은 기준대로,
          <br />
          하루가 끊기지 않게
        </p>
      </div>
      {/* 올라올 때 캐릭터·글자까지 덮도록 맨 위에 같은 언덕 한 장 더. 올라오기 전엔 숨김 */}
      {!news && (
        <img
          ref={hillCoverRef}
          src={splashHill}
          alt=""
          className="absolute top-130 -left-46 max-w-none opacity-0"
        />
      )}
      {news && (
        <button
          type="button"
          className="shadow-receipt absolute inset-x-6 bottom-16 overflow-hidden rounded-3xl bg-white text-left"
          onClick={(event) => {
            event.stopPropagation()
            news.onOpen()
          }}
        >
          <span className="flex h-32 items-center justify-center bg-yellow-50">
            <img src={iconFile} alt="" width={40} height={40} />
          </span>
          <span className="flex flex-col gap-1 px-5 py-4">
            <span className="text-grey-500 text-xs leading-snug">당당 소식</span>
            <span className="text-grey-900 text-base leading-snug font-bold">{news.title}</span>
          </span>
        </button>
      )}
    </div>
  )
}

export default SplashScreen
