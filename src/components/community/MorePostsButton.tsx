type MorePostsButtonProps = {
  loading: boolean
  onClick: () => void
}

// 글 목록 다음 장. Figma에 없어 기존 회색 버튼 모양
function MorePostsButton({ loading, onClick }: MorePostsButtonProps) {
  return (
    <div className="flex justify-center px-5 py-4">
      <button
        type="button"
        disabled={loading}
        className="text-t7 border-grey-200 text-grey-700 rounded-full border px-4 py-2 font-medium"
        onClick={onClick}
      >
        {loading ? '불러오는 중…' : '글 더 보기'}
      </button>
    </div>
  )
}

export default MorePostsButton
