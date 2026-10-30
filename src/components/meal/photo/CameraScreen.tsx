import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import iconCloseWhite from '@/assets/icons/meal/close-white.svg'
import iconShutter from '@/assets/icons/meal/shutter.svg'

const PHOTO_TYPE = 'image/jpeg'
const PHOTO_QUALITY = 0.9

type CameraScreenProps = {
  title: string
  onCapture: (photo: Blob) => void
  onWriteName: () => void
  onClose: () => void
}

// Figma F-10 사진 찍기. 가이드 네모 · 앨범 · 사진은 서버에 저장 안 함
function CameraScreen({ title, onCapture, onWriteName, onClose }: CameraScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const albumRef = useRef<HTMLInputElement>(null)
  // 카메라가 없거나 권한을 거절하면 앨범만
  const [failed, setFailed] = useState(() => !navigator.mediaDevices?.getUserMedia)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) return
    let stream: MediaStream | null = null
    let cancelled = false
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((media) => {
        // 켜지는 사이 화면을 닫았으면 바로 끔
        if (cancelled) return media.getTracks().forEach((track) => track.stop())
        stream = media
        if (videoRef.current) videoRef.current.srcObject = media
        setReady(true)
      })
      .catch(() => setFailed(true))
    return () => {
      cancelled = true
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const capture = () => {
    const video = videoRef.current
    if (!video?.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    canvas.toBlob((photo) => photo && onCapture(photo), PHOTO_TYPE, PHOTO_QUALITY)
  }

  const pickAlbum = (event: ChangeEvent<HTMLInputElement>) => {
    const photo = event.target.files?.[0]
    if (photo) onCapture(photo)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="bg-camera fixed inset-0 z-60"
    >
      <div className="mx-auto flex h-full w-full max-w-107.5 flex-col pt-14">
        <header className="flex h-11 shrink-0 items-center justify-between px-4">
          <button type="button" aria-label="닫기" onClick={onClose}>
            <img src={iconCloseWhite} alt="" width={26} height={26} />
          </button>
          <h1 className="text-subtitle-1 text-white">{title}</h1>
          <span className="size-6.5" />
        </header>

        <div className="relative mt-2.5 flex-1 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 size-full object-cover"
          />
          {failed && (
            <p className="text-t6 absolute inset-x-5 top-1/2 -translate-y-1/2 text-center text-white">
              카메라를 열 수 없어요.
              <br />
              앨범에서 고르거나 이름으로 적어 주세요.
            </p>
          )}
          {!failed && (
            <>
              <span className="rounded-hero absolute top-1/2 left-1/2 size-75 -translate-1/2 border-2 border-dashed border-white/90" />
              <p className="absolute top-10 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3.5 py-2 text-sm leading-snug font-medium whitespace-nowrap text-white">
                음식만 네모 안에 담아 주세요
              </p>
            </>
          )}
        </div>

        <div className="flex h-42.5 shrink-0 flex-col items-center gap-5.5 pt-6">
          <div className="grid w-full grid-cols-3 items-center justify-items-center">
            <button
              type="button"
              className="rounded-tag text-caption size-12 border-2 border-white text-white"
              onClick={() => albumRef.current?.click()}
            >
              앨범
            </button>
            <button
              type="button"
              aria-label="사진 찍기"
              disabled={!ready}
              className="size-18 disabled:opacity-40"
              onClick={capture}
            >
              <img src={iconShutter} alt="" width={84} height={84} className="-m-1.5 max-w-none" />
            </button>
            <button
              type="button"
              className="text-body-3 leading-snug font-medium text-white"
              onClick={onWriteName}
            >
              이름으로
              <br />
              적기
            </button>
          </div>
          <p className="text-xs leading-snug text-white">당당 서버에는 저장하지 않아요</p>
        </div>
      </div>

      <input
        ref={albumRef}
        type="file"
        accept="image/*"
        aria-label="앨범에서 사진 고르기"
        className="hidden"
        onChange={pickAlbum}
      />
    </div>
  )
}

export default CameraScreen
