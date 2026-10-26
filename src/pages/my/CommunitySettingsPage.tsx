import { useCallback, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import iconChevronMd from '@/assets/icons/chevron-md.svg'
import BottomSheet from '@/components/common/BottomSheet'
import SubPageHeader from '@/components/common/SubPageHeader'
import Switch from '@/components/common/Switch'
import Toast from '@/components/common/Toast'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useCommunityStore } from '@/stores/useCommunityStore'
import { ACTIVITY_LABEL, filterActivity, type ActivityType } from '@/utils/community'

const ACTIVITY_TYPES: ActivityType[] = ['posts', 'comments', 'liked']

type RowProps = {
  title: string
  description?: string
  right?: ReactNode
  onClick?: () => void
}

// 카드 안 한 줄. onClick이 있으면 오른쪽 화살표
function Row({ title, description, right, onClick }: RowProps) {
  const content = (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-snug">
        <span className="text-body-2 text-grey-900 tracking-normal">{title}</span>
        {description && <span className="text-grey-500 truncate text-xs">{description}</span>}
      </span>
      {right}
      {onClick && <img src={iconChevronMd} alt="" width={16} height={16} />}
    </>
  )
  const className = 'flex w-full items-center gap-3 py-3.5 pr-3.5 pl-4 text-left'
  return onClick ? (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  )
}

const cardClass = 'border-grey-200 divide-grey-100 rounded-2xl border divide-y'

// Figma M-14 커뮤니티 설정
function CommunitySettingsPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.MY)
  const nickname = useCommunityStore((state) => state.nickname)
  const showWeek = useCommunityStore((state) => state.showWeek)
  const setShowWeek = useCommunityStore((state) => state.setShowWeek)
  const posts = useCommunityStore((state) => state.posts)
  const likedPostIds = useCommunityStore((state) => state.likedPostIds)
  const blockedAuthors = useCommunityStore((state) => state.blockedAuthors)
  const unblockAuthor = useCommunityStore((state) => state.unblockAuthor)
  const [blockedOpen, setBlockedOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])
  const closeBlocked = useCallback(() => setBlockedOpen(false), [])

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-30">
      <SubPageHeader title="커뮤니티 설정" onBack={goBack} />

      <div className="mt-3 flex flex-col gap-4">
        <section className={cardClass}>
          <Row
            title="닉네임"
            description={nickname ?? '커뮤니티에 처음 들어가면 정해요'}
            onClick={() => navigate(nickname ? ROUTES.MY_NICKNAME : ROUTES.COMMUNITY)}
          />
          <Row
            title="임신 주수 배지 보이기"
            description="글 옆에 ‘임신 27주’로 보여요"
            right={
              <Switch checked={showWeek} label="임신 주수 배지 보이기" onChange={setShowWeek} />
            }
          />
        </section>

        <section className={cardClass}>
          {ACTIVITY_TYPES.map((type) => (
            <Row
              key={type}
              title={ACTIVITY_LABEL[type]}
              right={
                <span className="text-grey-500 text-sm leading-snug font-medium">
                  {filterActivity(posts, type, likedPostIds).length}개
                </span>
              }
              onClick={() => navigate(`${ROUTES.MY_COMMUNITY_ACTIVITY}?type=${type}`)}
            />
          ))}
        </section>

        <section className={cardClass}>
          <Row
            title="안 보는 사람"
            description={
              blockedAuthors.length > 0
                ? `${blockedAuthors.length}명 · 다시 보이게 할 수 있어요`
                : '아직 없어요'
            }
            onClick={() => setBlockedOpen(true)}
          />
          <Row title="커뮤니티 운영정책" onClick={() => navigate(ROUTES.COMMUNITY_POLICY)} />
        </section>
      </div>

      {blockedOpen && (
        <BottomSheet label="안 보는 사람" onClose={closeBlocked}>
          <h2 className="text-t4 text-grey-900">안 보는 사람</h2>
          {blockedAuthors.length === 0 ? (
            <p className="text-grey-500 text-sm leading-normal">
              글 더보기 › 이 사람 글 안 보기로 추가할 수 있어요.
            </p>
          ) : (
            <ul className="flex flex-col">
              {blockedAuthors.map((author) => (
                <li key={author.id} className="flex items-center justify-between py-3">
                  <span className="text-body-2 text-grey-900">{author.nickname}</span>
                  <button
                    type="button"
                    className="bg-grey-100 text-grey-800 rounded-full px-3.5 py-1.5 text-sm leading-snug font-bold"
                    onClick={() => {
                      unblockAuthor(author.id)
                      setToast(`${author.nickname}님 글이 다시 보여요`)
                    }}
                  >
                    다시 보기
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="bg-grey-100 text-grey-800 rounded-key py-4 text-base leading-snug font-bold"
            onClick={closeBlocked}
          >
            닫기
          </button>
        </BottomSheet>
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default CommunitySettingsPage
