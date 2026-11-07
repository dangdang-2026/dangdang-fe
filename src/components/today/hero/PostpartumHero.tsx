import iconBellOff from '@/assets/icons/postpartum/bell-off.svg'
import iconBell from '@/assets/icons/postpartum/bell.svg'
import faceHappy from '@/assets/images/dangdang/face-happy.svg'
import HeroShell from '@/components/today/hero/HeroShell'
import { HeroButton, HeroChip, HillDangdang } from '@/components/today/hero/HeroParts'

type PostpartumHeroProps = {
  onOpenSettings: () => void
}

// Figma E-07 히어로 카드 · 산후
function PostpartumHero({ onOpenSettings }: PostpartumHeroProps) {
  return (
    <HeroShell
      status="출산 축하해요"
      postMealHours={null}
      chip="산후 모드"
      muted
      decoration={<HillDangdang face={faceHappy} />}
    >
      <h2 className="text-title-2 text-grey-900 mt-2.5">
        측정 알림은
        <br />
        멈춰 두었어요
      </h2>
      <div className="mt-7.5">
        <HeroChip icon={iconBellOff}>측정·인슐린 알림 꺼짐</HeroChip>
      </div>
      <p className="text-body-3 text-grey-700 mt-2.5">병원 안내가 있으면 다시 켤 수 있어요</p>
      <HeroButton icon={iconBell} light onClick={onOpenSettings}>
        알림 설정 보기
      </HeroButton>
    </HeroShell>
  )
}

export default PostpartumHero
