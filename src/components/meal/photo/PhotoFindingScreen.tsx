import ChatAvatar from '@/components/chat/ChatAvatar'
import PhotoScreen from '@/components/meal/photo/PhotoScreen'

type PhotoFindingScreenProps = {
  photoUrl: string
  onWriteName: () => void
  onClose: () => void
}

// Figma F-11 사진 음식 찾는 중. 기다리지 않고 이름으로 적어도 됨
function PhotoFindingScreen({ photoUrl, onWriteName, onClose }: PhotoFindingScreenProps) {
  return (
    <PhotoScreen
      title="식사 내용"
      onBack={onClose}
      footer={
        <button
          type="button"
          className="bg-grey-100 text-grey-400 rounded-key w-full py-4 text-base leading-snug font-bold"
          onClick={onWriteName}
        >
          기다리지 않고 이름으로 적기
        </button>
      }
    >
      <div className="rounded-banner relative aspect-square w-full shrink-0 overflow-hidden">
        <img src={photoUrl} alt="찍은 식사 사진" className="size-full object-cover" />
        {/* 스캔 띠(80px) 아래 끝에 선 */}
        <span className="animate-scan absolute inset-x-0 h-20 bg-linear-to-b from-yellow-500/0 to-yellow-500/55 motion-reduce:hidden">
          <span className="absolute inset-x-0 bottom-0 h-1 bg-yellow-500" />
        </span>
      </div>

      <div role="status" className="flex items-center gap-3 pt-2">
        <ChatAvatar variant="thinkLg" />
        <div className="flex flex-col gap-0.5 leading-snug">
          <p className="text-subtitle-1 text-grey-900 leading-snug">어떤 음식인지 찾고 있어요</p>
          <p className="text-grey-600 text-sm">보통 몇 초면 끝나요</p>
        </div>
      </div>
    </PhotoScreen>
  )
}

export default PhotoFindingScreen
