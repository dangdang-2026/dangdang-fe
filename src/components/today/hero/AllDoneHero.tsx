import { useNavigate } from 'react-router'
import iconCheck from '@/assets/icons/check.svg'
import iconClipboard from '@/assets/icons/today/clipboard.svg'
import beforeMeal from '@/assets/images/dangdang/before-meal.svg'
import HeroShell from '@/components/today/hero/HeroShell'
import { HeroButton, HeroChip, HillDangdang } from '@/components/today/hero/HeroParts'
import { ROUTES } from '@/constants/routes'

type AllDoneHeroProps = {
  postMealHours: number | null
  // 오늘 기록한 측정 수
  count: number
}

// 오늘 측정 모두 완료. 피그마에 없어 H-07 하루 정리 틀에 문구만 바꿈
function AllDoneHero({ postMealHours, count }: AllDoneHeroProps) {
  const navigate = useNavigate()
  return (
    <HeroShell
      status="오늘 하루 수고했어요"
      postMealHours={postMealHours}
      decoration={<HillDangdang body={beforeMeal} />}
    >
      <h2 className="text-title-2 text-grey-900 mt-1.5">
        오늘 잴 것은
        <br />다 재었어요
      </h2>
      <div className="mt-7.5">
        <HeroChip icon={iconCheck}>오늘 {count}번 모두 기록함</HeroChip>
      </div>
      <HeroButton icon={iconClipboard} onClick={() => navigate(ROUTES.RECORDS)}>
        오늘 기록 보기
      </HeroButton>
    </HeroShell>
  )
}

export default AllDoneHero
