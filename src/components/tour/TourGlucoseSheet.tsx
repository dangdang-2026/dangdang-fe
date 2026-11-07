import iconChevronRight from '@/assets/icons/chevron-right.svg'
import iconClock from '@/assets/icons/clock-sm.svg'
import iconPhone from '@/assets/icons/phone.svg'
import BottomSheet from '@/components/common/BottomSheet'
import GlucoseKeypad from '@/components/glucose/GlucoseKeypad'
import TargetChip from '@/components/glucose/TargetChip'
import { TOUR_GLUCOSE, TOUR_MEASURED_AT, TOUR_POST_MEAL_HOURS } from '@/mocks/tour'
import { formatTime } from '@/utils/date'
import { getSlotLabel } from '@/utils/glucose'

const noop = () => {}

// A-05f 투어용 혈당 입력 시트. G-01 시트 모양에 예시 수치만 채움
function TourGlucoseSheet() {
  return (
    <BottomSheet label="혈당 입력 예시" onClose={noop}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <h2 className="text-t4 text-grey-900">
            {getSlotLabel('post-meal', 'lunch', TOUR_POST_MEAL_HOURS)}
          </h2>
          <p className="text-grey-800 flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs leading-normal font-bold">
            <img src={iconClock} alt="" width={12} height={12} />
            측정 {formatTime(TOUR_MEASURED_AT)} · 제시간
          </p>
        </div>
        <span className="bg-grey-100 text-t7 text-grey-600 rounded-full px-3 py-2 font-bold">
          10분 뒤 다시
        </span>
      </div>

      <div className="flex justify-center">
        <div
          data-tour="glucose-result"
          className="flex flex-col items-center gap-1.5 px-2.5 py-3.5"
        >
          <p className="flex items-baseline gap-1.5">
            <span className="text-display text-grey-900">{TOUR_GLUCOSE.value}</span>
            <span className="text-grey-400 text-base leading-normal font-medium">mg/dL</span>
          </p>
          <TargetChip comparison="in-range" target={TOUR_GLUCOSE.target} />
        </div>
      </div>

      <p className="bg-grey-50 flex items-center gap-2.5 rounded-2xl px-4 py-3">
        <img src={iconPhone} alt="" width={18} height={18} />
        <span className="text-grey-700 flex-1 text-sm leading-normal font-medium">
          병원에서 들은 연락 기준
        </span>
        <img src={iconChevronRight} alt="" width={18} height={18} />
      </p>

      <GlucoseKeypad onDigit={noop} onDelete={noop} />

      <span className="text-subtitle-1 bg-primary flex h-14 items-center justify-center rounded-xl leading-none text-white">
        저장
      </span>
    </BottomSheet>
  )
}

export default TourGlucoseSheet
