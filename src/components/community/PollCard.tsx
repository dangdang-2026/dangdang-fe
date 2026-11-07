import iconRadio from '@/assets/icons/community/radio.svg'
import iconVoteCheck from '@/assets/icons/community/vote-check.svg'
import iconVoteSm from '@/assets/icons/community/vote-sm.svg'
import type { PollOption } from '@/types/community'
import { formatCount } from '@/utils/community'

type PollCardProps = {
  options: PollOption[]
  // 내가 고른 항목 id. 고르기 전엔 null
  votedId: string | null
  onVote: (optionId: string) => void
}

// Figma U-02 투표 참여 전 · U-09 참여 후 결과
function PollCard({ options, votedId, onVote }: PollCardProps) {
  const total = options.reduce((sum, option) => sum + option.votes, 0)
  const percent = (votes: number) => (total === 0 ? 0 : Math.round((votes / total) * 100))

  return (
    <section className="border-grey-200 flex flex-col gap-2.5 rounded-2xl border p-4">
      <h3 className="flex items-center gap-1.5 pb-0.5 leading-snug">
        <img src={iconVoteSm} alt="" width={20} height={20} />
        <span className="text-t6 text-grey-900 font-bold">투표</span>
        <span aria-hidden className="bg-grey-200 h-3 w-px" />
        <span className="text-t7 text-grey-500">
          {formatCount(total)}명 {votedId ? '참여 · 내가 고른 것' : '참여 중'}
        </span>
      </h3>
      <ul className="flex flex-col gap-2.5">
        {options.map((option) =>
          votedId ? (
            <li
              key={option.id}
              className="bg-grey-50 relative flex h-12.5 items-center justify-between overflow-hidden rounded-xl px-4"
            >
              {/* 표 수만큼 채우는 막대 */}
              <span
                aria-hidden
                className={`absolute inset-y-0 left-0 ${option.id === votedId ? 'bg-yellow-200' : 'bg-grey-100'}`}
                style={{ width: `${percent(option.votes)}%` }}
              />
              <span
                className={`text-t6 relative flex items-center gap-1.5 ${
                  option.id === votedId ? 'text-grey-900 font-bold' : 'text-grey-800'
                }`}
              >
                {option.id === votedId && <img src={iconVoteCheck} alt="" width={16} height={16} />}
                {option.label}
              </span>
              <span
                className={`text-t6 relative ${option.id === votedId ? 'text-grey-900 font-bold' : 'text-grey-600 font-medium'}`}
              >
                {percent(option.votes)}%
              </span>
            </li>
          ) : (
            <li key={option.id}>
              <button
                type="button"
                className="bg-grey-50 text-t6 text-grey-800 flex w-full items-center justify-between rounded-xl py-3.5 pr-3.5 pl-4 text-left"
                onClick={() => onVote(option.id)}
              >
                {option.label}
                <img src={iconRadio} alt="" width={22} height={22} />
              </button>
            </li>
          ),
        )}
      </ul>
    </section>
  )
}

export default PollCard
