import { useState } from 'react'
import { Navigate } from 'react-router'
import SubPageHeader from '@/components/common/SubPageHeader'
import NicknameField from '@/components/community/NicknameField'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useCommunityStore } from '@/stores/useCommunityStore'
import { checkNickname } from '@/utils/nickname'

// Figma M-16 커뮤니티 설정 · 닉네임 바꾸기
function NicknamePage() {
  const goBack = useGoBack(ROUTES.MY_COMMUNITY)
  const nickname = useCommunityStore((state) => state.nickname)
  const setNickname = useCommunityStore((state) => state.setNickname)
  const [name, setName] = useState(nickname ?? '')

  // 닉네임은 커뮤니티 첫 화면에서 처음 정함
  if (!nickname) return <Navigate to={ROUTES.COMMUNITY} replace />

  const check = checkNickname(name, nickname)
  const unchanged = name.trim() === nickname

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-13 pb-[max(--spacing(9),env(safe-area-inset-bottom))]">
      <SubPageHeader title="닉네임 바꾸기" onBack={goBack} />

      <div className="mt-4 flex flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-t4 text-grey-900">커뮤니티에서 보이는 이름이에요</h2>
          <p className="text-grey-600 text-sm leading-normal">
            직접 적거나 새로 만들 수 있어요. 실명이나 연락처는 쓰지 마세요.
          </p>
        </div>
        <NicknameField value={name} check={check} onChange={setName} />
        <p className="text-grey-500 text-xs leading-snug">
          바꾸면 지금까지 쓴 글·댓글에도 새 이름으로 보여요.
        </p>
      </div>

      <button
        type="button"
        disabled={check !== 'ok' || unchanged}
        className="bg-primary text-grey-900 disabled:bg-grey-100 disabled:text-grey-400 rounded-key py-4 text-base leading-snug font-bold"
        onClick={() => {
          setNickname(name.trim())
          goBack()
        }}
      >
        저장
      </button>
    </main>
  )
}

export default NicknamePage
