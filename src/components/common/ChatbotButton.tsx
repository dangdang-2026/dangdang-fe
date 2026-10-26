import dangdangBody from '@/assets/images/dangdang/chatbot-body.svg'
import dangdangFace from '@/assets/images/dangdang/chatbot-face.svg'
import floorShadow from '@/assets/images/dangdang/chatbot-shadow.svg'

// Figma 「당당/챗봇 버튼 (떠다님)」. 탭 화면 오른쪽 아래 고정
function ChatbotButton() {
  return (
    // 탭 바(80px) + 하단 여백(20px 또는 Safe Area) 위에 고정
    <div className="pointer-events-none fixed bottom-[calc(--spacing(20)+max(--spacing(5),env(safe-area-inset-bottom)))] left-1/2 z-40 flex w-full max-w-107.5 -translate-x-1/2 justify-end">
      <button
        type="button"
        aria-label="당당이에게 물어봐"
        className="pointer-events-auto relative h-24 w-31"
      >
        <img
          src={floorShadow}
          alt=""
          width={34}
          height={6}
          className="animate-float-shadow absolute top-22 left-11 motion-reduce:animate-none"
        />
        <span className="animate-float absolute inset-0 motion-reduce:animate-none">
          <span className="shadow-chatbot absolute top-1 left-7.5 size-16 overflow-hidden rounded-full border-3 border-white bg-yellow-50">
            <span className="absolute top-0 -left-1 size-16.5">
              <img src={dangdangBody} alt="" className="absolute top-2/15 left-7/40 max-w-none" />
              <img src={dangdangFace} alt="" width={66} height={66} className="absolute inset-0" />
            </span>
          </span>
          <span className="rounded-tag shadow-chatbot-tag border-primary text-grey-800 absolute top-16 left-1.5 border-2 bg-white px-2 py-0.5 text-xs leading-normal font-semibold whitespace-nowrap">
            당당이에게 물어봐
          </span>
        </span>
      </button>
    </div>
  )
}

export default ChatbotButton
