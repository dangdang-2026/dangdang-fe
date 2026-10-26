import { Routes, Route, Navigate } from 'react-router'
import { ROUTES } from '@/constants/routes'
import TabLayout from '@/layouts/TabLayout'
import TodayPage from '@/pages/today/TodayPage'
import RecordsPage from '@/pages/records/RecordsPage'
import VisitPage from '@/pages/visit/VisitPage'
import ReportPage from '@/pages/visit/ReportPage'
import ReportsPage from '@/pages/visit/ReportsPage'
import CriteriaPage from '@/pages/visit/CriteriaPage'
import CriteriaHistoryPage from '@/pages/visit/CriteriaHistoryPage'
import CommunityPage from '@/pages/community/CommunityPage'
import MyPage from '@/pages/my/MyPage'
import ProfilePage from '@/pages/my/ProfilePage'

function App() {
  return (
    <Routes>
      <Route element={<TabLayout />}>
        <Route path={ROUTES.TODAY} element={<TodayPage />} />
        <Route path={ROUTES.RECORDS} element={<RecordsPage />} />
        <Route path={ROUTES.VISIT} element={<VisitPage />} />
        <Route path={ROUTES.COMMUNITY} element={<CommunityPage />} />
        <Route path={ROUTES.MY} element={<MyPage />} />
      </Route>
      {/* 탭 바 없는 화면 */}
      <Route path={ROUTES.VISIT_REPORT} element={<ReportPage />} />
      <Route path={ROUTES.VISIT_REPORTS} element={<ReportsPage />} />
      <Route path={ROUTES.VISIT_CRITERIA} element={<CriteriaPage />} />
      <Route path={ROUTES.VISIT_CRITERIA_HISTORY} element={<CriteriaHistoryPage />} />
      <Route path={ROUTES.MY_PROFILE} element={<ProfilePage />} />
      {/* TODO: 404 페이지(Figma 149:1129) 구현 후 교체 */}
      <Route path="*" element={<Navigate to={ROUTES.TODAY} replace />} />
    </Routes>
  )
}

export default App
