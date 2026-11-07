import iconCheck from '@/assets/icons/community/promise-check.svg'
import ChatAvatar from '@/components/chat/ChatAvatar'
import PhotoScreen from '@/components/meal/photo/PhotoScreen'

const TIPS = [
  '밝은 곳에서 찍어 주세요',
  '위에서 내려다보며 음식만 담아 주세요',
  '흔들리지 않게 잠깐 멈춰 주세요',
]

type PhotoUnclearScreenProps = {
  photoUrl: string
  onRetake: () => void
  onWriteName: () => void
  onClose: () => void
}

// Figma F-15 음식을 알아보기 어려움(MEAL-04). 다시 찍는 팁 3개, 알림에는 영향 없음
function PhotoUnclearScreen({ photoUrl, onRetake, onWriteName, onClose }: PhotoUnclearScreenProps) {
  return (
    <PhotoScreen
      title="식사 내용"
      onBack={onClose}
      footer={
        <>
          <button
            type="button"
            className="bg-primary rounded-key w-full py-4 text-base leading-snug font-bold text-white"
            onClick={onRetake}
          >
            다시 찍기
          </button>
          <button
            type="button"
            className="text-grey-600 text-sm leading-snug font-medium underline"
            onClick={onWriteName}
          >
            이름으로 적을게요
          </button>
        </>
      }
    >
      <img
        src={photoUrl}
        alt="찍은 식사 사진"
        className="rounded-banner h-65 w-full shrink-0 object-cover"
      />

      <div className="flex flex-col items-center gap-2.5 pt-1">
        <ChatAvatar variant="sorryLg" />
        <p className="text-grey-900 text-lg leading-snug font-bold">음식을 알아보기 어려워요</p>
      </div>

      <ul className="bg-grey-50 rounded-key flex flex-col gap-2 px-4 py-3.5">
        {TIPS.map((tip) => (
          <li key={tip} className="text-grey-800 flex items-start gap-2 text-sm leading-normal">
            <img src={iconCheck} alt="" width={18} height={18} className="mt-px shrink-0" />
            {tip}
          </li>
        ))}
      </ul>
    </PhotoScreen>
  )
}

export default PhotoUnclearScreen
