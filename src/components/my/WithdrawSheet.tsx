import { useState } from 'react'
import type { CommunityPostsOnLeave } from '@/api/auth'
import iconRadioOff from '@/assets/icons/my/radio-off.svg'
import iconRadioOn from '@/assets/icons/my/radio-on.svg'
import iconLoading from '@/assets/icons/auth/loading.svg'
import BottomSheet from '@/components/common/BottomSheet'

const POST_OPTIONS: { value: CommunityPostsOnLeave; title: string; description: string }[] = [
  { value: 'delete', title: '모두 지우기', description: '탈퇴와 함께 바로 지워요' },
  {
    value: 'keep',
    title: '남기기',
    description: '작성자를 ‘탈퇴한 회원’으로 바꾸고, 나중에 지울 수 없어요',
  },
]

type WithdrawSheetProps = {
  loading: boolean
  onWithdraw: (posts: CommunityPostsOnLeave) => void
  onClose: () => void
}

// Figma M-08 탈퇴 확인: 커뮤니티 글 처리 방식을 고르고 탈퇴
function WithdrawSheet({ loading, onWithdraw, onClose }: WithdrawSheetProps) {
  const [posts, setPosts] = useState<CommunityPostsOnLeave>('delete')

  return (
    <BottomSheet label="탈퇴 확인" onClose={onClose}>
      <h2 className="text-t4 text-grey-900">정말 탈퇴할까요?</h2>
      <p className="text-t6 text-grey-700">
        모든 기록이 지워지고 되돌릴 수 없어요.
        <br />
        먼저 내 기록 PDF를 받아 두세요.
      </p>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-grey-800 mb-2 text-sm leading-snug font-bold">
          커뮤니티에 쓴 글과 댓글은 어떻게 할까요?
        </legend>
        {POST_OPTIONS.map((option) => {
          const selected = posts === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left ${
                selected ? 'border-yellow-400 bg-yellow-50' : 'border-grey-200 bg-grey-50'
              }`}
              onClick={() => setPosts(option.value)}
            >
              <img src={selected ? iconRadioOn : iconRadioOff} alt="" width={20} height={20} />
              <span className="flex flex-col gap-0.5 leading-snug">
                <span className="text-grey-900 text-sm font-bold">{option.title}</span>
                <span className="text-grey-700 text-xs">{option.description}</span>
              </span>
            </button>
          )
        })}
      </fieldset>

      <button
        type="button"
        aria-busy={loading}
        className="text-subtitle-1 bg-primary relative mt-6 h-14 rounded-xl leading-none text-white"
        onClick={() => onWithdraw(posts)}
      >
        <span className={loading ? 'opacity-0' : undefined}>탈퇴하기</span>
        {loading && (
          <img
            src={iconLoading}
            alt=""
            width={31}
            height={7}
            className="absolute top-1/2 left-1/2 -translate-1/2"
          />
        )}
      </button>
      <button type="button" className="text-grey-600 py-1 text-sm leading-normal" onClick={onClose}>
        닫기
      </button>
    </BottomSheet>
  )
}

export default WithdrawSheet
