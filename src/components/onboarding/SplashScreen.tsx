import iconFile from '@/assets/icons/file.svg'
import splashCharacter from '@/assets/images/onboarding/splash-character.svg'
import splashHill from '@/assets/images/onboarding/splash-hill.svg'
import wordmark from '@/assets/images/onboarding/wordmark.svg'

type SplashScreenProps = {
  // 다시 열 때는 캐릭터를 줄이고 당당 소식 한 장
  news?: { title: string; onOpen: () => void }
  onSkip: () => void
}

// Figma S-01 스플래시 · S-01b 재실행 스플래시(당당 소식 카드). 아무 데나 누르면 넘어감
function SplashScreen({ news, onSkip }: SplashScreenProps) {
  return (
    <div
      role="presentation"
      className="animate-fade-in fixed inset-0 z-70 mx-auto w-full max-w-107.5 overflow-hidden bg-white motion-reduce:animate-none"
      onClick={onSkip}
    >
      <img
        src={splashHill}
        alt=""
        className={`absolute -left-46 max-w-none ${news ? 'top-90' : 'top-130'}`}
      />
      {news ? (
        <img
          src={splashCharacter}
          alt=""
          width={182}
          height={239}
          className="absolute top-37 left-1/2 -translate-x-1/2"
        />
      ) : (
        <img src={splashCharacter} alt="" className="absolute top-42 left-11 max-w-none" />
      )}
      <div
        className={`absolute inset-x-0 flex flex-col items-center gap-3 text-center ${news ? 'top-107' : 'top-154.5'}`}
      >
        <img src={wordmark} alt="당당" />
        <p className="text-grey-800 text-base leading-normal font-medium tracking-tight">
          병원에서 받은 기준대로,
          <br />
          하루가 끊기지 않게
        </p>
      </div>
      {news && (
        <button
          type="button"
          className="shadow-receipt absolute inset-x-6 bottom-16 overflow-hidden rounded-3xl bg-white text-left"
          onClick={(event) => {
            event.stopPropagation()
            news.onOpen()
          }}
        >
          <span className="flex h-32 items-center justify-center bg-yellow-50">
            <img src={iconFile} alt="" width={40} height={40} />
          </span>
          <span className="flex flex-col gap-1 px-5 py-4">
            <span className="text-grey-500 text-xs leading-snug">당당 소식</span>
            <span className="text-grey-900 text-base leading-snug font-bold">{news.title}</span>
          </span>
        </button>
      )}
    </div>
  )
}

export default SplashScreen
