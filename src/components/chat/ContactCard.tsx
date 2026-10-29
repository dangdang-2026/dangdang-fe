import iconEdit from '@/assets/icons/chat/edit.svg'
import iconPhone from '@/assets/icons/chat/phone.svg'
import ChatActionButton from '@/components/chat/ChatActionButton'
import { MOCK_HOSPITAL } from '@/mocks/hospital'

type ContactCardProps = {
  memo: string
  onWriteMemo: () => void
}

// Figma Q-04 내가 적어 둔 연락 기준 + 외래 전화
function ContactCard({ memo, onWriteMemo }: ContactCardProps) {
  return (
    <section className="border-grey-200 flex w-full flex-col gap-2.5 rounded-2xl border bg-white p-4">
      <p className="text-grey-600 text-xs leading-snug font-medium">내가 적어 둔 연락 기준</p>
      <p className="text-t6 text-grey-800">
        {memo ? `“${memo}”` : '아직 적어 둔 연락 기준이 없어요.'}
      </p>
      <div className="flex flex-wrap gap-2">
        <ChatActionButton icon={iconPhone} href={`tel:${MOCK_HOSPITAL.phone}`}>
          {MOCK_HOSPITAL.name} {MOCK_HOSPITAL.department}에 전화
        </ChatActionButton>
        {!memo && (
          <ChatActionButton icon={iconEdit} onClick={onWriteMemo}>
            연락 기준 적기
          </ChatActionButton>
        )}
      </div>
    </section>
  )
}

export default ContactCard
