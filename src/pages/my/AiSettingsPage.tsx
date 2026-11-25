import { useCallback, useState } from 'react'
import iconInfo from '@/assets/icons/info-grey.svg'
import iconCamera from '@/assets/icons/my/ai-camera.svg'
import iconSparkle from '@/assets/icons/my/ai-sparkle.svg'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import ConfirmSheet from '@/components/common/ConfirmSheet'
import SubPageHeader from '@/components/common/SubPageHeader'
import Switch from '@/components/common/Switch'
import Toast from '@/components/common/Toast'
import { ROUTES } from '@/constants/routes'
import { useNavigate } from 'react-router'
import { useGoBack } from '@/hooks/useGoBack'
import {
  saveChatConsent,
  savePhotoConsent,
  useAiStore,
  withdrawAiConsents,
  type AiConsent,
  type AiFeature,
} from '@/stores/useAiStore'
import { clearChatMessages } from '@/stores/useChatStore'

const FEATURES: { key: AiFeature; icon: string; title: string }[] = [
  { key: 'photo', icon: iconCamera, title: '사진으로 음식 후보 찾기' },
  { key: 'chat', icon: iconSparkle, title: '당당이에게 내 기록 보여 주기' },
]

// 끌 때 확인 시트. 당당이 기록 보기는 Figma에 없어 사진과 같은 틀로
const TURN_OFF: Record<AiFeature, { title: string; description: string }> = {
  photo: {
    title: '사진 음식 찾기를 끌까요?',
    description:
      '끄면 이 기능의 동의도 함께 철회돼요. 음식 이름은 직접 적을 수 있고, 이미 보낸 사진은 남기지 않아요.',
  },
  chat: {
    title: '당당이 기록 보기를 끌까요?',
    description:
      '끄면 이 기능의 동의도 함께 철회돼요. 당당이는 내 기록 없이 일반 질문에만 답하고, 이미 보낸 내용은 남기지 않아요.',
  },
}

// 예: 2026년 10월 14일
const formatKoreanDate = (iso: string) => {
  const date = new Date(iso)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
}

// 예: 2026.10.14
const formatDot = (iso: string) => {
  const date = new Date(iso)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

function formatConsent(consent: AiConsent) {
  if (!consent) return '아직 정하지 않았어요'
  return `${consent.agreed ? '동의함' : '동의 안 함'} · ${formatDot(consent.at)}`
}

// Figma M-06 AI 설정 · M-12 동의 철회 확인
function AiSettingsPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.MY)
  const photo = useAiStore((state) => state.photo)
  const chat = useAiStore((state) => state.chat)
  const [confirm, setConfirm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])
  const closeConfirm = useCallback(() => setConfirm(false), [])
  const [clearing, setClearing] = useState(false)
  const closeClearing = useCallback(() => setClearing(false), [])
  const consents = { photo, chat }
  // 끄기 전에 확인받는 기능
  const [turningOff, setTurningOff] = useState<AiFeature | null>(null)

  const saveFeature = (key: AiFeature, checked: boolean) => {
    const title = FEATURES.find((feature) => feature.key === key)?.title ?? ''
    const save = key === 'photo' ? savePhotoConsent : saveChatConsent
    save(checked)
      .then(() => setToast(`${title}를 ${checked ? '켰어요' : '껐어요'}`))
      .catch(() => setToast('설정을 저장하지 못했어요. 잠시 후 다시 시도해 주세요'))
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-13 pb-[max(--spacing(12.5),env(safe-area-inset-bottom))] break-keep">
      <SubPageHeader title="AI 설정" onBack={goBack} />

      <div className="mt-2.5 flex flex-col gap-3.5">
        {FEATURES.map(({ key, icon, title }) => (
          <div
            key={key}
            className="bg-grey-50 rounded-banner flex items-center gap-3 px-4.5 py-5.5"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
              <img src={icon} alt="" width={20} height={20} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-t6 text-grey-900 font-bold">{title}</span>
              <span className="text-t7 text-grey-700">{formatConsent(consents[key])}</span>
            </span>
            <Switch
              checked={!!consents[key]?.agreed}
              label={title}
              onChange={(checked) => {
                // 끄면 동의 철회라 한 번 더 확인
                if (checked) saveFeature(key, true)
                else setTurningOff(key)
              }}
            />
          </div>
        ))}
      </div>

      <p className="text-t7 text-grey-600 mt-4 flex items-start gap-2 px-1">
        <img src={iconInfo} alt="" width={16} height={16} className="mt-0.5 shrink-0" />
        AI는 음식 이름 후보와 내 기록을 찾아 보여 줄 뿐, 혈당이나 식단을 판단하지 않아요.
      </p>

      <section className="border-grey-200 rounded-banner mt-5 flex flex-col gap-2.5 border p-4.5">
        <h2 className="text-t6 text-grey-900 font-bold">어디서 처리하나요</h2>
        <p className="text-body-3 flex gap-3">
          <span className="text-grey-600">사진</span>
          <span className="text-grey-800">당당 서버에서만 처리해요</span>
        </p>
        <p className="text-body-3 flex gap-3">
          <span className="text-grey-600">당당이 질문</span>
          <span className="text-grey-800">해외 AI 서비스를 거쳐요</span>
        </p>
        <p className="text-t7 text-grey-600">이름·연락처는 보내지 않아요.</p>
        <button
          type="button"
          className="text-body-3 text-grey-700 self-start underline"
          onClick={() => navigate(ROUTES.LEGAL_TRANSFER)}
        >
          받는 곳·보관 기간 보기 ›
        </button>
      </section>

      <button
        type="button"
        className="text-body-3 text-grey-600 mt-5 self-center underline"
        onClick={() => setClearing(true)}
      >
        당당이 대화 모두 지우기
      </button>

      <button
        type="button"
        disabled={!photo?.agreed && !chat?.agreed}
        className="text-subtitle-1 border-grey-200 text-grey-900 disabled:text-grey-400 mt-auto h-14 rounded-xl border leading-none"
        onClick={() => setConfirm(true)}
      >
        동의 철회하기
      </button>

      {confirm && (
        <ConfirmDialog
          title="AI 사용 동의를 철회할까요?"
          description="사진 음식 찾기와 당당이 질문을 쓸 수 없어요. 기록·알림·리포트는 그대로 쓸 수 있고, 이미 보낸 정보는 남기지 않아요."
          confirmLabel="철회하기"
          danger
          onConfirm={() => {
            setConfirm(false)
            withdrawAiConsents()
              .then(() => setToast('AI 사용 동의를 철회했어요'))
              .catch(() => setToast('동의를 철회하지 못했어요. 잠시 후 다시 시도해 주세요'))
          }}
          onClose={closeConfirm}
        />
      )}
      {clearing && (
        <ConfirmDialog
          title="당당이 대화를 모두 지울까요?"
          description="물어본 말과 당당이 답이 바로 지워지고 되돌릴 수 없어요. 진료 탭에 추가한 물어볼 말은 그대로 남아요."
          confirmLabel="지우기"
          danger
          onConfirm={() => {
            setClearing(false)
            clearChatMessages()
              .then(() => setToast('당당이 대화를 모두 지웠어요'))
              .catch(() => setToast('대화를 지우지 못했어요. 잠시 후 다시 시도해 주세요'))
          }}
          onClose={closeClearing}
        />
      )}
      {turningOff && (
        <ConfirmSheet
          title={TURN_OFF[turningOff].title}
          summary={[
            {
              label: '기능',
              value: FEATURES.find((feature) => feature.key === turningOff)?.title ?? '',
            },
            ...(consents[turningOff]?.agreed
              ? [{ label: '동의한 날', value: formatKoreanDate(consents[turningOff].at) }]
              : []),
          ]}
          description={<p className="text-t7">{TURN_OFF[turningOff].description}</p>}
          confirmLabel="끄고 동의 철회하기"
          danger
          onConfirm={() => {
            saveFeature(turningOff, false)
            setTurningOff(null)
          }}
          onClose={() => setTurningOff(null)}
        />
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default AiSettingsPage
