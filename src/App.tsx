import { Routes, Route, useNavigate } from 'react-router'
import SplashScreen from '@/components/onboarding/SplashScreen'
import { ROUTES, communityNewsPath } from '@/constants/routes'
import { SPLASH_TOTAL_MS } from '@/constants/splashMotion'
import { useTimeout } from '@/hooks/useTimeout'
import OnboardingGate from '@/layouts/OnboardingGate'
import { MOCK_NEWS } from '@/mocks/news'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useSplashStore } from '@/stores/useSplashStore'
import TabLayout from '@/layouts/TabLayout'
import TodayPage from '@/pages/today/TodayPage'
import RecordsPage from '@/pages/records/RecordsPage'
import RecordCalendarPage from '@/pages/records/RecordCalendarPage'
import StatsPage from '@/pages/records/StatsPage'
import VisitPage from '@/pages/visit/VisitPage'
import ReportPage from '@/pages/visit/ReportPage'
import ReportsPage from '@/pages/visit/ReportsPage'
import CriteriaPage from '@/pages/visit/CriteriaPage'
import CriteriaHistoryPage from '@/pages/visit/CriteriaHistoryPage'
import ChatPage from '@/pages/chat/ChatPage'
import BoardPage from '@/pages/community/BoardPage'
import CommunityPage from '@/pages/community/CommunityPage'
import PostDetailPage from '@/pages/community/PostDetailPage'
import NewsDetailPage from '@/pages/community/NewsDetailPage'
import NewsListPage from '@/pages/community/NewsListPage'
import PolicyPage from '@/pages/community/PolicyPage'
import WritePage from '@/pages/community/WritePage'
import LoginPage from '@/pages/auth/LoginPage'
import PasswordFindPage from '@/pages/auth/PasswordFindPage'
import PasswordResetPage from '@/pages/auth/PasswordResetPage'
import SignupPage from '@/pages/auth/SignupPage'
import AiSettingsPage from '@/pages/my/AiSettingsPage'
import CommunityActivityPage from '@/pages/my/CommunityActivityPage'
import CommunitySettingsPage from '@/pages/my/CommunitySettingsPage'
import DataPage from '@/pages/my/DataPage'
import MyCriteriaPage from '@/pages/my/MyCriteriaPage'
import MyFoodsPage from '@/pages/my/MyFoodsPage'
import MyPage from '@/pages/my/MyPage'
import NicknamePage from '@/pages/my/NicknamePage'
import NotificationsPage from '@/pages/my/NotificationsPage'
import PasswordChangePage from '@/pages/my/PasswordChangePage'
import ProfilePage from '@/pages/my/ProfilePage'
import TermsPage from '@/pages/my/TermsPage'
import DueDatePage from '@/pages/onboarding/DueDatePage'
import IntroPage from '@/pages/onboarding/IntroPage'
import SlotsPage from '@/pages/onboarding/SlotsPage'
import TermsAgreePage from '@/pages/onboarding/TermsAgreePage'
import CheckGuidePage from '@/pages/postpartum/CheckGuidePage'
import CheckResultPage from '@/pages/postpartum/CheckResultPage'
import CheckSchedulePage from '@/pages/postpartum/CheckSchedulePage'
import DeliveryPage from '@/pages/postpartum/DeliveryPage'
import GraduationPage from '@/pages/postpartum/GraduationPage'
import TimingPage from '@/pages/onboarding/TimingPage'
import NotFoundPage from '@/pages/NotFoundPage'
import PrivacyPolicyPage from '@/pages/legal/PrivacyPolicyPage'
import SensitiveConsentPage from '@/pages/legal/SensitiveConsentPage'
import ServiceTermsPage from '@/pages/legal/ServiceTermsPage'
import TransferNoticePage from '@/pages/legal/TransferNoticePage'

// 재실행 스플래시(당당 소식 카드)를 보여 주는 시간
const SPLASH_MS = 1600
// 첫 실행은 모션(4.4초) + 언덕 올라오기 + 페이드 아웃이 끝난 뒤 넘김
const FIRST_SPLASH_MS = SPLASH_TOTAL_MS

function App() {
  const navigate = useNavigate()
  const completed = useOnboardingStore((state) => state.completed)
  // 앱을 열 때 한 번. 설정을 마친 뒤엔 당당 소식 한 장과 함께
  const splash = useSplashStore((state) => state.visible)
  const hideSplash = useSplashStore((state) => state.hide)
  useTimeout(hideSplash, splash ? (completed ? SPLASH_MS : FIRST_SPLASH_MS) : null)
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
                    hideSplash()
                    navigate(communityNewsPath(latestNews.id))
                  },
                }
              : undefined
          }
          onSkip={() => hideSplash()}
        />
      )}
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.SIGNUP} element={<SignupPage />} />
        <Route path={ROUTES.PASSWORD_FIND} element={<PasswordFindPage />} />
        <Route path={ROUTES.PASSWORD_RESET} element={<PasswordResetPage />} />
        {/* 첫 진입 설정 */}
        <Route path={ROUTES.ONBOARDING} element={<IntroPage />} />
        <Route path={ROUTES.ONBOARDING_TERMS} element={<TermsAgreePage />} />
        <Route path={ROUTES.ONBOARDING_TIMING} element={<TimingPage />} />
        <Route path={ROUTES.ONBOARDING_SLOTS} element={<SlotsPage />} />
        <Route path={ROUTES.ONBOARDING_DUE_DATE} element={<DueDatePage />} />
        {/* 약관 문서는 가입 전에도 봄 */}
        <Route path={ROUTES.LEGAL_PRIVACY} element={<PrivacyPolicyPage />} />
        <Route path={ROUTES.LEGAL_TERMS} element={<ServiceTermsPage />} />
        <Route path={ROUTES.LEGAL_SENSITIVE} element={<SensitiveConsentPage />} />
        <Route path={ROUTES.LEGAL_TRANSFER} element={<TransferNoticePage />} />
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
          <Route path={ROUTES.RECORDS_CALENDAR} element={<RecordCalendarPage />} />
          <Route path={ROUTES.RECORDS_STATS} element={<StatsPage />} />
          <Route path={ROUTES.VISIT_REPORT} element={<ReportPage />} />
          <Route path={ROUTES.VISIT_REPORTS} element={<ReportsPage />} />
          <Route path={ROUTES.VISIT_CRITERIA} element={<CriteriaPage />} />
          <Route path={ROUTES.VISIT_CRITERIA_HISTORY} element={<CriteriaHistoryPage />} />
          <Route path={ROUTES.MY_PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.MY_CRITERIA} element={<MyCriteriaPage />} />
          <Route path={ROUTES.MY_NOTIFICATIONS} element={<NotificationsPage />} />
          <Route path={ROUTES.MY_FOODS} element={<MyFoodsPage />} />
          <Route path={ROUTES.MY_TERMS} element={<TermsPage />} />
          <Route path={ROUTES.MY_PASSWORD} element={<PasswordChangePage />} />
          <Route path={ROUTES.MY_DATA} element={<DataPage />} />
          <Route path={ROUTES.MY_AI} element={<AiSettingsPage />} />
          <Route path={ROUTES.POSTPARTUM_DELIVERY} element={<DeliveryPage />} />
          <Route path={ROUTES.POSTPARTUM_CHECK} element={<CheckSchedulePage />} />
          <Route path={ROUTES.POSTPARTUM_CHECK_RESULT} element={<CheckResultPage />} />
          <Route path={ROUTES.POSTPARTUM_GUIDE} element={<CheckGuidePage />} />
          <Route path={ROUTES.POSTPARTUM_GRADUATION} element={<GraduationPage />} />
          <Route path={ROUTES.ASK} element={<ChatPage />} />
          <Route path={ROUTES.MY_COMMUNITY} element={<CommunitySettingsPage />} />
          <Route path={ROUTES.MY_NICKNAME} element={<NicknamePage />} />
          <Route path={ROUTES.MY_COMMUNITY_ACTIVITY} element={<CommunityActivityPage />} />
          <Route path={ROUTES.COMMUNITY_POST} element={<PostDetailPage />} />
          <Route path={ROUTES.COMMUNITY_WRITE} element={<WritePage />} />
          <Route path={ROUTES.COMMUNITY_POLICY} element={<PolicyPage />} />
          <Route path={ROUTES.COMMUNITY_NEWS} element={<NewsListPage />} />
          <Route path={ROUTES.COMMUNITY_NEWS_DETAIL} element={<NewsDetailPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App
