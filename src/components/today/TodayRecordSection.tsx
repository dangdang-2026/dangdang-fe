import iconDrop from '@/assets/icons/drop.svg'
import iconPlus from '@/assets/icons/plus.svg'

type TodayRecordSectionProps = {
  count: number
}

function TodayRecordSection({ count }: TodayRecordSectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-title-3 text-grey-900">오늘 기록</h2>
        <span className="text-body-3 text-grey-500">{count}개</span>
      </div>

      {/* 기록 없을 때 빈 상태 */}
      <div className="mt-3 flex flex-col items-center gap-2 rounded-3xl bg-white px-4.5 py-5.5 text-center">
        <span className="bg-grey-50 flex size-12 items-center justify-center rounded-full">
          <img src={iconDrop} alt="" width={22} height={22} />
        </span>
        <p className="text-t6 text-grey-700 font-bold">아직 기록이 없어요</p>
        <p className="text-t7 text-grey-500">공복 혈당부터 적어도 좋아요</p>
        <button
          type="button"
          className="bg-grey-100 text-t7 text-grey-700 flex items-center gap-1 rounded-full px-3.5 py-2 font-bold"
        >
          <img src={iconPlus} alt="" width={14} height={14} />
          혈당 입력
        </button>
      </div>
    </section>
  )
}

export default TodayRecordSection
