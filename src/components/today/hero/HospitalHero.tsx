import iconArchive from '@/assets/icons/postpartum/archive.svg'
import iconBell from '@/assets/icons/postpartum/bell.svg'
import faceCheer from '@/assets/images/dangdang/face-cheer.svg'
import HeroShell from '@/components/today/hero/HeroShell'
import { HeroButton, HeroChip, HillDangdang } from '@/components/today/hero/HeroParts'

type HospitalHeroProps = {
  // paused: 다른 상황이에요로 알림만 멈춤(E-03b)
  variant?: 'hospital' | 'paused'
  onResume: () => void
  // 입원 중에만: 출산일 입력으로
  onDelivered?: () => void
}

// Figma E-04 입원 · E-03b 다른 상황 히어로 카드. 알림 멈춤
function HospitalHero({ variant = 'hospital', onResume, onDelivered }: HospitalHeroProps) {
  const paused = variant === 'paused'
  return (
    <HeroShell
      status={paused ? '잠시 쉬어 가요' : '입원 중'}
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
      <p className="text-body-3 text-grey-700 mt-2.5">
        {paused ? '다시 재고 싶을 때 켜 주세요' : '퇴원하면 다시 켜 주세요'}
      </p>
      {paused || !onDelivered ? (
        <HeroButton icon={iconBell} light onClick={onResume}>
          {paused ? '다시 켜기' : '알림 다시 켜기'}
        </HeroButton>
      ) : (
        // 입원했다가 출산하면 바로 출산일 입력
        <div className="mt-auto flex gap-2.5">
          <button
            type="button"
            className="text-subtitle-1 text-grey-900 h-14 flex-1 rounded-2xl bg-white/50"
            onClick={onDelivered}
          >
            출산했어요
          </button>
          <button
            type="button"
            className="text-subtitle-1 text-grey-900 h-14 flex-1 rounded-2xl bg-white"
            onClick={onResume}
          >
            알림 다시 켜기
          </button>
        </div>
      )}
    </HeroShell>
  )
}

export default HospitalHero
