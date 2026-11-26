import type { ReactNode } from 'react'
import iconPhoneCall from '@/assets/icons/glucose/phone-call.svg'
import { usePrimaryHospital } from '@/hooks/usePrimaryHospital'
import { useProfileStore } from '@/stores/useProfileStore'

type EmergencyBlockProps = {
  // 연락 기준 메모가 없을 때 「연락 기준 적어 두기」
  onWriteMemo: () => void
  // 메모 · 기본 안내 대신 보여 줄 말. 예: 혈당계 HI · LO
  message?: ReactNode
}

// Figma 당당/위급 안내. 낮은 값 등에서 늘 펼쳐 보이는 「지금 먼저 할 일」. 앱은 숫자를 정하지 않음
function EmergencyBlock({ onWriteMemo, message }: EmergencyBlockProps) {
  const memo = useProfileStore((state) => state.contactMemo)
  const hospital = usePrimaryHospital()

  return (
    <section
      aria-label="지금 먼저 할 일"
      className="bg-red-25 rounded-bubble flex flex-col border border-red-200 p-4.5"
    >
      <h3 className="text-base leading-none font-bold text-red-700">지금 먼저 할 일</h3>
      {message ? (
        <p className="text-grey-900 mt-2.5 text-base leading-normal font-medium whitespace-pre-line">
          {message}
        </p>
      ) : memo ? (
        <>
          <p className="text-subtitle-1 text-grey-900 mt-2.5 font-bold">“{memo}”</p>
          <p className="text-grey-600 mt-1.5 text-xs leading-normal font-semibold">
            병원에서 들은 연락 기준 · 내가 적은 메모
          </p>
        </>
      ) : (
        <>
          <p className="text-grey-900 mt-2.5 text-base leading-normal font-medium">
            병원에서 알려 준 대로 먼저 당을 드시고,
            <br />
            다시 재 주세요.
          </p>
          <button
            type="button"
            className="text-grey-700 mt-2 self-start text-sm leading-snug font-bold"
            onClick={onWriteMemo}
          >
            연락 기준 적어 두기 ›
          </button>
        </>
      )}
      {/* 병원 번호가 없으면 119가 주 버튼 */}
      <div className="mt-4 flex gap-2">
        {hospital.phone && (
          <a
            href={`tel:${hospital.phone}`}
            className="border-grey-200 text-grey-900 flex h-12 min-w-0 flex-1 items-center justify-center gap-1 rounded-xl border bg-white px-4 text-base leading-none font-bold"
          >
            <img src={iconPhoneCall} alt="" width={20} height={20} />
            <span className="truncate">{hospital.name} 전화</span>
          </a>
        )}
        <a
          href="tel:119"
          className={`flex h-12 items-center justify-center rounded-xl bg-red-600 px-4 text-base leading-none font-bold text-white ${
            hospital.phone ? 'w-22 shrink-0' : 'flex-1'
          }`}
        >
          {hospital.phone ? '119' : '119에 전화'}
        </a>
      </div>
      <p className="text-grey-700 mt-3 text-sm leading-normal font-medium">
        어지럽거나 정신이 흐려지면
        <br />
        바로 119에 연락해 주세요.
      </p>
    </section>
  )
}

export default EmergencyBlock
