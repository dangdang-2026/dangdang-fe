import iconPencil from '@/assets/icons/pencil.svg'
import iconUtensils from '@/assets/icons/utensils.svg'
import hill from '@/assets/images/dangdang/hill.svg'
import dangdangBody from '@/assets/images/dangdang/hero-body.svg'
import dangdangFace from '@/assets/images/dangdang/hero-face.svg'

type HeroCardProps = {
  postMealHours: number
}

// Figma 「당당/홈 히어로 카드」 첫날 상태
function HeroCard({ postMealHours }: HeroCardProps) {
  return (
    <section className="rounded-hero to-hero-to relative flex h-75 flex-col overflow-hidden bg-linear-147 from-yellow-50 from-14% to-86% px-5 pt-4.5 pb-5">
      {/* 언덕 위 당당이. 카드 오른쪽 기준 배치 */}
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

      <div className="relative flex items-start justify-between">
        <p className="text-body-3 text-primary mt-0.5">처음 쓰는 날</p>
        <button
          type="button"
          className="text-grey-800 flex items-center gap-1 rounded-full bg-white py-1 pr-2 pl-2.5 text-xs leading-normal font-semibold"
        >
          식후 {postMealHours}시간
          <img src={iconPencil} alt="" width={12} height={12} />
        </button>
      </div>
      <h2 className="text-hero text-grey-900 relative mt-2.5">
        밥 먹기 시작할 때
        <br />이 버튼만 눌러 주세요
      </h2>
      <p className="text-grey-700 relative mt-4 text-sm leading-normal font-medium">
        {postMealHours}시간 뒤에 잴 시간을 알려 드려요
      </p>
      <button
        type="button"
        className="bg-grey-900 text-subtitle-1 text-grey-50 relative mt-auto flex h-14 items-center justify-center gap-2 rounded-2xl"
      >
        <img src={iconUtensils} alt="" width={20} height={20} />
        식사 시작
      </button>
    </section>
  )
}

export default HeroCard
