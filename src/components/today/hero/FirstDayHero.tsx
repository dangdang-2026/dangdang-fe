import iconUtensils from '@/assets/icons/utensils.svg'
import hill from '@/assets/images/dangdang/hill.svg'
import dangdangBody from '@/assets/images/dangdang/hero-body.svg'
import dangdangFace from '@/assets/images/dangdang/hero-face.svg'
import HeroShell from '@/components/today/hero/HeroShell'
import { HeroButton } from '@/components/today/hero/HeroParts'

type FirstDayHeroProps = {
  postMealHours: number | null
  onStartMeal: () => void
}

// Figma 「당당/홈 히어로 카드」 첫날 상태
function FirstDayHero({ postMealHours, onStartMeal }: FirstDayHeroProps) {
  return (
    <HeroShell
      status="처음 쓰는 날"
      postMealHours={postMealHours}
      gradient="from-yellow-50 to-hero-to"
      decoration={
        // 언덕 위 당당이. 카드 오른쪽 기준 배치
        <>
          <img
            src={hill}
            alt=""
            width={300}
            height={150}
            className="absolute top-42 -right-32.5 max-w-none"
          />
          <span aria-hidden className="absolute top-23 right-6.5 size-28">
            <img src={dangdangBody} alt="" className="absolute top-2/15 left-7/40 max-w-none" />
            <img src={dangdangFace} alt="" width={112} height={112} className="absolute inset-0" />
          </span>
        </>
      }
    >
      <h2 className="text-hero text-grey-900 mt-2.5">
        밥 먹기 시작할 때
        <br />이 버튼만 눌러 주세요
      </h2>
      <p className="text-grey-700 mt-4 text-sm leading-normal font-medium">
        {postMealHours
          ? `${postMealHours}시간 뒤에 잴 시간을 알려 드려요`
          : '식사 시작 시각만 적어 둘게요'}
      </p>
      <HeroButton icon={iconUtensils} onClick={onStartMeal}>
        식사 시작
      </HeroButton>
    </HeroShell>
  )
}

export default FirstDayHero
