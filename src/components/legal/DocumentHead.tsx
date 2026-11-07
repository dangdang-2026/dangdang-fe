import iconVersionChev from '@/assets/icons/legal/version-chev.svg'

type DocumentHeadProps = {
  title: string
  // 시행일 줄. 없으면 설명 한 줄
  version?: string
  description?: string
  onVersions?: () => void
}

// Figma N-01·N-03 문서 머리: 제목 + 시행일·버전 또는 설명
function DocumentHead({ title, version, description, onVersions }: DocumentHeadProps) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-t3 text-grey-900">{title}</h2>
      {version && (
        <div className="flex items-center gap-2">
          <p className="text-grey-600 text-sm leading-snug">{version}</p>
          <button
            type="button"
            className="bg-grey-100 text-grey-700 flex items-center gap-0.5 rounded-md py-0.5 pr-1.5 pl-2 text-xs leading-snug font-medium"
            onClick={onVersions}
          >
            이전 버전
            <img src={iconVersionChev} alt="" width={12} height={12} />
          </button>
        </div>
      )}
      {description && <p className="text-grey-600 text-sm leading-relaxed">{description}</p>}
    </div>
  )
}

export default DocumentHead
