import { useState } from 'react'
import iconCheckOn from '@/assets/icons/shop/check-on.svg'
import iconCheck from '@/assets/icons/shop/check.svg'
import iconOutbound from '@/assets/icons/shop/outbound.svg'

type OutboundNoticeProps = {
  sellerName: string | null
  pending: boolean
  // 7일 동안 보지 않기를 골랐는지 같이 넘김
  onGo: (hide: boolean) => void
  onClose: (hide: boolean) => void
}

// 구매하기 누른 뒤 판매처 이동 안내. 상세 화면 위를 옅게 덮음
function OutboundNotice({ sellerName, pending, onGo, onClose }: OutboundNoticeProps) {
  const [hide, setHide] = useState(false)
  const seller = sellerName ?? '판매처'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="outbound-title"
      className="via-outbound-glow/90 fixed inset-0 z-50 mx-auto flex max-w-107.5 flex-col bg-linear-to-b from-white/25 via-42% to-white to-62% px-5 pb-[max(--spacing(12.5),env(safe-area-inset-bottom))]"
    >
      <div className="flex-1" />
      <div className="flex flex-col items-center px-1 text-center">
        <span className="from-outbound-from to-outbound-to shadow-outbound flex size-24 items-center justify-center rounded-full bg-linear-to-br">
          <img src={iconOutbound} alt="" width={44} height={44} />
        </span>
        <h2 id="outbound-title" className="text-t2 text-grey-900 mt-8.5 break-keep">
          {seller}에서 구매를 이어갈까요?
        </h2>
        <p className="text-t6 text-grey-700 mt-3.5 break-keep">
          결제 · 배송 · 교환 · 환불은 {seller}에서 해요.
          <br />이 링크로 사면 당당이 판매처에서 수수료를 받아요.
          <br />
          가격은 같아요.
        </p>
      </div>
      <div className="mt-15 flex flex-col gap-2.5">
        <button
          type="button"
          disabled={pending}
          className="bg-primary text-subtitle-1 h-14.5 rounded-2xl text-white disabled:opacity-60"
          onClick={() => onGo(hide)}
        >
          {seller}로 이동하기
        </button>
        <button
          type="button"
          className="bg-grey-50 text-subtitle-1 text-grey-900 h-14.5 rounded-2xl"
          onClick={() => onClose(hide)}
        >
          더 둘러볼게요
        </button>
        <button
          type="button"
          aria-pressed={hide}
          className={`mx-auto flex items-center gap-1.5 text-sm ${hide ? 'text-grey-700' : 'text-grey-500'}`}
          onClick={() => setHide((value) => !value)}
        >
          <img src={hide ? iconCheckOn : iconCheck} alt="" width={18} height={18} />
          7일 동안 보지 않기
        </button>
      </div>
    </div>
  )
}

export default OutboundNotice
