import { Navigate, Routes, Route, useLocation } from 'react-router'
import AlertBanner from '@/components/common/AlertBanner'
import SplashScreen from '@/components/onboarding/SplashScreen'
import { ROUTES } from '@/constants/routes'
import { SPLASH_TOTAL_MS } from '@/constants/splashMotion'
import { getAnnouncementLabel, useAnnouncement, useOpenAnnouncement } from '@/hooks/useAnnouncement'
import { useMeasureReminder } from '@/hooks/useMeasureReminder'
import { useNotificationStream } from '@/hooks/useNotificationStream'
import { useSessionCheck } from '@/hooks/useSessionCheck'
import { useTimeout } from '@/hooks/useTimeout'
import OnboardingGate from '@/layouts/OnboardingGate'
import { useAuthStore } from '@/stores/useAuthStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { useSplashStore } from '@/stores/useSplashStore'
import TabLayout from '@/layouts/TabLayout'
import TodayPage from '@/pages/today/TodayPage'
import RecordsPage from '@/pages/records/RecordsPage'
import RecordCalendarPage from '@/pages/records/RecordCalendarPage'
import StatsPage from '@/pages/records/StatsPage'
import FoodHistoryPage from '@/pages/records/FoodHistoryPage'
import VisitPage from '@/pages/visit/VisitPage'
import ReportPage from '@/pages/visit/ReportPage'
import ReportsPage from '@/pages/visit/ReportsPage'
import CriteriaPage from '@/pages/visit/CriteriaPage'
import CriteriaHistoryPage from '@/pages/visit/CriteriaHistoryPage'
import VisitNotePage from '@/pages/visit/VisitNotePage'
import VisitNoteResultPage from '@/pages/visit/VisitNoteResultPage'
import ResourcesPage from '@/pages/visit/ResourcesPage'
import ResourceSummaryPage from '@/pages/visit/ResourceSummaryPage'
import SupplySupportPage from '@/pages/visit/SupplySupportPage'
import InboxPage from '@/pages/today/InboxPage'
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
import KakaoCallbackPage from '@/pages/auth/KakaoCallbackPage'
import PasswordResetPage from '@/pages/auth/PasswordResetPage'
import SignupPage from '@/pages/auth/SignupPage'
import AiSettingsPage from '@/pages/my/AiSettingsPage'
import HospitalSearchPage from '@/pages/my/HospitalSearchPage'
import HospitalsPage from '@/pages/my/HospitalsPage'
import CommunityActivityPage from '@/pages/my/CommunityActivityPage'
import CommunitySettingsPage from '@/pages/my/CommunitySettingsPage'
import DataPage from '@/pages/my/DataPage'
import MyCriteriaPage from '@/pages/my/MyCriteriaPage'
import MealGuidePage from '@/pages/my/MealGuidePage'
import MyFoodsPage from '@/pages/my/MyFoodsPage'
import MealSettingsPage from '@/pages/my/MealSettingsPage'
import MyPage from '@/pages/my/MyPage'
import NicknamePage from '@/pages/my/NicknamePage'
import NotificationsPage from '@/pages/my/NotificationsPage'
import PasswordChangePage from '@/pages/my/PasswordChangePage'
import ProfilePage from '@/pages/my/ProfilePage'
import TermsPage from '@/pages/my/TermsPage'
import DueDatePage from '@/pages/onboarding/DueDatePage'
import IntroPage from '@/pages/onboarding/IntroPage'
import HomeScreenPage from '@/pages/onboarding/HomeScreenPage'
import SlotsPage from '@/pages/onboarding/SlotsPage'
import TermsAgreePage from '@/pages/onboarding/TermsAgreePage'
import CheckGuidePage from '@/pages/postpartum/CheckGuidePage'
import CheckResultPage from '@/pages/postpartum/CheckResultPage'
import CheckSchedulePage from '@/pages/postpartum/CheckSchedulePage'
import DeliveryPage from '@/pages/postpartum/DeliveryPage'
import GraduationPage from '@/pages/postpartum/GraduationPage'
import TimingPage from '@/pages/onboarding/TimingPage'
import TourPage from '@/pages/onboarding/TourPage'
import NotFoundPage from '@/pages/NotFoundPage'
import PrivacyPolicyPage from '@/pages/legal/PrivacyPolicyPage'
import SensitiveConsentPage from '@/pages/legal/SensitiveConsentPage'
import MarketingConsentPage from '@/pages/legal/MarketingConsentPage'
import PrivacyVersionsPage from '@/pages/legal/PrivacyVersionsPage'
import BlockedPage from '@/pages/my/BlockedPage'
import ContactPage from '@/pages/my/ContactPage'
import ServiceTermsPage from '@/pages/legal/ServiceTermsPage'
import TransferNoticePage from '@/pages/legal/TransferNoticePage'

// 재실행 스플래시(당당 소식 카드)를 보여 주는 시간
const SPLASH_MS = 1600
// 첫 실행은 모션(4.4초) + 언덕 올라오기 + 페이드 아웃이 끝난 뒤 넘김
const FIRST_SPLASH_MS = SPLASH_TOTAL_MS

// 서버 알림 주소(/today?sheet=glucose&reminderId=)는 쿼리 그대로 오늘 탭으로
function TodayLinkRedirect() {
  const { search } = useLocation()
  return <Navigate to={{ pathname: ROUTES.TODAY, search }} replace />
}

function App() {
  // 앱이 열려 있는 동안 측정 알림 · 알림 누르면 혈당 입력
  useMeasureReminder()
  useSessionCheck()
  // 로그인한 동안 새 알림 실시간 받기
  useNotificationStream()
  const completed = useOnboardingStore((state) => state.completed)
  // 앱을 열 때 한 번. 설정을 마친 뒤엔 당당 소식 한 장과 함께
  const splash = useSplashStore((state) => state.visible)
  const hideSplash = useSplashStore((state) => state.hide)
  useTimeout(hideSplash, splash ? (completed ? SPLASH_MS : FIRST_SPLASH_MS) : null)
  // 설정을 마치고 로그인했으면 서버에 걸린 스플래시 카드
  const loggedIn = useAuthStore((state) => !!state.account)
  const announcement = useAnnouncement('SPLASH', splash && completed && loggedIn)
  const openAnnouncement = useOpenAnnouncement()

  return (
    <>
      {/* 앱 안 알림 배너. 화면 위에 떠서 어느 화면에서나 보임 */}
      <AlertBanner />
      {splash && (
        <SplashScreen
          revisit={completed}
          news={
            announcement
              ? {
                  label: getAnnouncementLabel(announcement),
                  title: announcement.title,
                  onOpen: () => {
                    hideSplash()
                    openAnnouncement(announcement)
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
        <Route path={ROUTES.KAKAO_CALLBACK} element={<KakaoCallbackPage />} />
        <Route path={ROUTES.TODAY_LINK} element={<TodayLinkRedirect />} />
        {/* 첫 진입 설정 */}
        <Route path={ROUTES.ONBOARDING} element={<IntroPage />} />
        <Route path={ROUTES.ONBOARDING_TERMS} element={<TermsAgreePage />} />
        <Route path={ROUTES.ONBOARDING_TIMING} element={<TimingPage />} />
        <Route path={ROUTES.ONBOARDING_SLOTS} element={<SlotsPage />} />
        <Route path={ROUTES.ONBOARDING_DUE_DATE} element={<DueDatePage />} />
        <Route path={ROUTES.ONBOARDING_HOME_SCREEN} element={<HomeScreenPage />} />
        {/* 약관 문서는 가입 전에도 봄 */}
        <Route path={ROUTES.LEGAL_PRIVACY} element={<PrivacyPolicyPage />} />
        <Route path={ROUTES.LEGAL_TERMS} element={<ServiceTermsPage />} />
        <Route path={ROUTES.LEGAL_SENSITIVE} element={<SensitiveConsentPage />} />
        <Route path={ROUTES.LEGAL_TRANSFER} element={<TransferNoticePage />} />
        <Route path={ROUTES.LEGAL_MARKETING} element={<MarketingConsentPage />} />
        <Route path={ROUTES.LEGAL_PRIVACY_VERSIONS} element={<PrivacyVersionsPage />} />
        <Route element={<OnboardingGate />}>
          <Route path={ROUTES.ONBOARDING_TOUR} element={<TourPage />} />
          <Route element={<TabLayout />}>
            <Route path={ROUTES.TODAY} element={<TodayPage />} />
            <Route path={ROUTES.VISIT} element={<VisitPage />} />
            <Route path={ROUTES.COMMUNITY} element={<CommunityPage />} />
            <Route path={ROUTES.COMMUNITY_BOARD} element={<BoardPage />} />
            <Route path={ROUTES.MY} element={<MyPage />} />
          </Route>
          {/* 탭 바 없는 화면 */}
          <Route path={ROUTES.RECORDS} element={<RecordsPage />} />
          <Route path={ROUTES.RECORDS_CALENDAR} element={<RecordCalendarPage />} />
          <Route path={ROUTES.RECORDS_STATS} element={<StatsPage />} />
          <Route path={ROUTES.RECORDS_FOOD_HISTORY} element={<FoodHistoryPage />} />
          <Route path={ROUTES.VISIT_REPORT} element={<ReportPage />} />
          <Route path={ROUTES.VISIT_REPORTS} element={<ReportsPage />} />
          <Route path={ROUTES.VISIT_CRITERIA} element={<CriteriaPage />} />
          <Route path={ROUTES.VISIT_CRITERIA_HISTORY} element={<CriteriaHistoryPage />} />
          <Route path={ROUTES.VISIT_NOTE} element={<VisitNotePage />} />
          <Route path={ROUTES.VISIT_NOTE_RESULT} element={<VisitNoteResultPage />} />
          <Route path={ROUTES.VISIT_RESOURCES} element={<ResourcesPage />} />
          <Route path={ROUTES.VISIT_RESOURCE_SUMMARY} element={<ResourceSummaryPage />} />
          <Route path={ROUTES.VISIT_SUPPLY_SUPPORT} element={<SupplySupportPage />} />
          <Route path={ROUTES.INBOX} element={<InboxPage />} />
          <Route path={ROUTES.MY_PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.MY_CRITERIA} element={<MyCriteriaPage />} />
          <Route path={ROUTES.MY_MEAL_GUIDE} element={<MealGuidePage />} />
          <Route path={ROUTES.MY_NOTIFICATIONS} element={<NotificationsPage />} />
          <Route path={ROUTES.MY_FOODS} element={<MyFoodsPage />} />
          <Route path={ROUTES.MY_MEAL_SETTINGS} element={<MealSettingsPage />} />
          <Route path={ROUTES.MY_TERMS} element={<TermsPage />} />
          <Route path={ROUTES.MY_PASSWORD} element={<PasswordChangePage />} />
          <Route path={ROUTES.MY_DATA} element={<DataPage />} />
          <Route path={ROUTES.MY_AI} element={<AiSettingsPage />} />
          <Route path={ROUTES.MY_HOSPITALS} element={<HospitalsPage />} />
          <Route path={ROUTES.MY_HOSPITAL_SEARCH} element={<HospitalSearchPage />} />
          <Route path={ROUTES.POSTPARTUM_DELIVERY} element={<DeliveryPage />} />
          <Route path={ROUTES.POSTPARTUM_CHECK} element={<CheckSchedulePage />} />
          <Route path={ROUTES.POSTPARTUM_CHECK_RESULT} element={<CheckResultPage />} />
          <Route path={ROUTES.POSTPARTUM_GUIDE} element={<CheckGuidePage />} />
          <Route path={ROUTES.POSTPARTUM_GRADUATION} element={<GraduationPage />} />
          <Route path={ROUTES.ASK} element={<ChatPage />} />
          <Route path={ROUTES.MY_COMMUNITY} element={<CommunitySettingsPage />} />
          <Route path={ROUTES.MY_NICKNAME} element={<NicknamePage />} />
          <Route path={ROUTES.MY_COMMUNITY_ACTIVITY} element={<CommunityActivityPage />} />
          <Route path={ROUTES.MY_BLOCKED} element={<BlockedPage />} />
          <Route path={ROUTES.MY_CONTACT} element={<ContactPage />} />
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
