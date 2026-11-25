import { useState } from 'react'
import type { CommunityPostsOnLeave } from '@/api/auth'
import iconRadioOff from '@/assets/icons/my/radio-off.svg'
import iconRadioOn from '@/assets/icons/my/radio-on.svg'
import iconAlert from '@/assets/icons/auth/alert.svg'
import iconEyeOff from '@/assets/icons/auth/eye-off.svg'
import iconEye from '@/assets/icons/auth/eye.svg'
import iconLoading from '@/assets/icons/auth/loading.svg'
import AuthField from '@/components/auth/AuthField'
import BottomSheet from '@/components/common/BottomSheet'

const POST_OPTIONS: { value: CommunityPostsOnLeave; title: string; description: string }[] = [
  { value: 'delete', title: '모두 지우기', description: '탈퇴와 함께 바로 지워요' },
  {
    value: 'keep',
    title: '남기기',
    description: '작성자만 ‘탈퇴한 회원’으로 바꿔 남겨요.\n남긴 글은 나중에 지울 수 없어요.',
  },
]

const DANGER_BUTTON =
  'text-subtitle-1 relative h-14 rounded-xl bg-red-600 leading-none font-bold text-white'
const TEXT_BUTTON = 'text-body-2 text-grey-700 h-11 font-medium'

type WithdrawSheetProps = {
  loading: boolean
  // 비밀번호가 있는 계정은 지금 비밀번호, 아니면 카카오로 한 번 더 확인
  needsPassword: boolean
  // 서버가 비밀번호가 틀리다고 함
  wrongPassword: boolean
  onPasswordChange: () => void
  // 본인 확인 전에 내 기록 PDF 받기
  onSavePdf: () => void
  onWithdraw: (posts: CommunityPostsOnLeave, password: string | null) => void
  onClose: () => void
}

// Figma M-08 탈퇴 확인: 지워지는 것 · 글 처리 고르기 → 다음 단계에서 본인 확인(비밀번호 · 카카오)
// 본인 확인 단계는 Figma에 없어 비밀번호 변경 칸 모양
function WithdrawSheet({
  loading,
  needsPassword,
  wrongPassword,
  onPasswordChange,
  onSavePdf,
  onWithdraw,
  onClose,
}: WithdrawSheetProps) {
  const [step, setStep] = useState<'confirm' | 'verify'>('confirm')
  const [posts, setPosts] = useState<CommunityPostsOnLeave>('delete')
  const [password, setPassword] = useState('')
  const [shown, setShown] = useState(false)
  const [empty, setEmpty] = useState(false)
  const helperText = empty
    ? '비밀번호를 입력해 주세요'
    : wrongPassword
      ? '비밀번호가 맞지 않아요'
      : null

  const submit = () => {
    if (loading) return
    if (needsPassword && !password) {
      setEmpty(true)
      return
    }
    onWithdraw(posts, needsPassword ? password : null)
  }

  if (step === 'verify') {
    return (
      <BottomSheet label="탈퇴 본인 확인" onClose={onClose}>
        <h2 className="text-t4 text-grey-900">본인 확인을 해 주세요</h2>
        <p className="text-t6 text-grey-700">
          {needsPassword
            ? '지금 쓰는 비밀번호를 입력하면 탈퇴돼요.'
            : '카카오 로그인을 한 번 더 해서 확인하면 탈퇴돼요.'}
        </p>

        {needsPassword && (
          <AuthField
            label="비밀번호"
            inputId="withdraw-password"
            invalid={!!helperText}
            helper={helperText ? { icon: iconAlert, text: helperText, tone: 'error' } : null}
          >
            <input
              id="withdraw-password"
              type={shown ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="지금 쓰는 비밀번호"
              value={password}
              aria-invalid={!!helperText}
              aria-describedby={helperText ? 'withdraw-password-helper' : undefined}
              className={`text-grey-900 placeholder:text-grey-500 placeholder:text-input caret-primary min-w-0 flex-1 bg-transparent outline-none ${
                password && !shown ? 'text-t4 font-medium' : 'text-input'
              }`}
              onChange={(event) => {
                setPassword(event.target.value)
                setEmpty(false)
                onPasswordChange()
              }}
            />
            <button
              type="button"
              aria-label={shown ? '비밀번호 숨기기' : '비밀번호 보기'}
              aria-pressed={shown}
              className="shrink-0"
              onClick={() => setShown((value) => !value)}
            >
              <img src={shown ? iconEye : iconEyeOff} alt="" width={20} height={20} />
            </button>
          </AuthField>
        )}

        <button
          type="button"
          aria-busy={loading}
          className={`${DANGER_BUTTON} mt-4`}
          onClick={submit}
        >
          <span className={loading ? 'opacity-0' : undefined}>
            {needsPassword ? '탈퇴하기' : '카카오로 확인하고 탈퇴하기'}
          </span>
          {loading && (
            <img
              src={iconLoading}
              alt=""
              width={31}
              height={7}
              className="absolute top-1/2 left-1/2 -translate-1/2"
            />
          )}
        </button>
        <button
          type="button"
          disabled={loading}
          className={`${TEXT_BUTTON} -mt-2`}
          onClick={() => setStep('confirm')}
        >
          이전
        </button>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet label="탈퇴 확인" onClose={onClose}>
      <h2 className="text-t4 text-grey-900">정말 탈퇴할까요?</h2>

      <div className="bg-grey-50 rounded-key flex flex-col gap-2 p-4">
        <p className="flex items-center justify-between">
          <span className="text-grey-700 text-sm font-medium">지워지는 것</span>
          <span className="text-t6 text-grey-900 font-bold">모든 기록 · 리포트 · 계정</span>
        </p>
        <p className="text-t7 text-grey-700">남는 것: 접속 기록 3개월(법), 백업 7일 뒤 자동 삭제</p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-grey-800 mb-2 text-sm leading-snug font-bold">
          커뮤니티에 쓴 글과 댓글은 어떻게 할까요?
        </legend>
        {POST_OPTIONS.map((option) => {
          const selected = posts === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left ${
                selected ? 'border-yellow-400 bg-yellow-50' : 'border-grey-200 bg-grey-50'
              }`}
              onClick={() => setPosts(option.value)}
            >
              <img src={selected ? iconRadioOn : iconRadioOff} alt="" width={20} height={20} />
              <span className="flex flex-col gap-0.5 leading-snug">
                <span className="text-grey-900 text-sm font-bold">{option.title}</span>
                <span className="text-grey-700 text-xs whitespace-pre-line">
                  {option.description}
                </span>
              </span>
            </button>
          )
        })}
      </fieldset>

      <p className="text-t7 text-grey-700 leading-relaxed">
        다음 단계에서 본인 확인을 한 번 더 해요.
        <br />
        이메일 가입은 비밀번호로, 카카오 가입은 카카오로 확인해요.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <button type="button" className={DANGER_BUTTON} onClick={() => setStep('verify')}>
          탈퇴하기
        </button>
        <button
          type="button"
          className="text-subtitle-1 border-grey-200 text-grey-900 h-14 rounded-xl border bg-white leading-none font-bold"
          onClick={() => {
            onSavePdf()
            setStep('verify')
          }}
        >
          PDF 받고 탈퇴
        </button>
        <button type="button" className={TEXT_BUTTON} onClick={onClose}>
          취소
        </button>
      </div>
    </BottomSheet>
  )
}

export default WithdrawSheet
