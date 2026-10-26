import { useCallback, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import iconCaret from '@/assets/icons/community/caret.svg'
import iconCheckCircle from '@/assets/icons/community/check-circle.svg'
import iconPhoto from '@/assets/icons/community/photo.svg'
import iconVote from '@/assets/icons/community/vote.svg'
import BottomSheet from '@/components/common/BottomSheet'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Toast from '@/components/common/Toast'
import RestrictedSheet from '@/components/community/RestrictedSheet'
import { BOARD_LABEL, BOARD_ORDER } from '@/constants/community'
import { ROUTES, communityPostPath } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useMyAuthor } from '@/hooks/useMyAuthor'
import { useCommunityStore } from '@/stores/useCommunityStore'
import type { BoardKey, PostDraft } from '@/types/community'

const COMING_SOON = '다음 업데이트에서 열려요'
const ANONYMOUS_NICKNAME = '익명 산모'
const TITLE_MAX_LENGTH = 40
const BODY_MAX_LENGTH = 2000

const BODY_PLACEHOLDER = [
  '진단·처방, 약 이름·용량, 혈당 수치 비교, 광고·판매 글은 가려지거나 커뮤니티 활동이 제한될 수 있어요.',
  '같은 길을 걷는 산모끼리, 서로 존중하는 따뜻한 당당 커뮤니티를 함께 만들어 가요.',
].join('\n\n')

const isBoardKey = (value: string | null): value is BoardKey =>
  BOARD_ORDER.includes(value as BoardKey)

// Figma U-03 글쓰기 · U-16 쓰다가 나가기 · U-17 이용 제한 중. ?edit=글id면 고치기
function WritePage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.COMMUNITY)
  const [params] = useSearchParams()
  const me = useMyAuthor()
  const editing = useCommunityStore((state) =>
    state.posts.find((post) => post.id === params.get('edit')),
  )
  const savedDraft = useCommunityStore((state) => state.draft)
  const restrictedUntil = useCommunityStore((state) => state.restrictedUntil)
  const addPost = useCommunityStore((state) => state.addPost)
  const editPost = useCommunityStore((state) => state.editPost)
  const saveDraft = useCommunityStore((state) => state.saveDraft)
  const clearDraft = useCommunityStore((state) => state.clearDraft)

  // 고치기 > 임시 저장 > 게시판 쿼리 순으로 처음 값
  const [draft, setDraft] = useState<PostDraft>(() => {
    if (editing) {
      const { board, title, body } = editing
      return { board, title, body, anonymous: editing.author.nickname === ANONYMOUS_NICKNAME }
    }
    if (savedDraft) return savedDraft
    const board = params.get('board')
    return { board: isBoardKey(board) ? board : null, title: '', body: '', anonymous: false }
  })
  const [boardOpen, setBoardOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [restrictedOpen, setRestrictedOpen] = useState(
    () => !!restrictedUntil && new Date(restrictedUntil) > new Date(),
  )
  const [toast, setToast] = useState<string | null>(() =>
    !editing && savedDraft ? '임시 저장한 글을 불러왔어요' : null,
  )
  const closeToast = useCallback(() => setToast(null), [])
  const closeBoard = useCallback(() => setBoardOpen(false), [])
  const closeLeaving = useCallback(() => setLeaving(false), [])
  const closeRestricted = useCallback(() => {
    setRestrictedOpen(false)
    goBack()
  }, [goBack])

  // 닉네임은 커뮤니티 첫 화면에서 정함
  if (!me) return <Navigate to={ROUTES.COMMUNITY} replace />

  const title = draft.title.trim()
  const body = draft.body.trim()
  const canSubmit = !!draft.board && !!title && !!body
  const dirty = editing
    ? title !== editing.title || body !== editing.body || draft.board !== editing.board
    : !!title || !!body

  const update = (changes: Partial<PostDraft>) => setDraft((prev) => ({ ...prev, ...changes }))

  const cancel = () => {
    if (dirty) setLeaving(true)
    else goBack()
  }

  const submit = () => {
    if (!draft.board || !canSubmit) return
    if (editing) {
      editPost(editing.id, { board: draft.board, title, body })
      // 글 보기에서 들어왔으니 돌아가면 고친 글이 보임
      goBack()
      return
    }
    const author = draft.anonymous ? { ...me, nickname: ANONYMOUS_NICKNAME } : me
    const id = addPost({ board: draft.board, title, body, author })
    navigate(communityPostPath(id), { replace: true })
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white pt-12.5 pb-18">
      <header className="border-grey-100 flex h-14 items-center justify-between border-b pr-4 pl-5">
        <button type="button" className="text-body-2 text-grey-600" onClick={cancel}>
          취소
        </button>
        <button
          type="button"
          className="text-subtitle-1 text-grey-900 flex items-center gap-0.5 tracking-normal"
          onClick={() => setBoardOpen(true)}
        >
          {draft.board ? BOARD_LABEL[draft.board] : '게시판 선택'}
          <img src={iconCaret} alt="" width={18} height={18} />
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          className="bg-primary text-grey-900 disabled:bg-grey-100 disabled:text-grey-400 rounded-full px-3.5 py-1.5 text-sm leading-snug font-bold"
          onClick={submit}
        >
          {editing ? '저장' : '등록'}
        </button>
      </header>

      <label className="border-grey-100 flex items-center gap-3 border-b px-5 py-4.5 text-base leading-snug">
        <span className="text-grey-900 shrink-0 font-bold">
          제목<span className="ml-0.5 text-red-500">*</span>
        </span>
        <input
          value={draft.title}
          maxLength={TITLE_MAX_LENGTH}
          placeholder="제목을 입력해 주세요"
          className="text-grey-900 placeholder:text-grey-400 min-w-0 flex-1 outline-none"
          onChange={(event) => update({ title: event.target.value })}
        />
      </label>

      <div className="flex flex-1 flex-col gap-5 p-5">
        <textarea
          value={draft.body}
          maxLength={BODY_MAX_LENGTH}
          aria-label="본문"
          placeholder={BODY_PLACEHOLDER}
          // 비어 있으면 안내 글 높이만큼만 차지해 운영정책 링크가 바로 아래 오게
          className={`text-t6 text-grey-900 placeholder:text-grey-400 resize-none leading-relaxed outline-none ${
            draft.body ? 'min-h-60 flex-1' : 'h-34'
          }`}
          onChange={(event) => update({ body: event.target.value })}
        />
        {!draft.body && (
          <button
            type="button"
            className="text-grey-600 self-start text-sm font-medium underline"
            onClick={() => navigate(ROUTES.COMMUNITY_POLICY)}
          >
            커뮤니티 운영정책 보기 ›
          </button>
        )}
      </div>

      <div className="border-grey-100 fixed bottom-0 left-1/2 flex h-18 w-full max-w-107.5 -translate-x-1/2 items-center justify-between border-t bg-white px-5 pb-[max(--spacing(4),env(safe-area-inset-bottom))]">
        {editing ? (
          <span />
        ) : (
          <button
            type="button"
            role="checkbox"
            aria-checked={draft.anonymous}
            className="text-grey-700 flex items-center gap-1.5 text-sm leading-snug font-medium"
            onClick={() => update({ anonymous: !draft.anonymous })}
          >
            <img
              src={iconCheckCircle}
              alt=""
              width={20}
              height={20}
              className={draft.anonymous ? '' : 'opacity-30 grayscale'}
            />
            익명으로 올리기
          </button>
        )}
        {/* 사진·투표는 다음 이슈 */}
        <div className="flex items-center gap-5">
          <button type="button" aria-label="사진 넣기" onClick={() => setToast(COMING_SOON)}>
            <img src={iconPhoto} alt="" width={26} height={26} />
          </button>
          <button type="button" aria-label="투표 만들기" onClick={() => setToast(COMING_SOON)}>
            <img src={iconVote} alt="" width={26} height={26} />
          </button>
        </div>
      </div>

      {boardOpen && (
        <BottomSheet label="게시판 선택" onClose={closeBoard}>
          <h2 className="text-t4 text-grey-900">어느 게시판에 올릴까요?</h2>
          <ul className="grid grid-cols-2 gap-2">
            {BOARD_ORDER.map((board) => (
              <li key={board}>
                <button
                  type="button"
                  aria-pressed={draft.board === board}
                  className={`w-full rounded-xl border-2 py-3 text-base leading-snug font-bold ${
                    draft.board === board
                      ? 'border-primary text-grey-900 bg-yellow-50'
                      : 'border-grey-100 text-grey-700'
                  }`}
                  onClick={() => {
                    update({ board })
                    setBoardOpen(false)
                  }}
                >
                  {BOARD_LABEL[board]}
                </button>
              </li>
            ))}
          </ul>
        </BottomSheet>
      )}

      {leaving &&
        (editing ? (
          <ConfirmDialog
            title="고친 내용을 버릴까요?"
            description="나가면 고친 내용은 저장되지 않아요."
            confirmLabel="나가기"
            cancel={{ label: '계속 고치기', onClick: closeLeaving }}
            onConfirm={goBack}
            onClose={closeLeaving}
          />
        ) : (
          <ConfirmDialog
            title="쓰던 글을 저장할까요?"
            description="임시 저장하면 다음에 글쓰기를 열 때 이어서 쓸 수 있어요."
            confirmLabel="임시 저장"
            cancel={{
              label: '저장 안 함',
              onClick: () => {
                clearDraft()
                goBack()
              },
            }}
            link={{ label: '계속 쓰기', onClick: closeLeaving }}
            onConfirm={() => {
              saveDraft(draft)
              goBack()
            }}
            onClose={closeLeaving}
          />
        ))}

      {restrictedOpen && restrictedUntil && (
        <RestrictedSheet
          until={new Date(restrictedUntil)}
          onPolicy={() => navigate(ROUTES.COMMUNITY_POLICY)}
          onAppeal={() => setToast(COMING_SOON)}
          onClose={closeRestricted}
        />
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default WritePage
