import { useCallback, useState } from 'react'
import iconFileGrey from '@/assets/icons/file-grey.svg'
import BottomSheet from '@/components/common/BottomSheet'
import SubPageHeader from '@/components/common/SubPageHeader'
import VisitMenuRow from '@/components/visit/VisitMenuRow'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'

const TERMS = ['개인정보 처리방침', '이용약관', '민감정보 수집·이용 동의']

// Figma M-11 약관 · 고지. 약관 본문은 확정 전이라 안내만
function TermsPage() {
  const goBack = useGoBack(ROUTES.MY)
  const [opened, setOpened] = useState<string | null>(null)
  const closeSheet = useCallback(() => setOpened(null), [])

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-30">
      <SubPageHeader title="약관 · 고지" onBack={goBack} />

      <div className="mt-2.5 flex flex-col gap-3.5">
        <section className="bg-grey-50 rounded-banner flex flex-col gap-2 p-4.5">
          <h2 className="text-grey-900 text-base leading-normal font-bold">
            당당은 의료기기가 아니에요
          </h2>
          <p className="text-t7 text-grey-600">
            병원에서 받은 기준대로 기록하고 알림을 받도록 돕는 앱이에요. 진단·처방을 하거나
            혈당·식단을 판단하지 않아요. 몸 상태가 걱정되면 다니는 병원에 문의해 주세요.
          </p>
        </section>

        <ul className="bg-grey-50 rounded-banner flex flex-col px-4.5 py-2">
          {TERMS.map((title) => (
            <li key={title} className="py-2">
              <VisitMenuRow icon={iconFileGrey} title={title} onClick={() => setOpened(title)} />
            </li>
          ))}
        </ul>
      </div>

      {opened && (
        <BottomSheet label={opened} onClose={closeSheet}>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-t4 text-grey-900">{opened}</h2>
            <p className="text-t6 text-grey-700">정식 출시 전에 본문을 올려 둘게요.</p>
          </div>
          <button
            type="button"
            className="text-subtitle-1 bg-grey-100 text-grey-700 h-14 rounded-xl leading-none"
            onClick={closeSheet}
          >
            닫기
          </button>
        </BottomSheet>
      )}
    </main>
  )
}

export default TermsPage
