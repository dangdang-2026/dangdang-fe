import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { deleteAccount, type CommunityPostsOnLeave } from '@/api/auth'
import iconDownload from '@/assets/icons/download.svg'
import iconFileGrey from '@/assets/icons/file-grey.svg'
import iconCamera from '@/assets/icons/my/data-camera.svg'
import iconInfo from '@/assets/icons/my/data-info.svg'
import iconChevron from '@/assets/icons/nav-next.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import Toast from '@/components/common/Toast'
import WithdrawSheet from '@/components/my/WithdrawSheet'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useAuthStore } from '@/stores/useAuthStore'

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
  const email = useAuthStore((state) => state.account?.email ?? null)
  const [withdrawSheet, setWithdrawSheet] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])

  const openTerms = () => navigate(ROUTES.MY_TERMS)
  const rows: DataRow[] = [
    {
      icon: iconDownload,
      tone: 'yellow',
      title: '내 기록 PDF 받기',
      description: '전체 기간 · 이 기기에서 만들어요',
      // 전체 기간 PDF는 리포트 연동 후 연결
      onClick: () => setToast('내 기록 PDF는 준비 중이에요'),
    },
    { icon: iconFileGrey, tone: 'grey', title: '개인정보 처리방침', onClick: openTerms },
    { icon: iconFileGrey, tone: 'grey', title: '이용약관', onClick: openTerms },
    { icon: iconInfo, tone: 'grey', title: '의료기기 아님 고지', onClick: openTerms },
  ]

  const withdraw = async (posts: CommunityPostsOnLeave) => {
    if (!navigator.onLine) {
      setToast('인터넷 연결을 확인하고 다시 시도해 주세요')
      return
    }
    setWithdrawing(true)
    await deleteAccount(email, posts)
    // 탈퇴 즉시 기기에 남은 기록도 모두 지우고 처음 화면으로 새로 열기
    Object.keys(localStorage)
      .filter((key) => key.startsWith('dangdang-'))
      .forEach((key) => localStorage.removeItem(key))
    window.location.replace(ROUTES.ONBOARDING)
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-[max(--spacing(9),env(safe-area-inset-bottom))]">
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
          onWithdraw={withdraw}
          onClose={() => setWithdrawSheet(false)}
        />
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default DataPage
