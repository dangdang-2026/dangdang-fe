import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { extractVisitNote } from '@/api/visitNote'
import iconSparkle from '@/assets/icons/sparkle.svg'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import SubPageHeader from '@/components/common/SubPageHeader'
import { ROUTES } from '@/constants/routes'
import { useCriteria } from '@/hooks/useCriteria'
import { useGoBack } from '@/hooks/useGoBack'
import { useAiStore } from '@/stores/useAiStore'
import { useVisitStore } from '@/stores/useVisitStore'

const NOTE_MAX = 500

// Figma C-11 진료 후 메모 쓰기. AI는 3가지만 찾고 고르는 건 사용자
function VisitNotePage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.VISIT)
  const criteria = useCriteria()
  const note = useVisitStore((state) => state.note)
  const setNote = useVisitStore((state) => state.setNote)
  // 메모 글이 해외 AI를 거쳐서 당당이 기록 보기 동의를 같이 씀
  const aiAgreed = useAiStore((state) => !!state.chat?.agreed)
  const setConsent = useAiStore((state) => state.setConsent)
  const [consentOpen, setConsentOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const organize = async () => {
    setLoading(true)
    const result = await extractVisitNote(note.trim(), criteria)
    setLoading(false)
    navigate(ROUTES.VISIT_NOTE_RESULT, { state: { result } })
  }

  const handleOrganize = () => {
    if (!aiAgreed) {
      setConsentOpen(true)
      return
    }
    void organize()
  }

  const closeConsent = useCallback(() => setConsentOpen(false), [])

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-13 pb-[max(--spacing(7.5),env(safe-area-inset-bottom))]">
      <SubPageHeader title="진료 후 메모" onBack={goBack} />

      <div className="mt-3 flex flex-col gap-1.5">
        <h2 className="text-t3 text-grey-900">진료에서 들은 말을 적어 주세요</h2>
        <p className="text-grey-600 text-sm leading-relaxed">
          키보드의 받아쓰기(마이크)로 말해도 돼요.
        </p>
      </div>

      <textarea
        aria-label="진료 후 메모"
        value={note}
        maxLength={NOTE_MAX}
        placeholder="예: 오늘부터 식후 2시간에 재래요. 다음 진료는 11월 4일 오전."
        className="border-grey-200 focus:border-primary text-grey-900 placeholder:text-grey-400 rounded-key mt-5 h-55 resize-none border-2 px-4 py-3.5 text-base leading-relaxed outline-none"
        onChange={(event) => setNote(event.target.value)}
      />

      <p className="bg-grey-50 text-t7 text-grey-700 mt-5 mb-8 flex items-start gap-2 rounded-xl px-3.5 py-3 leading-relaxed">
        <img src={iconSparkle} alt="" width={18} height={18} className="shrink-0" />
        AI를 켜 두면 측정 시점·목표 수치·다음 진료일 3가지만 찾아서 보여 드려요. 인슐린 이름·용량은
        정리하지 않아요.
      </p>

      <div className="mt-auto flex gap-2">
        <button
          type="button"
          className="bg-grey-100 text-grey-800 rounded-key px-4.5 py-4 text-base leading-snug font-bold"
          onClick={() => navigate(ROUTES.VISIT_CRITERIA)}
        >
          직접 바꾸기
        </button>
        <button
          type="button"
          disabled={!note.trim() || loading}
          className="bg-primary disabled:bg-grey-100 disabled:text-grey-400 rounded-key flex-1 py-4 text-base leading-snug font-bold text-white"
          onClick={handleOrganize}
        >
          {loading ? '정리하는 중…' : 'AI로 정리하기'}
        </button>
      </div>

      {consentOpen && (
        <ConfirmDialog
          title="AI로 정리할까요?"
          description="메모 글이 해외 AI 서비스를 거쳐요. 이름·연락처는 보내지 않고, 마이 › AI 설정에서 언제든 끌 수 있어요."
          confirmLabel="켜고 정리하기"
          onConfirm={() => {
            setConsent('chat', true)
            setConsentOpen(false)
            void organize()
          }}
          onClose={closeConsent}
        />
      )}
    </main>
  )
}

export default VisitNotePage
