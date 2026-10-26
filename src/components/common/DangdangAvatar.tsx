import avatarBody from '@/assets/images/dangdang/avatar-body.svg'
import avatarFace from '@/assets/images/dangdang/avatar-face.svg'
import sorryBody from '@/assets/images/dangdang/sorry-body.svg'
import sorryFace from '@/assets/images/dangdang/sorry-face.svg'

// 정면(64px, 빈 상태) · 미안해요(72px, 오류)
const VARIANTS = {
  front: { body: avatarBody, face: avatarFace, box: 'size-16', inner: 'size-19' },
  sorry: { body: sorryBody, face: sorryFace, box: 'size-18', inner: 'size-21.5' },
}

type DangdangAvatarProps = {
  variant: keyof typeof VARIANTS
}

// Figma 「당당이 / 아바타」. 캐릭터가 둥근 네모보다 살짝 크게 잘림
function DangdangAvatar({ variant }: DangdangAvatarProps) {
  const { body, face, box, inner } = VARIANTS[variant]
  return (
    <span
      aria-hidden
      className={`rounded-banner relative shrink-0 overflow-hidden bg-yellow-50 ${box}`}
    >
      <span className={`absolute -top-1 -left-1.5 ${inner}`}>
        <img src={body} alt="" className="absolute top-2/15 left-7/40 max-w-none" />
        <img src={face} alt="" className="absolute inset-0 max-w-none" />
      </span>
    </span>
  )
}

export default DangdangAvatar
