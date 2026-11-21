import iconArrowDown from '@/assets/icons/arrow-down.svg'
import iconChevronRight from '@/assets/icons/chevron-right.svg'
import iconPhoneCall from '@/assets/icons/glucose/phone-call.svg'
import iconPhoneDark from '@/assets/icons/glucose/phone-dark.svg'
import iconPhone from '@/assets/icons/phone.svg'
import { usePrimaryHospital } from '@/hooks/usePrimaryHospital'
import { useProfileStore } from '@/stores/useProfileStore'

type ContactCriteriaCardProps = {
  expanded: boolean
  onToggle: () => void
  onWriteMemo: () => void
}

const OUTLINE_BUTTON =
  'border-grey-200 text-grey-900 flex h-12 items-center justify-center gap-1 rounded-xl border bg-white px-4 text-base leading-none font-bold'

// Figma G-02 연락 기준 한 줄 · G-04/G-05 펼침(내 메모 + 외래 전화)
function ContactCriteriaCard({ expanded, onToggle, onWriteMemo }: ContactCriteriaCardProps) {
  const memo = useProfileStore((state) => state.contactMemo)
  const hospital = usePrimaryHospital()

  if (!expanded) {
    return (
      <button
        type="button"
        aria-expanded={false}
        className="bg-grey-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-left"
        onClick={onToggle}
      >
        <img src={iconPhone} alt="" width={18} height={18} />
        <span className="text-grey-700 flex-1 text-sm leading-normal font-medium">
          병원에서 들은 연락 기준
        </span>
        <img src={iconChevronRight} alt="" width={18} height={18} />
      </button>
    )
  }

  return (
    <section className="bg-grey-50 rounded-banner flex flex-col gap-2.5 p-4">
      <button
        type="button"
        aria-expanded
        className="flex items-center gap-2 text-left"
        onClick={onToggle}
      >
        <img src={iconPhoneDark} alt="" width={18} height={18} />
        <span className="text-t6 text-grey-800 flex-1 font-bold">내가 적어 둔 연락 기준</span>
        <img src={iconArrowDown} alt="" width={18} height={18} />
      </button>
      {memo ? (
        <>
          <p className="text-body-2 text-grey-900">“{memo}”</p>
          <p className="text-grey-700 text-xs leading-normal">진료 때 들은 내용 · 내가 적은 메모</p>
        </>
      ) : (
        <p className="text-body-2 text-grey-500">아직 적어 둔 연락 기준이 없어요.</p>
      )}
      {hospital.phone && (
        <a href={`tel:${hospital.phone}`} className={OUTLINE_BUTTON}>
          <img src={iconPhoneCall} alt="" width={20} height={20} />
          {hospital.name} 외래에 전화
        </a>
      )}
      {!memo && (
        <button type="button" className={OUTLINE_BUTTON} onClick={onWriteMemo}>
          연락 기준 적기
        </button>
      )}
    </section>
  )
}

export default ContactCriteriaCard
