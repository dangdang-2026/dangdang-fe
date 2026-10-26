import { useState } from 'react'
import iconAlert from '@/assets/icons/alert.svg'
import iconCheckGreen from '@/assets/icons/community/check-green.svg'
import iconPromiseCheck from '@/assets/icons/community/promise-check.svg'
import iconShuffle from '@/assets/icons/community/shuffle.svg'
import BottomSheet from '@/components/common/BottomSheet'
import Switch from '@/components/common/Switch'
import {
  NICKNAME_MAX,
  NICKNAME_MIN,
  checkNickname,
  createNickname,
  type NicknameCheck,
} from '@/utils/nickname'

const RULE = `${NICKNAME_MIN}~${NICKNAME_MAX}자, 한글·영문·숫자`

const ERROR_MESSAGE: Record<Exclude<NicknameCheck, 'ok'>, string> = {
  length: `${RULE}로 적어 주세요`,
  chars: `${RULE}만 쓸 수 있어요`,
  taken: '이미 누가 쓰고 있는 이름이에요. 다른 이름을 골라 주세요.',
}

const PROMISES = [
  '진단·처방·약 이야기는 병원에 물어봐요',
  '혈당 수치는 서로 비교하지 않아요',
  '광고·판매 글은 올리지 않아요',
]

type NicknameSheetProps = {
  // 처음 정하기(U-04)는 주수 배지·약속까지, 바꾸기(M-16)는 이름만
  mode: 'first' | 'change'
  current: string | null
  initialShowWeek?: boolean
  onSubmit: (nickname: string, showWeek: boolean) => void
  onPolicy?: () => void
  onClose: () => void
}

// Figma U-04 닉네임 정하기 · U-04b 이미 쓰는 이름 · M-16 닉네임 바꾸기
function NicknameSheet({
  mode,
  current,
  initialShowWeek = false,
  onSubmit,
  onPolicy,
  onClose,
}: NicknameSheetProps) {
  const [name, setName] = useState(() => current ?? createNickname())
  const [showWeek, setShowWeek] = useState(initialShowWeek)
  const check = checkNickname(name, current)
  const unchanged = mode === 'change' && name.trim() === current

  return (
    <BottomSheet label="닉네임" onClose={onClose}>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-t4 text-grey-900">
          {mode === 'first' ? '커뮤니티에서 쓸 이름을 정해 주세요' : '닉네임 바꾸기'}
        </h2>
        <p className="text-grey-600 text-sm leading-normal">
          실명이나 연락처는 쓰지 마세요. 나중에 바꿀 수 있어요.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <label
            className={`flex h-13 flex-1 items-center gap-2 rounded-xl border bg-white pr-3 pl-4 ${
              check === 'ok' ? 'border-grey-200' : 'border-red-500'
            }`}
          >
            <input
              value={name}
              maxLength={NICKNAME_MAX}
              aria-label="닉네임"
              aria-invalid={check !== 'ok'}
              className="text-grey-900 min-w-0 flex-1 text-base leading-snug font-medium outline-none"
              onChange={(event) => setName(event.target.value)}
            />
            <span className="text-grey-500 text-xs">
              {name.length}/{NICKNAME_MAX}
            </span>
          </label>
          <button
            type="button"
            aria-label="다른 이름 만들기"
            className="border-grey-200 bg-grey-100 flex size-13 shrink-0 items-center justify-center rounded-xl border"
            onClick={() => setName(createNickname(name))}
          >
            <img src={iconShuffle} alt="" width={20} height={20} />
          </button>
        </div>
        <p
          className={`flex items-start gap-1 text-xs leading-snug font-medium ${
            check === 'ok' ? 'text-grey-500' : 'text-red-500'
          }`}
        >
          <img
            src={check === 'ok' ? iconCheckGreen : iconAlert}
            alt=""
            width={14}
            height={14}
            className="mt-px"
          />
          {check === 'ok' ? `쓸 수 있는 이름이에요 · ${RULE}` : ERROR_MESSAGE[check]}
        </p>
      </div>

      {mode === 'first' && (
        <>
          <div className="flex items-center justify-between py-1">
            <div className="flex flex-col gap-0.5 leading-snug">
              <p className="text-body-2 text-grey-900 tracking-normal">임신 주수 배지 보이기</p>
              <p className="text-t7 text-grey-500">글 옆에 ‘임신 27주’처럼 보여요</p>
            </div>
            <Switch checked={showWeek} label="임신 주수 배지 보이기" onChange={setShowWeek} />
          </div>

          <div className="bg-grey-50 rounded-key flex flex-col gap-2 px-4 py-3.5">
            {PROMISES.map((promise) => (
              <p
                key={promise}
                className="text-grey-800 flex items-start gap-2 text-sm leading-normal"
              >
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
        </>
      )}

      <button
        type="button"
        disabled={check !== 'ok' || unchanged}
        className="bg-primary text-grey-900 disabled:bg-grey-100 disabled:text-grey-400 rounded-key py-4 text-base leading-snug font-bold"
        onClick={() => onSubmit(name.trim(), showWeek)}
      >
        {mode === 'first' ? '이 이름으로 시작하기' : '이 이름으로 바꾸기'}
      </button>
    </BottomSheet>
  )
}

export default NicknameSheet
