import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { deleteAccount, startKakaoWithdraw, type CommunityPostsOnLeave } from '@/api/auth'
import { getErrorCode } from '@/api/axios'
import { getMe } from '@/api/me'
import iconDownload from '@/assets/icons/download.svg'
import iconFileGrey from '@/assets/icons/file-grey.svg'
import iconCamera from '@/assets/icons/my/data-camera.svg'
import iconInfo from '@/assets/icons/my/data-info.svg'
import iconChevron from '@/assets/icons/nav-next.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import Toast from '@/components/common/Toast'
import ReportDocument from '@/components/report/ReportDocument'
import WithdrawSheet from '@/components/my/WithdrawSheet'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useNow } from '@/hooks/useNow'
import { useReportContent } from '@/hooks/useReportContent'
import { useAuthStore } from '@/stores/useAuthStore'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { restartAfterWithdraw } from '@/utils/auth'
import { startOfDay } from '@/utils/date'

type DataRow = {
  icon: string
  // 기록 관련은 노랑, 문서는 회색 원
  tone: 'yellow' | 'grey'
  title: string
  description?: string
  onClick?: () => void
}

// Figma M-07 데이터 · 개인정보 · M-08 탈퇴 확인
function DataPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.MY)
  const location = useLocation()
  // 비밀번호가 있는 계정(이메일 가입)은 카카오로 로그인했어도 비밀번호로, 카카오 가입자는 카카오로 확인
  const loggedInByEmail = useAuthStore((state) => state.account?.method === 'email')
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)
  useEffect(() => {
    getMe()
      .then((me) => setHasPassword(me.loginMethods?.email ?? null))
      .catch(() => {})
  }, [])
  const needsPassword = hasPassword ?? loggedInByEmail
  const [withdrawSheet, setWithdrawSheet] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [wrongPassword, setWrongPassword] = useState(false)
  const clearWrongPassword = useCallback(() => setWrongPassword(false), [])
  // 카카오 확인을 다녀왔는데 탈퇴가 막히면 이유를 알림
  const [toast, setToast] = useState<string | null>(
    () => (location.state as { toast?: string } | null)?.toast ?? null,
  )
  const closeToast = useCallback(() => setToast(null), [])

  // 내 기록 PDF: 첫 기록(또는 설정을 마친 날)부터 오늘까지 전체 기간
  const now = useNow()
  const records = useGlucoseStore((state) => state.records)
  const meals = useGlucoseStore((state) => state.meals)
  const completedAt = useOnboardingStore((state) => state.completedAt)
  const firstAt = Math.min(
    now.getTime(),
    ...(completedAt ? [new Date(completedAt).getTime()] : []),
    ...records.map((record) => new Date(record.measuredAt).getTime()),
    ...meals.map((meal) => new Date(meal.startedAt).getTime()),
  )
  const recordReport = useReportContent({
    from: startOfDay(new Date(firstAt)),
    to: startOfDay(now),
  })

  // 인쇄 창이 닫히면 PDF 저장 안내
  useEffect(() => {
    const handleAfterPrint = () => setToast('PDF로 저장했다면 파일 앱에서 볼 수 있어요')
    window.addEventListener('afterprint', handleAfterPrint)
    return () => window.removeEventListener('afterprint', handleAfterPrint)
  }, [])

  // 서버 없이 브라우저 인쇄로 만듦(인쇄 창에서 PDF로 저장 선택)
  const printRecords = () => {
    if (records.length === 0 && meals.length === 0) {
      setToast('아직 PDF로 만들 기록이 없어요')
      return
    }
    window.print()
  }

  const openTerms = () => navigate(ROUTES.MY_TERMS)
  const rows: DataRow[] = [
    {
      icon: iconDownload,
      tone: 'yellow',
      title: '내 기록 PDF 받기',
      description: '전체 기간 · 이 기기에서 만들어요',
      onClick: printRecords,
    },
    {
      icon: iconFileGrey,
      tone: 'grey',
      title: '개인정보 처리방침',
      onClick: () => navigate(ROUTES.LEGAL_PRIVACY),
    },
    {
      icon: iconFileGrey,
      tone: 'grey',
      title: '이용약관',
      onClick: () => navigate(ROUTES.LEGAL_TERMS),
    },
    { icon: iconInfo, tone: 'grey', title: '의료기기 아님 고지', onClick: openTerms },
  ]

  const withdraw = async (posts: CommunityPostsOnLeave, password: string | null) => {
    if (!navigator.onLine) {
      setToast('인터넷 연결을 확인하고 다시 시도해 주세요')
      return
    }
    setWithdrawing(true)
    if (password === null) {
      startKakaoWithdraw(posts, ROUTES.MY_DATA)
      return
    }
    try {
      await deleteAccount({ password }, posts)
    } catch (error) {
      setWithdrawing(false)
      if (getErrorCode(error) === 'USER_40003') setWrongPassword(true)
      else setToast('탈퇴하지 못했어요. 잠시 후 다시 시도해 주세요')
      return
    }
    restartAfterWithdraw()
  }

  return (
    <>
      <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-[max(--spacing(9),env(safe-area-inset-bottom))] print:hidden">
        <SubPageHeader title="데이터 · 개인정보" onBack={goBack} />

        <ul className="rounded-banner bg-grey-50 mt-2.5 px-4.5 py-2">
          <li className="flex items-center gap-3 py-2.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-yellow-50">
              <img src={iconCamera} alt="" width={20} height={20} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-t6 text-grey-900 font-bold">식사 사진 보관</span>
              <span className="text-t7 text-grey-700">후보를 찾은 뒤 사진은 저장하지 않아요</span>
            </span>
            <span className="bg-grey-100 text-grey-700 shrink-0 rounded-full px-2.5 py-1 text-xs leading-normal font-bold">
              저장 안 함
            </span>
          </li>
          {rows.map((row) => (
            <li key={row.title}>
              <button
                type="button"
                className="flex w-full items-center gap-3 py-2.5 text-left"
                onClick={row.onClick}
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                    row.tone === 'yellow' ? 'bg-yellow-50' : 'bg-grey-100'
                  }`}
                >
                  <img src={row.icon} alt="" width={20} height={20} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-t6 text-grey-900 font-bold">{row.title}</span>
                  {row.description && (
                    <span className="text-t7 text-grey-700">{row.description}</span>
                  )}
                </span>
                <img src={iconChevron} alt="" width={18} height={18} />
              </button>
            </li>
          ))}
        </ul>

        <section className="rounded-banner mt-10 flex flex-col gap-2 border border-red-100 p-4.5">
          <h2 className="text-base leading-normal font-bold text-red-600">회원 탈퇴</h2>
          <p className="text-t7 text-grey-600">
            탈퇴하면 기록이 모두 지워지고 되돌릴 수 없어요.
            <br />
            먼저 내 기록 PDF를 받아 두세요.
          </p>
          <button
            type="button"
            className="border-grey-200 text-grey-900 h-12 rounded-xl border bg-white text-base leading-none font-bold"
            onClick={() => setWithdrawSheet(true)}
          >
            탈퇴하기
          </button>
        </section>

        {withdrawSheet && (
          <WithdrawSheet
            loading={withdrawing}
            needsPassword={needsPassword}
            wrongPassword={wrongPassword}
            onPasswordChange={clearWrongPassword}
            onSavePdf={printRecords}
            onWithdraw={withdraw}
            onClose={() => {
              setWithdrawSheet(false)
              setWrongPassword(false)
            }}
          />
        )}
        {toast && <Toast message={toast} onClose={closeToast} />}
      </main>

      {/* 인쇄할 때만 보이는 전체 기간 기록 */}
      <div className="hidden print:block">
        <ReportDocument
          report={recordReport.report}
          periodLabel={recordReport.periodLabel}
          title={recordReport.title}
          criteriaLines={recordReport.criteriaLines}
          createdAt={now}
        />
      </div>
    </>
  )
}

export default DataPage
