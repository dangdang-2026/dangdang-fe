import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router'
import { ROUTES } from '@/constants/routes'

import iconHome from '@/assets/icons/tab-bar/home.svg'
import iconHomeActive from '@/assets/icons/tab-bar/home-active.svg'
import iconList from '@/assets/icons/tab-bar/list.svg'
import iconListActive from '@/assets/icons/tab-bar/list-active.svg'
import iconSteth from '@/assets/icons/tab-bar/steth.svg'
import iconStethActive from '@/assets/icons/tab-bar/steth-active.svg'
import iconCommunity from '@/assets/icons/tab-bar/community.svg'
import iconCommunityActive from '@/assets/icons/tab-bar/community-active.svg'
import iconUser from '@/assets/icons/tab-bar/user.svg'
import iconUserActive from '@/assets/icons/tab-bar/user-active.svg'

const TABS = [
  { label: '오늘', to: ROUTES.TODAY, icon: iconHome, activeIcon: iconHomeActive },
  { label: '기록', to: ROUTES.RECORDS, icon: iconList, activeIcon: iconListActive },
  { label: '진료', to: ROUTES.VISIT, icon: iconSteth, activeIcon: iconStethActive },
  { label: '커뮤니티', to: ROUTES.COMMUNITY, icon: iconCommunity, activeIcon: iconCommunityActive },
  { label: '마이', to: ROUTES.MY, icon: iconUser, activeIcon: iconUserActive },
]

// 활성 표시·아이콘 이동 공통 전환
const MOTION = 'duration-300 ease-in-out motion-reduce:transition-none'

function getActiveIndex(pathname: string) {
  const index = TABS.findIndex(({ to }) =>
    to === ROUTES.TODAY ? pathname === to : pathname.startsWith(to),
  )
  return Math.max(index, 0)
}

// 활성 탭 위치로 이동하는 탭 한 칸 너비 상자. 자식은 가운데 기준 배치
function TabIndicator({ index, children }: { index: number; children: ReactNode }) {
  return (
    <div aria-hidden className="absolute inset-x-5 inset-y-0">
      <div
        className={`relative h-full w-1/5 transition-transform ${MOTION}`}
        style={{ transform: `translateX(${index * 100}%)` }}
      >
        {children}
      </div>
    </div>
  )
}

function TabBar() {
  const { pathname } = useLocation()
  const activeIndex = getActiveIndex(pathname)

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-107.5 -translate-x-1/2 px-5 pt-2.5 pb-[max(--spacing(5),env(safe-area-inset-bottom))]"
    >
      {/* 바 + 볼록한 부분 전체에 그림자 적용 */}
      <div className="drop-shadow-tab-bar absolute inset-0">
        <div className="absolute inset-0 bg-white" />
        <TabIndicator index={activeIndex}>
          {/* 반지름 33px, 중심은 바 윗변 1px 아래 */}
          <span className="absolute -top-8 left-1/2 size-16.5 -translate-x-1/2 rounded-full bg-white" />
          {/* 원과 바를 잇는 오목 곡선(반지름 12px), 원 중심에서 43px 지점에서 바와 만남 */}
          <span className="absolute -top-3 left-1/2 flex w-21.5 -translate-x-1/2 justify-between">
            <span className="size-3 bg-radial-[circle_at_top_left] from-transparent from-68% to-white to-71%" />
            <span className="size-3 bg-radial-[circle_at_top_right] from-transparent from-68% to-white to-71%" />
          </span>
        </TabIndicator>
      </div>

      <TabIndicator index={activeIndex}>
        <span className="bg-primary shadow-tab-active absolute -top-6.5 left-1/2 size-13 -translate-x-1/2 rounded-full" />
      </TabIndicator>

      <ul className="relative flex">
        {TABS.map(({ label, to, icon, activeIcon }, index) => {
          const isActive = index === activeIndex

          return (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={to === ROUTES.TODAY}
                className={`flex flex-col items-center gap-1 rounded-2xl py-1.5 transition-transform ${MOTION} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 active:scale-95`}
              >
                {/* 활성 시 노란 원 중심까지 28px 올라가고 흰 아이콘으로 전환 */}
                <span
                  className={`relative size-6 transition-transform ${MOTION} ${isActive ? '-translate-y-7' : ''}`}
                >
                  <img
                    src={icon}
                    alt=""
                    width={24}
                    height={24}
                    className={`absolute inset-0 transition-opacity ${MOTION} ${isActive ? 'opacity-0' : ''}`}
                  />
                  <img
                    src={activeIcon}
                    alt=""
                    width={24}
                    height={24}
                    className={`absolute inset-0 transition-opacity ${MOTION} ${isActive ? '' : 'opacity-0'}`}
                  />
                </span>
                <span
                  className={`text-caption whitespace-nowrap transition-colors ${MOTION} ${
                    isActive ? 'text-orange-400' : 'text-grey-400'
                  }`}
                >
                  {label}
                </span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default TabBar
