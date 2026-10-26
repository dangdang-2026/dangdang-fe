import { useNavigate } from 'react-router'
import iconBell from '@/assets/icons/my/bell.svg'
import iconChevronDark from '@/assets/icons/my/chevron-dark.svg'
import iconHospital from '@/assets/icons/my/hospital.svg'
import iconMenuAi from '@/assets/icons/my/menu-ai.svg'
import iconMenuBell from '@/assets/icons/my/menu-bell.svg'
import iconMenuCommunity from '@/assets/icons/my/menu-community.svg'
import iconMenuData from '@/assets/icons/my/menu-data.svg'
import iconMenuFood from '@/assets/icons/my/menu-food.svg'
import iconMenuHelp from '@/assets/icons/my/menu-help.svg'
import iconMenuHospital from '@/assets/icons/my/menu-hospital.svg'
import iconMenuTarget from '@/assets/icons/my/menu-target.svg'
import iconMenuTerms from '@/assets/icons/my/menu-terms.svg'
import iconReport from '@/assets/icons/my/report.svg'
import iconTarget from '@/assets/icons/my/target.svg'
import iconUtensils from '@/assets/icons/my/utensils.svg'
import profileBody from '@/assets/images/dangdang/profile-body.svg'
import profileFace from '@/assets/images/dangdang/profile-face.svg'
import MyMenuGroup from '@/components/my/MyMenuGroup'
import { ROUTES } from '@/constants/routes'
import { useCriteria } from '@/hooks/useCriteria'
import { useNow } from '@/hooks/useNow'
import { MOCK_HOSPITAL } from '@/mocks/hospital'
import { useFoodStore } from '@/stores/useFoodStore'
import { CARE_MODE_LABEL, useProfileStore } from '@/stores/useProfileStore'
import { useVisitStore } from '@/stores/useVisitStore'
import { formatMeridiemTime } from '@/utils/date'
import { getPregnancyAge } from '@/utils/pregnancy'
import { getVisitStatus } from '@/utils/visit'

const APP_VERSION = '1.0.0'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 예: 10월 24일 (금) 오전 10:30
const formatVisitAt = (at: Date) =>
  `${at.getMonth() + 1}월 ${at.getDate()}일 (${WEEKDAYS[at.getDay()]}) ${formatMeridiemTime(at)}`

// Figma M-01 마이 메인
function MyPage() {
  const navigate = useNavigate()
  const now = useNow()
  const { name, dueDate, careMode } = useProfileStore()
  const criteria = useCriteria()
  const myFoodCount = useFoodStore((state) => state.myFoods.length)
  const nextVisitAt = useVisitStore((state) => state.nextVisitAt)

  const age = getPregnancyAge(dueDate, now)
  const visit = getVisitStatus(nextVisitAt, now)

  const shortcuts = [
    { icon: iconTarget, label: '병원 기준', to: ROUTES.MY_CRITERIA },
    { icon: iconBell, label: '알림', to: ROUTES.MY_NOTIFICATIONS },
    { icon: iconUtensils, label: '내 음식', to: ROUTES.MY_FOODS },
    { icon: iconReport, label: '리포트', to: ROUTES.VISIT_REPORTS },
  ]

  const criteriaSummary = [
    criteria.postMealHours ? `식후 ${criteria.postMealHours}시간` : '측정 시점 모름',
    criteria.targets.postMeal !== null ? `목표 ${criteria.targets.postMeal} 미만` : '목표 없음',
  ].join(' · ')

  return (
    <main className="relative pb-6">
      {/* 탭 화면 전체 회색 배경 */}
      <div
        aria-hidden
        className="bg-grey-100 fixed inset-y-0 left-1/2 -z-10 w-full max-w-107.5 -translate-x-1/2"
      />
      {/* 위쪽 노란 판 */}
      <div aria-hidden className="rounded-br-profile absolute inset-x-0 top-0 h-79 bg-yellow-300" />

      <header className="relative flex items-center justify-between px-5 pt-16.5">
        <h1 className="text-title-2 text-grey-900">마이</h1>
        <button
          type="button"
          aria-label="알림 설정"
          onClick={() => navigate(ROUTES.MY_NOTIFICATIONS)}
        >
          <img src={iconBell} alt="" width={24} height={24} />
        </button>
      </header>

      <button
        type="button"
        className="relative mt-5 flex items-center gap-1.5 pl-3.5 text-left"
        onClick={() => navigate(ROUTES.MY_PROFILE)}
      >
        <span aria-hidden className="relative size-31 shrink-0">
          <img src={profileBody} alt="" className="absolute top-2/15 left-7/40 max-w-none" />
          <img src={profileFace} alt="" width={124} height={124} className="absolute inset-0" />
        </span>
        <span className="flex flex-col items-start gap-1.5">
          <span className="text-grey-800 rounded-full bg-white/70 px-2 py-1 text-xs leading-snug font-bold">
            {CARE_MODE_LABEL[careMode]}
          </span>
          <span className="flex items-center gap-1">
            <span className="text-t3 text-grey-900">{name}님</span>
            <img src={iconChevronDark} alt="" width={16} height={16} />
          </span>
          <span className="text-grey-800 text-sm leading-snug font-medium">
            {age
              ? `임신 ${age.weeks}주 ${age.days}일 · 출산까지 ${age.daysToDue}일`
              : '출산예정일을 적어 주세요'}
          </span>
        </span>
      </button>

      <div className="relative mt-1 flex flex-col gap-3 px-4">
        <button
          type="button"
          className="rounded-banner flex items-center gap-3 bg-white py-4 pr-3.5 pl-4 text-left"
          onClick={() => navigate(ROUTES.VISIT)}
        >
          <span className="rounded-key flex size-11 shrink-0 items-center justify-center bg-yellow-50">
            <img src={iconHospital} alt="" width={24} height={24} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-snug">
            <span className="text-body-3 text-grey-500">다음 진료 · {MOCK_HOSPITAL.name}</span>
            <span className="text-grey-900 text-base font-bold">
              {visit.kind === 'unknown' ? '다음 진료일을 적어 주세요' : formatVisitAt(visit.at)}
            </span>
          </span>
          {visit.kind !== 'unknown' && (
            <span className="bg-grey-900 text-t7 text-grey-50 shrink-0 rounded-full px-2.5 py-1 font-bold">
              {visit.kind === 'today' ? '오늘' : `D-${visit.dDay}`}
            </span>
          )}
        </button>

        <nav aria-label="바로가기" className="rounded-banner flex bg-white px-2 py-4">
          {shortcuts.map(({ icon, label, to }) => (
            <button
              key={label}
              type="button"
              className="flex flex-1 flex-col items-center gap-2"
              onClick={() => navigate(to)}
            >
              <span className="bg-grey-50 flex size-12 items-center justify-center rounded-2xl">
                <img src={icon} alt="" width={24} height={24} />
              </span>
              <span className="text-body-3 text-grey-800">{label}</span>
            </button>
          ))}
        </nav>

        <MyMenuGroup
          title="내 관리"
          items={[
            { icon: iconMenuHospital, title: '다니는 병원', description: MOCK_HOSPITAL.name },
            {
              icon: iconMenuTarget,
              title: '병원 기준 · 관리 모드',
              description: criteriaSummary,
              onClick: () => navigate(ROUTES.MY_CRITERIA),
            },
            {
              icon: iconMenuFood,
              title: '내 음식',
              description: `직접 추가한 음식 ${myFoodCount}개`,
              onClick: () => navigate(ROUTES.MY_FOODS),
            },
            {
              icon: iconMenuCommunity,
              title: '커뮤니티 설정',
              description: '닉네임 · 내 글 · 안 보는 사람',
            },
          ]}
        />
        <MyMenuGroup
          title="앱 설정"
          items={[
            {
              icon: iconMenuBell,
              title: '알림',
              description: '측정 · 진료 · 잠금화면 문구',
              onClick: () => navigate(ROUTES.MY_NOTIFICATIONS),
            },
            { icon: iconMenuAi, title: 'AI 설정', description: '사진 찾기 · 당당이' },
            { icon: iconMenuData, title: '데이터 · 개인정보', description: '내 기록 PDF · 탈퇴' },
          ]}
        />
        <MyMenuGroup
          title="도움"
          items={[
            { icon: iconMenuHelp, title: '문의하기' },
            {
              icon: iconMenuTerms,
              title: '약관 · 의료기기 아님 고지',
              onClick: () => navigate(ROUTES.MY_TERMS),
            },
          ]}
        />

        <div className="text-t7 flex justify-between px-2 pt-1">
          {/* 로그인 연동 전이라 동작 없음 */}
          <button type="button" className="text-grey-500 font-medium underline">
            로그아웃
          </button>
          <span className="text-grey-400">당당 {APP_VERSION}</span>
        </div>
      </div>
    </main>
  )
}

export default MyPage
