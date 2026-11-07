import iconPencilWhite from '@/assets/icons/pencil-white.svg'

type VisitDoneCardProps = {
  day: 'today' | 'yesterday'
  onWrite: () => void
}

// Figma C-27 진료 다녀온 뒤 카드. 들은 말을 잊기 전에 메모로
function VisitDoneCard({ day, onWrite }: VisitDoneCardProps) {
  return (
    <section className="from-hero-to flex flex-col items-start gap-1.5 rounded-3xl bg-linear-to-b to-yellow-400 p-5">
      <span className="text-grey-900 rounded-full bg-white px-2.5 py-1 text-xs leading-normal font-bold">
        {day === 'today' ? '오늘' : '어제'} 진료 · 다녀옴
      </span>
      <h2 className="text-t4 text-grey-900">진료 잘 다녀오셨어요?</h2>
      <p className="text-grey-700 text-sm leading-normal font-medium">
        들은 말을 잊기 전에 적어 두세요
      </p>
      <button
        type="button"
        className="bg-grey-900 rounded-key mt-1.5 flex h-12 w-full items-center justify-center gap-1.5 text-base font-bold text-white"
        onClick={onWrite}
      >
        <img src={iconPencilWhite} alt="" width={18} height={18} />
        진료 후 메모 쓰기
      </button>
    </section>
  )
}

export default VisitDoneCard
