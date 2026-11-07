import { Outlet } from 'react-router'
import TabBar from '@/components/common/TabBar'
import ChatbotButton from '@/components/common/ChatbotButton'

function TabLayout() {
  return (
    // 탭 바(84px) + 활성 원 돌출(32px)만큼 하단 여백 확보
    <div className="mx-auto min-h-dvh w-full max-w-107.5 pb-[calc(--spacing(29)+env(safe-area-inset-bottom))]">
      <Outlet />
      <ChatbotButton />
      <TabBar />
    </div>
  )
}

export default TabLayout
