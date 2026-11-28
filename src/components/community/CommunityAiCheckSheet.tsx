import { useState } from 'react'
import BottomSheet from '@/components/common/BottomSheet'
import CommunityAiNotice from '@/components/community/CommunityAiNotice'

type CommunityAiCheckSheetProps = {
  saving: boolean
  // 시트가 토스트를 가려서 저장 실패는 시트 안에
  error: string | null
  onConfirm: () => void
  onClose: () => void
}

// 프로필을 이 고지 전에 만든 사람에게 글쓰기 때 한 번. 안 눌러도 글은 써짐(그땐 AI 없이 규칙으로만 확인)
function CommunityAiCheckSheet({ saving, error, onConfirm, onClose }: CommunityAiCheckSheetProps) {
  const [checked, setChecked] = useState(false)

  return (
    <BottomSheet label="커뮤니티 AI 확인" onClose={onClose}>
      <h2 className="text-t4 text-grey-900">글을 올리기 전에 확인해 주세요</h2>
      <CommunityAiNotice checked={checked} onToggle={() => setChecked((value) => !value)} />
      {error && <p className="text-xs leading-snug font-medium text-red-500">{error}</p>}
      <button
        type="button"
        disabled={!checked || saving}
        className="bg-primary text-grey-900 disabled:bg-grey-100 disabled:text-grey-400 rounded-key py-4 text-base leading-snug font-bold"
        onClick={onConfirm}
      >
        확인하고 글쓰기
      </button>
    </BottomSheet>
  )
}

export default CommunityAiCheckSheet
