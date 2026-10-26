import iconVoteClose from '@/assets/icons/community/vote-close.svg'
import iconVoteFill from '@/assets/icons/community/vote-fill.svg'
import iconVotePlus from '@/assets/icons/community/vote-plus.svg'
import { POLL_MAX_OPTIONS } from '@/constants/community'

const OPTION_MAX_LENGTH = 30

type PollEditorProps = {
  options: string[]
  onChange: (options: string[]) => void
  onRemove: () => void
}

// Figma U-03b 글쓰기 투표 만들기
function PollEditor({ options, onChange, onRemove }: PollEditorProps) {
  const update = (index: number, value: string) =>
    onChange(options.map((option, i) => (i === index ? value : option)))

  return (
    <section className="bg-grey-50 flex flex-col gap-2.5 rounded-2xl px-4 py-4.5">
      <div className="flex items-center justify-between pb-1">
        <h3 className="text-grey-900 flex items-center gap-1.5 text-base leading-snug font-bold">
          <img src={iconVoteFill} alt="" width={20} height={20} />
          투표
        </h3>
        <button type="button" aria-label="투표 빼기" onClick={onRemove}>
          <img src={iconVoteClose} alt="" width={20} height={20} />
        </button>
      </div>
      {options.map((option, index) => (
        <input
          // 항목은 순서로만 구분
          key={index}
          value={option}
          maxLength={OPTION_MAX_LENGTH}
          aria-label={`투표 항목 ${index + 1}`}
          placeholder="항목 입력"
          className="border-grey-200 focus:border-primary text-t6 text-grey-800 placeholder:text-grey-400 rounded-xl border bg-white px-4 py-3.5 outline-none"
          onChange={(event) => update(index, event.target.value)}
        />
      ))}
      {options.length < POLL_MAX_OPTIONS && (
        <button
          type="button"
          className="text-t6 text-grey-800 flex items-center gap-2 self-start pt-1 font-medium"
          onClick={() => onChange([...options, ''])}
        >
          <img src={iconVotePlus} alt="" width={20} height={20} />
          항목 추가
        </button>
      )}
    </section>
  )
}

export default PollEditor
