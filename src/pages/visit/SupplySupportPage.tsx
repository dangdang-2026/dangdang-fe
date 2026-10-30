import { useState } from 'react'
import iconSourceArrow from '@/assets/icons/chat/source-arrow.svg'
import iconCheckDark from '@/assets/icons/check-dark.svg'
import iconInfoLg from '@/assets/icons/info-lg.svg'
import iconInfoSm from '@/assets/icons/info-sm.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import Toast from '@/components/common/Toast'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { openExternal } from '@/utils/link'

const CHECKLIST = [
  '임신 중이면 인슐린을 맞지 않아도 지원돼요',
  '공단에 따로 등록 신청하지 않아도 돼요',
  '공단에 등록된 판매업소에서 등록된 제품을 사요',
  '처방전과 세금계산서를 챙겨 두세요',
]

const SOURCE = { label: '국민건강보험공단 요양비 안내', url: 'https://www.nhis.or.kr' }

// Figma C-15 소모품 건강보험 지원 안내. 공단 안내만 정리, 청구 대행 없음
function SupplySupportPage() {
  const goBack = useGoBack(ROUTES.VISIT_RESOURCES)
  // 챙겼는지 보는 용도라 저장 안 함
  const [checked, setChecked] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)

  const toggle = (item: string) =>
    setChecked((prev) => (prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]))

  const openSource = async () => {
    if (!(await openExternal(SOURCE.label, SOURCE.url))) setToast('링크를 확인하고 있어요')
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-10">
      <SubPageHeader title="소모품 지원 안내" onBack={goBack} />

      <div className="mt-3 flex flex-col gap-1.5">
        <h2 className="text-hero text-grey-900">검사지·채혈침, 건강보험 지원을 받을 수 있어요</h2>
        <p className="text-grey-600 text-sm leading-relaxed">
          국민건강보험공단 요양비 안내를 정리했어요. 신청은 공단·판매업소에서 해요.
        </p>
      </div>

      <div className="mt-4 flex flex-col items-start gap-4">
        <ul className="border-grey-200 w-full overflow-hidden rounded-2xl border">
          {CHECKLIST.map((item) => {
            const isChecked = checked.includes(item)
            return (
              <li key={item} className="border-grey-100 border-t first:border-t-0">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isChecked}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                  onClick={() => toggle(item)}
                >
                  {isChecked ? (
                    <span className="bg-primary flex size-5.5 shrink-0 items-center justify-center rounded-md">
                      <img src={iconCheckDark} alt="" width={14} height={14} />
                    </span>
                  ) : (
                    <span className="border-grey-300 size-5.5 shrink-0 rounded-md border-2" />
                  )}
                  <span className="text-t6 text-grey-900 flex-1 font-medium">{item}</span>
                </button>
              </li>
            )
          })}
        </ul>

        <button
          type="button"
          className="border-grey-200 flex items-center gap-1.5 rounded-lg border py-1.5 pr-2 pl-2.5"
          onClick={openSource}
        >
          <img src={iconInfoSm} alt="" width={14} height={14} />
          <span className="text-grey-600 text-xs leading-snug font-medium">
            출처 · {SOURCE.label}
          </span>
          <img src={iconSourceArrow} alt="" width={12} height={12} />
        </button>

        <div className="bg-grey-50 text-t7 text-grey-700 flex w-full items-start gap-2 rounded-xl px-3.5 py-3 leading-relaxed">
          <img src={iconInfoLg} alt="" width={18} height={18} className="shrink-0" />
          <p>
            연속혈당측정기는 인슐린을 맞는 임신부만 지원돼요(2024.11부터, 출산 예정일 뒤 15일까지).
            당당은 청구를 대신하지 않아요.
          </p>
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </main>
  )
}

export default SupplySupportPage
