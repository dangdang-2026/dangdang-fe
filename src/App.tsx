import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router'
import SplashScreen from '@/components/onboarding/SplashScreen'
import { ROUTES, communityNewsPath } from '@/constants/routes'
import { useTimeout } from '@/hooks/useTimeout'
import OnboardingGate from '@/layouts/OnboardingGate'
import { MOCK_NEWS } from '@/mocks/news'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import TabLayout from '@/layouts/TabLayout'
import TodayPage from '@/pages/today/TodayPage'
import RecordsPage from '@/pages/records/RecordsPage'
import VisitPage from '@/pages/visit/VisitPage'
import ReportPage from '@/pages/visit/ReportPage'
import ReportsPage from '@/pages/visit/ReportsPage'
import CriteriaPage from '@/pages/visit/CriteriaPage'
import CriteriaHistoryPage from '@/pages/visit/CriteriaHistoryPage'
import BoardPage from '@/pages/community/BoardPage'
import CommunityPage from '@/pages/community/CommunityPage'
import PostDetailPage from '@/pages/community/PostDetailPage'
import NewsDetailPage from '@/pages/community/NewsDetailPage'
import NewsListPage from '@/pages/community/NewsListPage'
import PolicyPage from '@/pages/community/PolicyPage'
import WritePage from '@/pages/community/WritePage'
import CommunityActivityPage from '@/pages/my/CommunityActivityPage'
import CommunitySettingsPage from '@/pages/my/CommunitySettingsPage'
import MyCriteriaPage from '@/pages/my/MyCriteriaPage'
import MyFoodsPage from '@/pages/my/MyFoodsPage'
import MyPage from '@/pages/my/MyPage'
import NicknamePage from '@/pages/my/NicknamePage'
import NotificationsPage from '@/pages/my/NotificationsPage'
import ProfilePage from '@/pages/my/ProfilePage'
import TermsPage from '@/pages/my/TermsPage'
import DueDatePage from '@/pages/onboarding/DueDatePage'
import IntroPage from '@/pages/onboarding/IntroPage'
import SlotsPage from '@/pages/onboarding/SlotsPage'
import TermsAgreePage from '@/pages/onboarding/TermsAgreePage'
import TimingPage from '@/pages/onboarding/TimingPage'

// 앱을 열 때 스플래시를 보여 주는 시간
const SPLASH_MS = 1600

function App() {
  const navigate = useNavigate()
  const completed = useOnboardingStore((state) => state.completed)
  // 앱을 열 때 한 번. 설정을 마친 뒤엔 당당 소식 한 장과 함께
  const [splash, setSplash] = useState(true)
  useTimeout(() => setSplash(false), splash ? SPLASH_MS : null)
  const latestNews = MOCK_NEWS[0]

  return (
    <>
      {splash && (
        <SplashScreen
          news={
            completed
              ? {
                  title: latestNews.title,
                  onOpen: () => {
                    setSplash(false)
                    navigate(communityNewsPath(latestNews.id))
                  },
                }
              : undefined
          }
          onSkip={() => setSplash(false)}
        />
      )}
      <Routes>
        {/* 첫 진입 설정 */}
        <Route path={ROUTES.ONBOARDING} element={<IntroPage />} />
        <Route path={ROUTES.ONBOARDING_TERMS} element={<TermsAgreePage />} />
        <Route path={ROUTES.ONBOARDING_TIMING} element={<TimingPage />} />
        <Route path={ROUTES.ONBOARDING_SLOTS} element={<SlotsPage />} />
        <Route path={ROUTES.ONBOARDING_DUE_DATE} element={<DueDatePage />} />
        <Route element={<OnboardingGate />}>
          <Route element={<TabLayout />}>
            <Route path={ROUTES.TODAY} element={<TodayPage />} />
            <Route path={ROUTES.RECORDS} element={<RecordsPage />} />
            <Route path={ROUTES.VISIT} element={<VisitPage />} />
            <Route path={ROUTES.COMMUNITY} element={<CommunityPage />} />
            <Route path={ROUTES.COMMUNITY_BOARD} element={<BoardPage />} />
            <Route path={ROUTES.MY} element={<MyPage />} />
          </Route>
          {/* 탭 바 없는 화면 */}
          <Route path={ROUTES.VISIT_REPORT} element={<ReportPage />} />
          <Route path={ROUTES.VISIT_REPORTS} element={<ReportsPage />} />
          <Route path={ROUTES.VISIT_CRITERIA} element={<CriteriaPage />} />
          <Route path={ROUTES.VISIT_CRITERIA_HISTORY} element={<CriteriaHistoryPage />} />
          <Route path={ROUTES.MY_PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.MY_CRITERIA} element={<MyCriteriaPage />} />
          <Route path={ROUTES.MY_NOTIFICATIONS} element={<NotificationsPage />} />
          <Route path={ROUTES.MY_FOODS} element={<MyFoodsPage />} />
          <Route path={ROUTES.MY_TERMS} element={<TermsPage />} />
          <Route path={ROUTES.MY_COMMUNITY} element={<CommunitySettingsPage />} />
          <Route path={ROUTES.MY_NICKNAME} element={<NicknamePage />} />
          <Route path={ROUTES.MY_COMMUNITY_ACTIVITY} element={<CommunityActivityPage />} />
          <Route path={ROUTES.COMMUNITY_POST} element={<PostDetailPage />} />
          <Route path={ROUTES.COMMUNITY_WRITE} element={<WritePage />} />
          <Route path={ROUTES.COMMUNITY_POLICY} element={<PolicyPage />} />
          <Route path={ROUTES.COMMUNITY_NEWS} element={<NewsListPage />} />
          <Route path={ROUTES.COMMUNITY_NEWS_DETAIL} element={<NewsDetailPage />} />
          {/* TODO: 404 페이지(Figma 149:1129) 구현 후 교체 */}
          <Route path="*" element={<Navigate to={ROUTES.TODAY} replace />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
