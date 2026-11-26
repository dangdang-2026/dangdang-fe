import { useState } from 'react'
import { useNavigate } from 'react-router'
import { logoutFromServer } from '@/api/auth'
import { clearPendingKakao } from '@/utils/kakaoPending'
import { unsubscribePush } from '@/api/push'
import iconBell from '@/assets/icons/my/bell.svg'
import iconChevronDark from '@/assets/icons/my/chevron-dark.svg'
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
import iconChevron from '@/assets/icons/nav-next.svg'
import profileBody from '@/assets/images/dangdang/profile-body.svg'
import profileFace from '@/assets/images/dangdang/profile-face.svg'
import LogoutSheet from '@/components/my/LogoutSheet'
import MyMenuGroup from '@/components/my/MyMenuGroup'
import { ROUTES } from '@/constants/routes'
import { useCriteria } from '@/hooks/useCriteria'
import { useNow } from '@/hooks/useNow'
import { usePrimaryHospital } from '@/hooks/usePrimaryHospital'
import { useAiStore } from '@/stores/useAiStore'
import { useHospitalStore } from '@/stores/useHospitalStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useFoodStore } from '@/stores/useFoodStore'
import { useMealSettingsStore } from '@/stores/useMealSettingsStore'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { sendUnsentGlucose } from '@/stores/useGlucoseStore'
import { CARE_MODE_LABEL, useProfileStore } from '@/stores/useProfileStore'
import { useVisitStore } from '@/stores/useVisitStore'
import { leaveAfterLogout } from '@/utils/auth'
import { getPregnancyAge } from '@/utils/pregnancy'
import { getVisitStatus } from '@/utils/visit'
import { formatDuration } from '@/utils/criteria'

const APP_VERSION = '1.0.0'
// 로그아웃 전 못 보낸 식사를 보내며 기다리는 최대 시간
const SEND_UNSENT_MS = 3000

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 예: 10월 19일(월)
const formatVisitDay = (at: Date) =>
  `${at.getMonth() + 1}월 ${at.getDate()}일(${WEEKDAYS[at.getDay()]})`

// Figma M-01 마이 메인
function MyPage() {
  const hospital = usePrimaryHospital()
  const hospitals = useHospitalStore((state) => state.hospitals)
  const aiPhoto = useAiStore((state) => !!state.photo?.agreed)
  // 당당이는 해외로 보내기만 있으면 일반 질문을 쓸 수 있어 켜짐으로
  const aiChat = useAiStore((state) => !!state.overseas?.agreed)
  const navigate = useNavigate()
  const now = useNow()
  const { name, dueDate, careMode } = useProfileStore()
  const portionUnit = useMealSettingsStore((state) => state.portionUnit)
  const criteria = useCriteria()
  const myFoodCount = useFoodStore((state) => state.myFoods.length)
  const nextVisitAt = useVisitStore((state) => state.nextVisitAt)
  const hideOnLockScreen = useNotificationStore((state) => state.hideOnLockScreen)
  const logout = useAuthStore((state) => state.logout)
  const [logoutSheet, setLogoutSheet] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const age = getPregnancyAge(dueDate, now)
  const visit = getVisitStatus(nextVisitAt, now)

  // 예: 산부인과 · 내분비내과 2곳
  const departments = [...new Set(hospitals.map((item) => item.department))]
  const hospitalSummary =
    hospitals.length === 0 ? hospital.name : `${departments.join(' · ')} ${hospitals.length}곳`
  // 예: 사진 찾기 · 당당이 켜짐 / 모두 꺼짐
  const aiOn = [aiPhoto && '사진 찾기', aiChat && '당당이'].filter(Boolean)
  const aiSummary = aiOn.length > 0 ? `${aiOn.join(' · ')} 켜짐` : '사진 찾기 · 당당이 꺼짐'

  const criteriaSummary = [
    criteria.postMealHours ? `식후 ${formatDuration(criteria.postMealHours)}` : '측정 시점 모름',
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
      <div
        aria-hidden
        className="rounded-br-profile status-bar-bleed absolute inset-x-0 top-0 h-79 bg-yellow-300"
      />

      <header className="relative flex items-center justify-between px-5 pt-5.5">
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
            <span className="text-t3 text-grey-900">{name ? `${name}님` : '내 정보'}</span>
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
        {/* Figma M-01 진료 리포트. 다가오는 진료가 있으면 그 진료용 */}
        <button
          type="button"
          className="rounded-banner flex items-center gap-3 bg-white py-4 pr-3.5 pl-4 text-left"
          onClick={() => navigate(ROUTES.VISIT_REPORT)}
        >
          <span className="rounded-key flex size-11 shrink-0 items-center justify-center bg-yellow-50">
            <img src={iconReport} alt="" width={24} height={24} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-snug">
            <span className="text-t7 text-grey-600 font-medium">진료 리포트</span>
            <span className="text-grey-900 text-base font-bold">
              {visit.kind === 'unknown'
                ? '최근 2주 리포트 보기'
                : `${formatVisitDay(visit.at)} 진료용 리포트`}
            </span>
          </span>
          <img src={iconChevron} alt="" width={16} height={16} />
        </button>

        <MyMenuGroup
          title="내 관리"
          items={[
            {
              icon: iconMenuHospital,
              title: '다니는 병원',
              description: hospitalSummary,
              onClick: () => navigate(ROUTES.MY_HOSPITALS),
            },
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
              icon: iconMenuFood,
              title: '식사 기록 설정',
              description: `양 적는 방식 · ${portionUnit === 'GRAM' ? '그램' : '인분'}`,
              onClick: () => navigate(ROUTES.MY_MEAL_SETTINGS),
            },
          ]}
        />
        <MyMenuGroup
          title="앱 설정"
          items={[
            {
              icon: iconMenuBell,
              title: '알림',
              description: `잠금화면 문구 가리기 ${hideOnLockScreen ? '켜짐' : '꺼짐'}`,
              onClick: () => navigate(ROUTES.MY_NOTIFICATIONS),
            },
            {
              icon: iconMenuAi,
              title: 'AI 설정',
              description: aiSummary,
              onClick: () => navigate(ROUTES.MY_AI),
            },
            {
              icon: iconMenuCommunity,
              title: '커뮤니티 설정',
              description: '닉네임 · 내 글 · 안 보는 사람',
              onClick: () => navigate(ROUTES.MY_COMMUNITY),
            },
            {
              icon: iconMenuData,
              title: '데이터 · 개인정보',
              description: '내 기록 PDF · 탈퇴',
              onClick: () => navigate(ROUTES.MY_DATA),
            },
          ]}
        />
        <MyMenuGroup
          title="도움"
          items={[
            { icon: iconMenuHelp, title: '문의하기', onClick: () => navigate(ROUTES.MY_CONTACT) },
            {
              icon: iconMenuTerms,
              title: '약관 · 고지',
              onClick: () => navigate(ROUTES.MY_TERMS),
            },
          ]}
        />

        <div className="text-t7 flex justify-between px-2 pt-1">
          <button
            type="button"
            className="text-grey-500 font-medium underline"
            onClick={() => setLogoutSheet(true)}
          >
            로그아웃
          </button>
          <span className="text-grey-400">당당 {APP_VERSION}</span>
        </div>
      </div>

      {logoutSheet && (
        <LogoutSheet
          onLogout={async () => {
            if (loggingOut) return
            setLoggingOut(true)
            // 로그아웃한 계정 알림이 이 기기로 안 오게. 쿠키가 있을 때 먼저 끊음
            await unsubscribePush().catch(() => {})
            // 못 보낸 식사는 기기 기록을 지우기 전에 한 번 보냄. 오래 걸리면 기다리지 않음
            await Promise.race([
              sendUnsentGlucose().catch(() => {}),
              new Promise((resolve) => window.setTimeout(resolve, SEND_UNSENT_MS)),
            ])
            try {
              await logoutFromServer()
            } catch {
              // 서버 로그아웃이 실패해도 기기에선 로그인 풂
            }
            // 받아 둔 카카오 토큰은 다음 사람 계정에 연결되지 않게 지움
            clearPendingKakao()
            logout()
            // 이 계정 기록은 기기에서 지우고 처음 화면으로 새로 열기(다시 로그인하면 서버에서 받음)
            leaveAfterLogout()
          }}
          onClose={() => setLogoutSheet(false)}
        />
      )}
    </main>
  )
}

export default MyPage
