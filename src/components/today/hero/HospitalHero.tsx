import iconArchive from '@/assets/icons/postpartum/archive.svg'
import iconBell from '@/assets/icons/postpartum/bell.svg'
import faceCheer from '@/assets/images/dangdang/face-cheer.svg'
import HeroShell from '@/components/today/hero/HeroShell'
import { HeroButton, HeroChip, HillDangdang } from '@/components/today/hero/HeroParts'

type HospitalHeroProps = {
  onResume: () => void
}

// Figma E-04 히어로 카드 · 입원 · 알림 멈춤
function HospitalHero({ onResume }: HospitalHeroProps) {
  return (
    <HeroShell
      status="입원 중"
      postMealHours={null}
      chip="알림 멈춤"
      muted
      decoration={<HillDangdang face={faceCheer} />}
    >
      <h2 className="text-title-2 text-grey-900 mt-2.5">
        측정 알림을
        <br />
        잠시 멈췄어요
      </h2>
      <div className="mt-7.5">
        <HeroChip icon={iconArchive}>기록은 그대로 남아 있어요</HeroChip>
      </div>
      <p className="text-body-3 text-grey-700 mt-2.5">퇴원하면 다시 켜 주세요</p>
      <HeroButton icon={iconBell} light onClick={onResume}>
        알림 다시 켜기
      </HeroButton>
    </HeroShell>
  )
}

export default HospitalHero
