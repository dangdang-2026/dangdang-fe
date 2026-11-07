import { useState } from 'react'
import iconPromiseCheck from '@/assets/icons/community/promise-check.svg'
import BottomSheet from '@/components/common/BottomSheet'
import Switch from '@/components/common/Switch'
import NicknameField from '@/components/community/NicknameField'
import { checkNickname, createNickname } from '@/utils/nickname'

const PROMISES = [
  '진단·처방·약 이야기는 병원에 물어봐요',
  '혈당 수치는 서로 비교하지 않아요',
  '광고·판매 글은 올리지 않아요',
]

type NicknameSheetProps = {
  onSubmit: (nickname: string, showWeek: boolean) => void
  onPolicy: () => void
  onClose: () => void
}

// Figma U-04 닉네임 정하기 · U-04b 이미 쓰는 이름
function NicknameSheet({ onSubmit, onPolicy, onClose }: NicknameSheetProps) {
  const [name, setName] = useState(() => createNickname())
  const [showWeek, setShowWeek] = useState(false)
  const check = checkNickname(name)

  return (
    <BottomSheet label="닉네임" onClose={onClose}>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-t4 text-grey-900">커뮤니티에서 쓸 이름을 정해 주세요</h2>
        <p className="text-grey-600 text-sm leading-normal">
          실명이나 연락처는 쓰지 마세요. 나중에 바꿀 수 있어요.
        </p>
      </div>

      <NicknameField value={name} check={check} onChange={setName} />

      <div className="flex items-center justify-between py-1">
        <div className="flex flex-col gap-0.5 leading-snug">
          <p className="text-body-2 text-grey-900 tracking-normal">임신 주수 배지 보이기</p>
          <p className="text-t7 text-grey-500">글 옆에 ‘임신 27주’처럼 보여요</p>
        </div>
        <Switch checked={showWeek} label="임신 주수 배지 보이기" onChange={setShowWeek} />
      </div>

      <div className="bg-grey-50 rounded-key flex flex-col gap-2 px-4 py-3.5">
        {PROMISES.map((promise) => (
          <p key={promise} className="text-grey-800 flex items-start gap-2 text-sm leading-normal">
            <img src={iconPromiseCheck} alt="" width={18} height={18} className="mt-px" />
            {promise}
          </p>
        ))}
        <button
          type="button"
          className="text-t7 text-grey-600 self-start leading-snug font-medium underline"
          onClick={onPolicy}
        >
          운영정책 전체 보기 ›
        </button>
      </div>

      <button
        type="button"
        disabled={check !== 'ok'}
        className="bg-primary text-grey-900 disabled:bg-grey-100 disabled:text-grey-400 rounded-key py-4 text-base leading-snug font-bold"
        onClick={() => onSubmit(name.trim(), showWeek)}
      >
        이 이름으로 시작하기
      </button>
    </BottomSheet>
  )
}

export default NicknameSheet
