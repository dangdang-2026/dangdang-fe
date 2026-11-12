import { useEffect, useState } from 'react'
import { getNicknameSuggestion } from '@/api/communityProfile'
import iconPromiseCheck from '@/assets/icons/community/promise-check.svg'
import BottomSheet from '@/components/common/BottomSheet'
import Switch from '@/components/common/Switch'
import NicknameField from '@/components/community/NicknameField'
import { useNicknameCheck } from '@/hooks/useNicknameCheck'
import { createNickname } from '@/utils/nickname'

const PROMISES = [
  '진단·처방·약 이야기는 병원에 물어봐요',
  '혈당 수치는 서로 비교하지 않아요',
  '광고·판매 글은 올리지 않아요',
]

type NicknameSheetProps = {
  // 서버에 저장하는 동안 버튼을 막음. 실패하면 시트에 보여 줄 안내를 돌려줌
  onSubmit: (nickname: string, showWeek: boolean) => Promise<string | null>
  onPolicy: () => void
  onClose: () => void
}

// Figma U-04 닉네임 정하기 · U-04b 이미 쓰는 이름
function NicknameSheet({ onSubmit, onPolicy, onClose }: NicknameSheetProps) {
  // 기기에서 만든 이름으로 먼저 보여 주고 서버 추천이 오면 바꿈
  const [initialName] = useState(() => createNickname())
  const [name, setName] = useState(initialName)
  const [showWeek, setShowWeek] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // 시트가 토스트를 가려서 저장 실패는 시트 안에 보여 줌
  const [submitError, setSubmitError] = useState<string | null>(null)
  const check = useNicknameCheck(name)

  // 아직 안 고쳤으면 서버가 고른 안 쓰는 이름으로. 못 받으면 기기 이름 그대로
  useEffect(() => {
    let active = true
    getNicknameSuggestion()
      .then((suggested) => {
        if (active) setName((current) => (current === initialName ? suggested : current))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [initialName])

  return (
    <BottomSheet label="닉네임" onClose={onClose}>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-t4 text-grey-900">커뮤니티에서 쓸 이름을 정해 주세요</h2>
        <p className="text-grey-600 text-sm leading-normal">
          실명이나 연락처는 쓰지 마세요. 나중에 바꿀 수 있어요.
        </p>
      </div>

      <NicknameField
        value={name}
        check={check}
        onChange={(next) => {
          setName(next)
          setSubmitError(null)
        }}
      />

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

      {submitError && (
        <p className="text-xs leading-snug font-medium text-red-500">{submitError}</p>
      )}
      <button
        type="button"
        disabled={check !== 'ok' || submitting}
        className="bg-primary text-grey-900 disabled:bg-grey-100 disabled:text-grey-400 rounded-key py-4 text-base leading-snug font-bold"
        onClick={() => {
          setSubmitting(true)
          setSubmitError(null)
          void onSubmit(name.trim(), showWeek)
            .then(setSubmitError)
            .finally(() => setSubmitting(false))
        }}
      >
        이 이름으로 시작하기
      </button>
    </BottomSheet>
  )
}

export default NicknameSheet
