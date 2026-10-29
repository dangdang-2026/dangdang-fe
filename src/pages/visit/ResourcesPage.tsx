import { useNavigate } from 'react-router'
import iconArrowYellow from '@/assets/icons/resources/arrow-yellow.svg'
import iconCalendar from '@/assets/icons/resources/calendar.svg'
import iconDrop from '@/assets/icons/resources/drop.svg'
import iconShare from '@/assets/icons/resources/share.svg'
import iconUtensils from '@/assets/icons/resources/utensils.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import Toast from '@/components/common/Toast'
import AskQuestionRow from '@/components/resource/AskQuestionRow'
import QuestionSheet from '@/components/visit/QuestionSheet'
import { ROUTES, resourceSummaryPath } from '@/constants/routes'
import { useAskQuestion } from '@/hooks/useAskQuestion'
import { useGoBack } from '@/hooks/useGoBack'
import { RESOURCE_LINKS } from '@/mocks/resources'
import { openExternal } from '@/utils/link'

type ShortcutProps = {
  icon: string
  title: string
  onClick: () => void
}

// 노란 바로가기 한 줄
function Shortcut({ icon, title, onClick }: ShortcutProps) {
  return (
    <button
      type="button"
      className="rounded-key flex w-full items-center gap-2.5 bg-yellow-50 py-3.5 pr-3.5 pl-4 text-left"
      onClick={onClick}
    >
      <img src={icon} alt="" width={20} height={20} />
      <span className="text-grey-900 flex-1 text-sm leading-snug font-bold">{title}</span>
      <img src={iconArrowYellow} alt="" width={16} height={16} />
    </button>
  )
}

// Figma C-13 공식 자료 모음. 제목·출처·링크만, 해석 없음
function ResourcesPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.VISIT)
  const ask = useAskQuestion()

  const openLink = async (title: string, url: string | null) => {
    if (!(await openExternal(title, url))) ask.showToast('링크를 확인하고 있어요')
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-10">
      <SubPageHeader title="공식 자료" onBack={goBack} />

      <div className="mt-3 flex flex-col gap-1.5">
        <h2 className="text-t3 text-grey-900">믿을 수 있는 곳의 자료만 모았어요</h2>
        <p className="text-grey-600 text-sm leading-relaxed">
          궁금한 점은 물어볼 것에 적어 진료 때 물어보세요.
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-5">
        {/* 소모품 지원 안내 화면은 다음 작업에서 연결 */}
        <Shortcut
          icon={iconDrop}
          title="검사지·채혈침 건강보험 지원 안내"
          onClick={() => ask.showToast('지원 안내는 준비 중이에요')}
        />

        <section className="flex flex-col gap-2">
          <h3 className="text-t7 text-grey-600 leading-relaxed">
            한 장 요약 · 출처를 붙여 정리했어요
          </h3>
          <Shortcut
            icon={iconUtensils}
            title="탄수화물, 너무 줄이지 않기"
            onClick={() => navigate(resourceSummaryPath('carbs'))}
          />
          <Shortcut
            icon={iconCalendar}
            title="출산 후 첫 혈당 검사 — 지침마다 달라요"
            onClick={() => navigate(ROUTES.POSTPARTUM_GUIDE)}
          />
        </section>

        <ul className="border-grey-200 rounded-key overflow-hidden border">
          {RESOURCE_LINKS.map((link) => (
            <li key={link.id} className="border-grey-100 border-t first:border-t-0">
              <button
                type="button"
                className="flex w-full items-center gap-3 py-3.5 pr-3.5 pl-4 text-left"
                onClick={() => openLink(link.title, link.url)}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-snug">
                  <span className="text-grey-600 text-xs leading-snug font-medium">
                    {link.source}
                  </span>
                  <span className="text-t6 text-grey-900 leading-snug font-bold">{link.title}</span>
                </span>
                <img src={iconShare} alt="열기" width={18} height={18} />
              </button>
            </li>
          ))}
        </ul>

        <AskQuestionRow
          label="읽다가 궁금한 게 생겼어요 · 물어볼 것에 적기"
          onClick={ask.openSheet}
        />
      </div>

      {ask.open && (
        <QuestionSheet visitLabel={ask.visitLabel} onSave={ask.save} onClose={ask.closeSheet} />
      )}
      {ask.toast && <Toast message={ask.toast} onClose={ask.closeToast} />}
    </main>
  )
}

export default ResourcesPage
