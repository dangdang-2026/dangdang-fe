import iconAdd from '@/assets/icons/chat/add.svg'
import iconAdded from '@/assets/icons/chat/added.svg'
import iconEdit from '@/assets/icons/chat/edit.svg'
import ChatActionButton from '@/components/chat/ChatActionButton'

type DraftCardProps = {
  text: string
  added: boolean
  onAdd: () => void
  onEdit: () => void
}

// Figma Q-04 물어볼 말 초안 · Q-05 추가됨
function DraftCard({ text, added, onAdd, onEdit }: DraftCardProps) {
  return (
    <section className="border-grey-200 flex w-full flex-col gap-2.5 rounded-2xl border bg-white p-4">
      <p className="text-grey-600 text-xs leading-snug font-medium">
        {added ? '물어볼 것 · 진료 탭에 추가됨' : '물어볼 말 · 초안'}
      </p>
      <p className="text-body-2 text-grey-900 leading-relaxed">{text}</p>
      {added ? (
        <p className="bg-grey-50 rounded-tag text-grey-700 flex items-center gap-1.5 self-start px-3.5 py-2.5 text-sm leading-snug font-bold">
          <img src={iconAdded} alt="" width={16} height={16} />
          추가했어요
        </p>
      ) : (
        <div className="flex gap-2">
          <ChatActionButton icon={iconAdd} primary onClick={onAdd}>
            물어볼 것에 추가
          </ChatActionButton>
          <ChatActionButton icon={iconEdit} onClick={onEdit}>
            고치기
          </ChatActionButton>
        </div>
      )}
    </section>
  )
}

export default DraftCard
