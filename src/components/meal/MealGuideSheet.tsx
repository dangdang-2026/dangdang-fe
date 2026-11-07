import { useState } from 'react'
import { createPortal } from 'react-dom'
import iconEye from '@/assets/icons/meal-guide/eye.svg'
import iconClose from '@/assets/icons/meal/close-white.svg'
import BottomSheet from '@/components/common/BottomSheet'
import { useMealGuideStore } from '@/stores/useMealGuideStore'
import { parseDateKey } from '@/utils/date'

type MealGuideSheetProps = {
  onClose: () => void
}

// Figma F-20 식사 기록 중 내 식사 안내 보기. 식사 시트 위에 화면 기준으로 뜨게 body로
function MealGuideSheet({ onClose }: MealGuideSheetProps) {
  const guide = useMealGuideStore((state) => state.guide)
  const [photoOpen, setPhotoOpen] = useState(false)
  const receivedOn = parseDateKey(guide?.receivedOn ?? null)

  return createPortal(
    <>
      <BottomSheet label="내 식사 안내" onClose={onClose}>
        <div className="flex flex-col gap-1">
          <h2 className="text-t4 text-grey-900">내 식사 안내</h2>
          <p className="text-body-2 text-grey-700 font-normal">
            {guide && receivedOn
              ? `${receivedOn.getMonth() + 1}/${receivedOn.getDate()} ${guide.place ? `${guide.place} ` : ''}영양 상담에서 받은 내용이에요`
              : '아직 적어 둔 식사 안내가 없어요. 마이 › 병원 기준에서 적을 수 있어요.'}
          </p>
        </div>

        {guide?.meals && (
          <section className="flex flex-col gap-1.5">
            <h3 className="text-t7 text-grey-700">끼니별 안내</h3>
            <p className="text-body-2 text-grey-900 font-normal whitespace-pre-line">
              {guide.meals}
            </p>
          </section>
        )}
        {guide?.snacks && (
          <section className="flex flex-col gap-1.5">
            <h3 className="text-t7 text-grey-700">간식 안내</h3>
            <p className="text-body-2 text-grey-900 font-normal whitespace-pre-line">
              {guide.snacks}
            </p>
          </section>
        )}
        {guide?.photo && (
          <button
            type="button"
            className="text-body-3 text-grey-700 flex items-center gap-2 rounded-xl bg-white px-3.5 py-3"
            onClick={() => setPhotoOpen(true)}
          >
            <img src={iconEye} alt="" width={16} height={16} />
            받은 식단표 사진 보기
          </button>
        )}

        <button
          type="button"
          className="text-subtitle-1 bg-primary h-14 rounded-xl leading-none text-white"
          onClick={onClose}
        >
          식사 기록으로 돌아가기
        </button>
      </BottomSheet>

      {photoOpen && guide?.photo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="받은 식단표 사진"
          className="bg-camera fixed inset-0 z-70 flex items-center justify-center"
        >
          <img src={guide.photo} alt="받은 식단표 사진" className="max-h-full max-w-full" />
          <button
            type="button"
            aria-label="닫기"
            className="absolute top-[max(--spacing(4),env(safe-area-inset-top))] right-4 flex size-10 items-center justify-center"
            onClick={() => setPhotoOpen(false)}
          >
            <img src={iconClose} alt="" width={24} height={24} />
          </button>
        </div>
      )}
    </>,
    document.body,
  )
}

export default MealGuideSheet
