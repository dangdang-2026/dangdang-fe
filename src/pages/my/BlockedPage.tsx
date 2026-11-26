import { useCallback, useState } from 'react'
import SubPageHeader from '@/components/common/SubPageHeader'
import Toast from '@/components/common/Toast'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import {
  blockOnServer,
  unblockOnServer,
  useCommunityStore,
  type BlockedAuthor,
} from '@/stores/useCommunityStore'
import { formatMonthDay } from '@/utils/date'

// Figma M-27 안 보는 사람 · M-27b 다시 보기 뒤 되돌리기 · M-27c 아무도 없음
function BlockedPage() {
  const goBack = useGoBack(ROUTES.MY_COMMUNITY)
  const blockedAuthors = useCommunityStore((state) => state.blockedAuthors)
  const [toast, setToast] = useState<{ message: string; undo?: BlockedAuthor } | null>(null)
  const closeToast = useCallback(() => setToast(null), [])
  // 다시 보기를 보내는 중인 사람. 두 번 눌러도 한 번만
  const [pendingId, setPendingId] = useState<string | null>(null)
  // 서버 목록처럼 최근에 안 보기 시작한 사람부터
  const sorted = [...(blockedAuthors as BlockedAuthor[])].sort((a, b) =>
    (b.blockedAt ?? '').localeCompare(a.blockedAt ?? ''),
  )

  const unblock = async (author: BlockedAuthor) => {
    if (pendingId) return
    setPendingId(author.id)
    try {
      await unblockOnServer(author)
      // 익명 줄은 그 글이 없어 다시 막을 수 없어 되돌리기 없음
      setToast({
        message: author.anonymous
          ? '익명 사용자 글이 다시 보여요'
          : `${author.nickname}님 글이 다시 보여요`,
        undo: author.anonymous ? undefined : author,
      })
    } catch {
      setToast({ message: '다시 보기를 하지 못했어요. 잠시 후 다시 시도해 주세요' })
    } finally {
      setPendingId(null)
    }
  }

  // 되돌리기: 다시 안 보기로
  const undo = async (author: BlockedAuthor) => {
    setToast(null)
    try {
      await blockOnServer(author)
    } catch {
      // 같은 자리에서 다시 되돌릴 수 있게
      setToast({ message: '되돌리지 못했어요. 잠시 후 다시 시도해 주세요', undo: author })
    }
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-30">
      <SubPageHeader title="안 보는 사람" onBack={goBack} />

      {blockedAuthors.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 pt-24 text-center">
          <p className="text-grey-900 text-lg leading-snug font-bold">안 보는 사람이 없어요</p>
          <p className="text-t7 text-grey-600">
            글 메뉴 › 이 사람 글 안 보기를 누르면 여기에 모여요.
          </p>
        </div>
      ) : (
        <>
          <p className="text-t7 text-grey-600 mt-3">
            안 보는 사람의 글과 댓글은 커뮤니티에서 보이지 않아요.
            <br />
            다시 보기를 누르면 바로 다시 보여요.
          </p>
          <ul className="divide-grey-100 mt-4 flex flex-col divide-y">
            {sorted.map((author) => (
              <li key={author.blockId ?? author.id} className="flex items-center gap-3 py-3.5">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-body-2 text-grey-900 truncate font-bold">
                    {author.nickname}
                  </span>
                  {author.blockedAt && (
                    <span className="text-grey-500 text-xs leading-normal">
                      {formatMonthDay(new Date(author.blockedAt))}부터 안 보고 있어요
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  className="bg-grey-100 text-grey-800 shrink-0 rounded-full px-3.5 py-1.5 text-sm leading-snug font-bold"
                  disabled={pendingId !== null}
                  onClick={() => void unblock(author)}
                >
                  다시 보기
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {toast && (
        <Toast
          message={toast.message}
          action={
            toast.undo
              ? { label: '되돌리기', onClick: () => void undo(toast.undo as BlockedAuthor) }
              : undefined
          }
          onClose={closeToast}
        />
      )}
    </main>
  )
}

export default BlockedPage
