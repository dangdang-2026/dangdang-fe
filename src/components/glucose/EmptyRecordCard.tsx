import iconDrop from '@/assets/icons/drop.svg'
import iconPlus from '@/assets/icons/plus.svg'

type EmptyRecordCardProps = {
  title: string
  description: string
  onInputGlucose: () => void
}

// 기록 없을 때 빈 상태. 빨간 표시 없이 입력만 권함
function EmptyRecordCard({ title, description, onInputGlucose }: EmptyRecordCardProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl bg-white px-4.5 py-5.5 text-center">
      <span className="bg-grey-50 flex size-12 items-center justify-center rounded-full">
        <img src={iconDrop} alt="" width={22} height={22} />
      </span>
      <p className="text-t6 text-grey-700 font-bold">{title}</p>
      <p className="text-t7 text-grey-500">{description}</p>
      <button
        type="button"
        className="bg-grey-100 text-t7 text-grey-700 flex items-center gap-1 rounded-full px-3.5 py-2 font-bold"
        onClick={onInputGlucose}
      >
        <img src={iconPlus} alt="" width={14} height={14} />
        혈당 입력
      </button>
    </div>
  )
}

export default EmptyRecordCard
