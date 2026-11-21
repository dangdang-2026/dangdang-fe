import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { getErrorCode } from '@/api/axios'
import { organizeVisitNote } from '@/api/visitNote'
import iconSparkle from '@/assets/icons/sparkle.svg'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import SubPageHeader from '@/components/common/SubPageHeader'
import Toast from '@/components/common/Toast'
import { ROUTES } from '@/constants/routes'
import { useCriteria } from '@/hooks/useCriteria'
import { useGoBack } from '@/hooks/useGoBack'
import { saveChatConsent, useAiStore } from '@/stores/useAiStore'
import { saveVisitNote, useVisitStore } from '@/stores/useVisitStore'

const NOTE_MAX = 500

// 서버 정리 실패 이유별 안내. 국외 이전 동의 없음(AI_40301)은 동의 창으로
const ORGANIZE_ERROR: Record<string, string> = {
  AI_42901: '오늘은 정리를 다 썼어요. 내일 다시 해 주세요',
  VISIT_40002: '메모가 너무 길어요. 조금 줄여 주세요',
  VISIT_40901: '정리하는 동안 메모가 바뀌었어요. 다시 정리해 주세요',
  VISIT_50201: '정리하지 못했어요. 다시 해 볼까요?',
}
const ORGANIZE_FAILED = '메모를 정리하지 못했어요. 잠시 후 다시 시도해 주세요'

// Figma C-11 진료 후 메모 쓰기. AI는 3가지만 찾고 고르는 건 사용자
function VisitNotePage() {
  const navigate = useNavigate()
  const back = useGoBack(ROUTES.VISIT)
  const criteria = useCriteria()
  const note = useVisitStore((state) => state.note)
  const setNote = useVisitStore((state) => state.setNote)
  // 메모 글이 해외 AI를 거쳐서 당당이 기록 보기 동의를 같이 씀
  const aiAgreed = useAiStore((state) => !!state.chat?.agreed)
  const [consentOpen, setConsentOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])
  const [loading, setLoading] = useState(false)

  // 메모는 화면을 떠날 때 서버에 남김. 못 남기면 기기에 두고 다음 동기화 때 다시
  const keepNote = () => void saveVisitNote().catch(() => {})
  const goBack = () => {
    keepNote()
    back()
  }

  // 메모를 서버에 먼저 남기고(정리 API는 저장된 메모를 정리함) AI 정리 요청
  const organize = async () => {
    setLoading(true)
    try {
      await saveVisitNote()
      const { noteVisitId, noteId } = useVisitStore.getState()
      if (!noteVisitId || !noteId) throw new Error('저장된 진료 메모가 없음')
      const result = await organizeVisitNote(noteVisitId, noteId, criteria)
      navigate(ROUTES.VISIT_NOTE_RESULT, { state: { result } })
    } catch (error) {
      const code = getErrorCode(error)
      if (code === 'AI_40301') setConsentOpen(true)
      else setToast((code && ORGANIZE_ERROR[code]) || ORGANIZE_FAILED)
    } finally {
      setLoading(false)
    }
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

      {/* 적어 둔 메모가 있으면 포커스 없이도 노란 테두리 */}
      <textarea
        aria-label="진료 후 메모"
        value={note}
        maxLength={NOTE_MAX}
        placeholder="예: 오늘부터 식후 2시간에 재래요. 다음 진료는 11월 4일 오전."
        className={`focus:border-primary text-grey-900 placeholder:text-grey-400 rounded-key mt-5 h-55 resize-none border-2 px-4 py-3.5 text-base leading-relaxed outline-none ${
          note ? 'border-primary' : 'border-grey-200'
        }`}
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
          onClick={() => {
            keepNote()
            navigate(ROUTES.VISIT_CRITERIA)
          }}
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
            setConsentOpen(false)
            // 동의 저장 실패만 안내. 정리 실패는 기존처럼 정리 쪽에서 처리
            saveChatConsent(true).then(
              () => void organize(),
              () => setToast('동의를 저장하지 못했어요. 잠시 후 다시 시도해 주세요'),
            )
          }}
          onClose={closeConsent}
        />
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default VisitNotePage
