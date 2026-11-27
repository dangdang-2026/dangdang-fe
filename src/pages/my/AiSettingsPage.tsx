import { useCallback, useState } from 'react'
import iconCamera from '@/assets/icons/my/ai-camera.svg'
import iconOverseas from '@/assets/icons/my/ai-overseas.svg'
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
  saveChatConsents,
  savePhotoConsent,
  useAiStore,
  withdrawAiConsents,
  type AiConsent,
  type AiFeature,
} from '@/stores/useAiStore'
import { clearChatMessages } from '@/stores/useChatStore'
import { formatKoreanDate } from '@/utils/date'

const FEATURES: { key: AiFeature; icon: string; title: string }[] = [
  { key: 'photo', icon: iconCamera, title: '사진으로 음식 후보 찾기' },
  { key: 'chat', icon: iconSparkle, title: '당당이에게 내 기록 보여 주기' },
  { key: 'overseas', icon: iconOverseas, title: '해외로 보내기 (미국 OpenAI)' },
]

// 어디서 처리하나요 표
const PROCESSING = [
  { label: '사진', value: '당당 서버에서만 처리해요' },
  { label: '질문·메모', value: '미국 OpenAI를 거쳐요' },
  { label: '커뮤니티 글', value: '올릴 때 위험 내용 확인 · 미국 OpenAI' },
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
  overseas: {
    title: '해외로 보내기를 끌까요?',
    description:
      '끄면 이 기능의 동의도 함께 철회돼요. 당당이 질문과 진료 메모 정리를 쓸 수 없고, 이미 보낸 내용은 남기지 않아요.',
  },
}

// 예: 2026.10.14
const formatDot = (iso: string) => {
  const date = new Date(iso)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

function formatConsent(consent: AiConsent) {
  if (!consent) return '아직 정하지 않았어요'
  // 예전 문서에 동의한 것. 거절과 다르게
  if (consent.reconsent) return '바뀐 내용에 다시 동의해 주세요'
  return `${consent.agreed ? '동의함' : '동의 안 함'} · ${formatDot(consent.at)}`
}

// Figma M-06 AI 설정 · M-12 동의 철회 확인
function AiSettingsPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.MY)
  const photo = useAiStore((state) => state.photo)
  const chat = useAiStore((state) => state.chat)
  const overseas = useAiStore((state) => state.overseas)
  const [confirm, setConfirm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])
  const closeConfirm = useCallback(() => setConfirm(false), [])
  const [clearing, setClearing] = useState(false)
  const closeClearing = useCallback(() => setClearing(false), [])
  const consents = { photo, chat, overseas }
  // 끄기 전에 확인받는 기능
  const [turningOff, setTurningOff] = useState<AiFeature | null>(null)
  // 해외로 보내기가 꺼진 채 기록 보기를 켤 때, 같이 켤지 먼저 물어봄
  const [askOverseas, setAskOverseas] = useState(false)

  // withOverseas: 기록 보기를 켜며 해외로 보내기도 같이(물어보고 동의했을 때만)
  const saveFeature = (key: AiFeature, checked: boolean, withOverseas = false) => {
    const title = FEATURES.find((feature) => feature.key === key)?.title ?? ''
    const save =
      key === 'photo'
        ? savePhotoConsent(checked)
        : saveChatConsents(
            key === 'chat'
              ? { records: checked, ...(withOverseas ? { overseas: true } : {}) }
              : { overseas: checked },
          )
    save
      .then(() =>
        setToast(
          withOverseas
            ? '당당이 기록 보기와 해외로 보내기를 켰어요'
            : `${title}를 ${checked ? '켰어요' : '껐어요'}`,
        ),
      )
      .catch(() => setToast('설정을 저장하지 못했어요. 잠시 후 다시 시도해 주세요'))
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-2 pb-[max(--spacing(12.5),env(safe-area-inset-bottom))] break-keep">
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
                if (!checked) setTurningOff(key)
                // 기록 보기만으론 당당이가 답할 수 없어 해외로 보내기도 켤지 물어봄
                else if (key === 'chat' && !overseas?.agreed) setAskOverseas(true)
                else saveFeature(key, true)
              }}
            />
          </div>
        ))}
      </div>

      <p className="text-grey-600 mt-4 px-1 text-xs leading-normal">
        기능마다 따로 켜고 끌 수 있어요.
        <br />
        끄면 그 기능의 동의도 함께 철회돼요.
        <br />
        해외로 보내기를 끄면 당당이 질문과 진료 메모 정리를 쓸 수 없어요.
      </p>

      <section className="border-grey-200 rounded-banner mt-5 flex flex-col gap-2.5 border p-4.5">
        <h2 className="text-t6 text-grey-900 font-bold">어디서 처리하나요</h2>
        {PROCESSING.map(({ label, value }) => (
          <p key={label} className="text-body-3 flex gap-3">
            <span className="text-grey-600 w-17 shrink-0">{label}</span>
            <span className="text-grey-800">{value}</span>
          </p>
        ))}
        <p className="text-t7 text-grey-600">
          이름·연락처는 보내지 않아요.
          <br />
          커뮤니티 글 확인은 이 설정과 따로 이뤄져요.
        </p>
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
        disabled={!photo?.agreed && !chat?.agreed && !overseas?.agreed}
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
      {askOverseas && (
        <ConfirmSheet
          title="해외로 보내기도 켤까요?"
          summary={[
            { label: '받는 곳', value: '미국 OpenAI' },
            { label: '보내는 것', value: '질문 글 · 바로 앞 대화' },
            { label: '보관', value: '30일 보관 후 삭제' },
          ]}
          description={
            <p className="text-t7">
              당당이는 해외로 보내기가 켜져 있어야 답할 수 있어요. 기록 숫자는 해외로 보내지 않아요.
            </p>
          }
          confirmLabel="둘 다 켜기"
          onConfirm={() => {
            setAskOverseas(false)
            saveFeature('chat', true, true)
          }}
          secondary={{
            label: '기록 보기만 켜기',
            onClick: () => {
              setAskOverseas(false)
              saveFeature('chat', true)
            },
          }}
          onClose={() => setAskOverseas(false)}
        />
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default AiSettingsPage
