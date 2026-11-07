import avatarBody from '@/assets/images/dangdang/avatar-body.svg'
import avatarFace from '@/assets/images/dangdang/avatar-face.svg'
import doneBody from '@/assets/images/dangdang/done-body.svg'
import doneFace from '@/assets/images/dangdang/done-face.svg'
import sorryBody from '@/assets/images/dangdang/sorry-body.svg'
import sorryFace from '@/assets/images/dangdang/sorry-face.svg'

// 정면(64px, 빈 상태) · 미안해요(72px, 오류) · 잘했어요(120px, 졸업)
const VARIANTS = {
  front: {
    body: avatarBody,
    face: avatarFace,
    box: 'rounded-banner size-16',
    inner: 'size-19 -top-1 -left-1.5',
  },
  sorry: {
    body: sorryBody,
    face: sorryFace,
    box: 'rounded-banner size-18',
    inner: 'size-21.5 -top-1 -left-1.5',
  },
  done: {
    body: doneBody,
    face: doneFace,
    // 졸업은 동그라미
    box: 'rounded-full size-30',
    inner: 'size-35.5 -top-1.5 -left-3',
  },
}

type DangdangAvatarProps = {
  variant: keyof typeof VARIANTS
}

// Figma 「당당이 / 아바타」. 캐릭터가 둥근 네모보다 살짝 크게 잘림
function DangdangAvatar({ variant }: DangdangAvatarProps) {
  const { body, face, box, inner } = VARIANTS[variant]
  return (
    <span aria-hidden className={`relative block shrink-0 overflow-hidden bg-yellow-50 ${box}`}>
      <span className={`absolute ${inner}`}>
        <img src={body} alt="" className="absolute top-2/15 left-7/40 max-w-none" />
        <img src={face} alt="" className="absolute inset-0 max-w-none" />
      </span>
    </span>
  )
}

export default DangdangAvatar
