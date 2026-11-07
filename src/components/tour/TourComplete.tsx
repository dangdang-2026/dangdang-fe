import body112 from '@/assets/images/tour/body-112.svg'
import done112 from '@/assets/images/tour/done-112.svg'

type TourCompleteProps = {
  onStart: () => void
}

// Figma A-05h 가이드 투어 완료 카드
function TourComplete({ onStart }: TourCompleteProps) {
  return (
    <div className="bg-veil animate-fade-in fixed inset-0 z-70 flex items-center justify-center px-7.5 motion-reduce:animate-none">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-complete-title"
        className="shadow-guide rounded-hero animate-dialog-in flex w-full max-w-82.5 flex-col items-center bg-white px-6 pt-8 pb-6 text-center motion-reduce:animate-none"
      >
        <span
          aria-hidden
          className="animate-pop-in relative size-28 overflow-hidden rounded-full bg-yellow-50 motion-reduce:animate-none"
        >
          <span className="absolute -top-1.5 -left-2.5 size-33">
            <img src={body112} alt="" className="absolute top-2/15 left-7/40 max-w-none" />
            <img src={done112} alt="" className="absolute inset-0 max-w-none" />
          </span>
        </span>
        <h2
          id="tour-complete-title"
          className="text-t3 text-grey-900 animate-rise-in mt-6 motion-reduce:animate-none"
        >
          이제 준비됐어요!
        </h2>
        <p className="text-body-2 text-grey-600 animate-rise-in mt-2 motion-reduce:animate-none">
          오늘부터 당당이와 함께
          <br />
          차근차근 기록해 봐요.
        </p>
        <button
          type="button"
          autoFocus
          className="bg-primary text-subtitle-1 animate-rise-in-late mt-8 h-14 w-full rounded-xl leading-none text-white motion-reduce:animate-none"
          onClick={onStart}
        >
          당당 시작하기
        </button>
      </section>
    </div>
  )
}

export default TourComplete
