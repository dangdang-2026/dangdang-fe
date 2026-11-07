import iconSparkle from '@/assets/icons/meal/sparkle-blue-xs.svg'
import photoPlaceholder from '@/assets/images/meal/photo-placeholder.svg'

type AiPhotoRowProps = {
  // 찍은 사진. 저장한 끼니를 고칠 땐 사진을 보관하지 않아 예시 그림
  photoUrl?: string
  // 찾는 중 · 찾음(확인 전) · 저장한 끼니의 후보
  status: 'finding' | 'found' | 'saved'
}

const COPY = {
  finding: {
    badge: 'AI 분석 중',
    lines: ['음식 후보를 찾고 있어요.', '기다리지 않고 이름으로 적어도 돼요.'],
  },
  found: {
    badge: 'AI 후보 · 확인 전',
    lines: ['사진에서 찾은 음식이에요.', '맞는 걸 골라 주세요.'],
  },
  saved: { badge: 'AI 후보', lines: ['사진에서 찾은 후보예요.', '고칠 음식을 골라 주세요.'] },
}

// Figma F-03 AI가 후보 찾는 중 · F-04 AI 후보(확인 전) · D-09 사진으로 적은 끼니 고치기
function AiPhotoRow({ photoUrl, status }: AiPhotoRowProps) {
  const { badge, lines } = COPY[status]
  return (
    <div role="status" className="flex items-center gap-3">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt="찍은 식사 사진"
          className="size-24 shrink-0 rounded-2xl object-cover"
        />
      ) : (
        <img src={photoPlaceholder} alt="" width={96} height={96} className="shrink-0" />
      )}
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
        <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs leading-normal font-bold text-blue-700">
          <img src={iconSparkle} alt="" width={12} height={12} />
          {badge}
        </span>
        <p className="text-grey-700 text-sm leading-normal font-medium">
          {lines[0]}
          <br />
          {lines[1]}
        </p>
      </div>
    </div>
  )
}

export default AiPhotoRow
