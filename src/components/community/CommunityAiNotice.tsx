import CheckCircle from '@/components/onboarding/CheckCircle'

type CommunityAiNoticeProps = {
  checked: boolean
  onToggle: () => void
}

// Figma U-04 커뮤니티 AI 확인 고지 + 「확인했어요 (필수)」
function CommunityAiNotice({ checked, onToggle }: CommunityAiNoticeProps) {
  return (
    <>
      <p className="bg-grey-50 rounded-key text-grey-700 px-4 py-3.5 text-sm leading-normal">
        올리는 글은 위험한 내용이 있는지 AI가 확인해요.
        <br />
        이때 글이 해외(미국 OpenAI)로 보내져요.
      </p>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        className="text-body-2 text-grey-900 flex items-center gap-2.5 self-start"
        onClick={onToggle}
      >
        <CheckCircle checked={checked} />
        확인했어요 (필수)
      </button>
    </>
  )
}

export default CommunityAiNotice
