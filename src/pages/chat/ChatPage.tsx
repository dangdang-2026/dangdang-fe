import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import iconRecords from '@/assets/icons/chat/records.svg'
import iconRetry from '@/assets/icons/chat/retry.svg'
import BotMessage, { BotBubble, UserBubble } from '@/components/chat/BotMessage'
import ChatActionButton from '@/components/chat/ChatActionButton'
import ChatHeader from '@/components/chat/ChatHeader'
import ChatInput from '@/components/chat/ChatInput'
import ChatIntro from '@/components/chat/ChatIntro'
import ConsentSheet from '@/components/chat/ConsentSheet'
import ContactCard from '@/components/chat/ContactCard'
import DraftCard from '@/components/chat/DraftCard'
import DraftEditSheet from '@/components/chat/DraftEditSheet'
import InfoAnswer from '@/components/chat/InfoAnswer'
import RecordsCard from '@/components/chat/RecordsCard'
import RiskCard from '@/components/chat/RiskCard'
import ThinkingBubble from '@/components/chat/ThinkingBubble'
import Toast from '@/components/common/Toast'
import ContactMemoSheet from '@/components/my/ContactMemoSheet'
import { CHAT_INFOS, CHAT_THINKING_MS } from '@/constants/chat'
import { ROUTES } from '@/constants/routes'
import { useCriteria } from '@/hooks/useCriteria'
import { useAiStore } from '@/stores/useAiStore'
import { useChatStore } from '@/stores/useChatStore'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { useVisitStore } from '@/stores/useVisitStore'
import type { BotMessage as BotMessageType, ChatMessage } from '@/types/chat'
import {
  buildDraft,
  buildDraftIntro,
  classifyQuestion,
  detectSlot,
  findInfo,
  pickDefaultSlot,
  summarizeRecords,
} from '@/utils/chat'

const newId = () => crypto.randomUUID()

// Figma Q-01~Q-09 당당이에게 물어보기. AI 연동 전까지 규칙으로 답함
function ChatPage() {
  const navigate = useNavigate()
  const messages = useChatStore((state) => state.messages)
  const consent = useAiStore((state) => state.chat)
  const setConsent = useAiStore((state) => state.setConsent)
  const addMessage = useChatStore((state) => state.addMessage)
  const updateMessage = useChatStore((state) => state.updateMessage)
  const removeMessage = useChatStore((state) => state.removeMessage)
  const records = useGlucoseStore((state) => state.records)
  const criteria = useCriteria()
  const contactMemo = useProfileStore((state) => state.contactMemo)
  const updateProfile = useProfileStore((state) => state.updateProfile)
  const addQuestion = useVisitStore((state) => state.addQuestion)

  // 처음 들어오면 동의부터 물어봄
  const [consentSheet, setConsentSheet] = useState(consent === null)
  // 동의를 기다리는 기록 질문
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null)
  const [thinking, setThinking] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null)
  const [memoSheet, setMemoSheet] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    action?: { label: string; onClick: () => void }
  } | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => () => window.clearTimeout(timerRef.current ?? undefined), [])

  useEffect(() => {
    // 새 말풍선이 입력 바 위로 보이게 맨 아래로
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }, [messages.length, thinking])

  const answer = (question: string): BotMessageType => {
    const intent = classifyQuestion(question)
    const now = new Date()
    const agreed = !!useAiStore.getState().chat?.agreed

    if (intent === 'records') {
      const slot = detectSlot(question) ?? pickDefaultSlot(records, criteria, now)
      return {
        id: newId(),
        from: 'bot',
        kind: 'records',
        summary: summarizeRecords(records, criteria, slot, now),
      }
    }
    if (intent === 'draft') {
      // 바로 앞에 찾은 기록이 있으면 그걸로 정리
      const lastRecords = useChatStore
        .getState()
        .messages.findLast((message) => message.from === 'bot' && message.kind === 'records')
      const slot = detectSlot(question)
      const summary = !agreed
        ? null
        : slot
          ? summarizeRecords(records, criteria, slot, now)
          : lastRecords?.from === 'bot' && lastRecords.kind === 'records'
            ? lastRecords.summary
            : summarizeRecords(records, criteria, pickDefaultSlot(records, criteria, now), now)
      return {
        id: newId(),
        from: 'bot',
        kind: 'draft',
        intro: buildDraftIntro(question),
        text: buildDraft(summary),
        added: false,
      }
    }
    if (intent === 'info') {
      return {
        id: newId(),
        from: 'bot',
        kind: 'info',
        infoId: findInfo(question)!.id,
        feedback: null,
      }
    }
    return { id: newId(), from: 'bot', kind: 'unknown', question }
  }

  const reply = (question: string) => {
    const intent = classifyQuestion(question)
    // 위험 신호는 AI를 거치지 않고 바로 정해진 안내
    if (intent === 'risk') {
      addMessage({ id: newId(), from: 'bot', kind: 'risk' })
      return
    }
    if (intent === 'records' && !useAiStore.getState().chat?.agreed) {
      addMessage({ id: newId(), from: 'bot', kind: 'need-consent', question })
      return
    }
    setThinking(intent === 'records' ? '기록을 찾고 있어요' : '답을 찾고 있어요')
    timerRef.current = window.setTimeout(() => {
      setThinking(null)
      addMessage(
        navigator.onLine ? answer(question) : { id: newId(), from: 'bot', kind: 'fail', question },
      )
    }, CHAT_THINKING_MS)
  }

  const ask = (text: string) => {
    addMessage({ id: newId(), from: 'user', text })
    reply(text)
  }

  const addDraft = (id: string, text: string) => {
    addQuestion(text)
    updateMessage(id, { text, added: true })
    setToast({
      message: '물어볼 것에 추가했어요',
      action: { label: '진료 탭에서 보기', onClick: () => navigate(ROUTES.VISIT) },
    })
  }

  const closeToast = useCallback(() => setToast(null), [])
  const closeConsent = useCallback(() => {
    setConsentSheet(false)
    setPendingQuestion(null)
  }, [])

  const chooseConsent = (agreed: boolean) => {
    setConsent('chat', agreed)
    setConsentSheet(false)
    if (agreed && pendingQuestion) reply(pendingQuestion)
    setPendingQuestion(null)
  }

  const renderMessage = (message: ChatMessage) => {
    if (message.from === 'user') return <UserBubble key={message.id} text={message.text} />

    switch (message.kind) {
      case 'records': {
        const { summary } = message
        return (
          <BotMessage key={message.id}>
            {summary.measured === 0 ? (
              <>
                <BotBubble>
                  지난 7일 {summary.label} 기록이 없어요. 기록 탭에서 다른 날을 볼 수 있어요.
                </BotBubble>
                <ChatActionButton icon={iconRecords} onClick={() => navigate(ROUTES.RECORDS)}>
                  기록 탭에서 보기
                </ChatActionButton>
              </>
            ) : (
              <>
                <BotBubble>지난 7일 {summary.label} 기록을 찾아봤어요.</BotBubble>
                <RecordsCard summary={summary} />
                <BotBubble>
                  이 기록이 괜찮은지는 제가 말씀드릴 수 없어요. 진료 때 물어볼 말로 정리해 드릴까요?
                </BotBubble>
                <div className="flex gap-2">
                  <ChatActionButton primary onClick={() => ask('물어볼 말로 정리해 줘')}>
                    물어볼 말로 정리하기
                  </ChatActionButton>
                  <ChatActionButton onClick={() => navigate(ROUTES.RECORDS)}>
                    기록 자세히 보기
                  </ChatActionButton>
                </div>
              </>
            )}
          </BotMessage>
        )
      }
      case 'draft':
        return (
          <BotMessage key={message.id} avatar={message.added ? 'done' : 'agent'}>
            <BotBubble>{message.intro}</BotBubble>
            <DraftCard
              text={message.text}
              added={message.added}
              onAdd={() => addDraft(message.id, message.text)}
              onEdit={() => setEditing({ id: message.id, text: message.text })}
            />
            <ContactCard memo={contactMemo} onWriteMemo={() => setMemoSheet(true)} />
          </BotMessage>
        )
      case 'info': {
        const info = CHAT_INFOS.find((item) => item.id === message.infoId)
        if (!info) return null
        return (
          <BotMessage key={message.id}>
            <InfoAnswer
              info={info}
              feedback={message.feedback}
              onFeedback={(feedback) => updateMessage(message.id, { feedback })}
            />
          </BotMessage>
        )
      }
      case 'risk':
        return <RiskCard key={message.id} />
      case 'unknown':
        return (
          <BotMessage key={message.id}>
            <BotBubble>
              그 질문은 제가 확인한 자료로는 답하기 어려워요. 병원에 물어보시는 게 가장 정확해요.
            </BotBubble>
            <ChatActionButton
              primary
              onClick={() =>
                addMessage({
                  id: newId(),
                  from: 'bot',
                  kind: 'draft',
                  intro: buildDraftIntro(''),
                  text: message.question,
                  added: false,
                })
              }
            >
              물어볼 말로 정리하기
            </ChatActionButton>
          </BotMessage>
        )
      case 'fail':
        return (
          <BotMessage key={message.id} avatar="sorry">
            <BotBubble>
              지금은 답을 만들 수 없어요. 잠시 뒤에 다시 물어봐 주세요. 기록은 기록 탭에서 바로 볼
              수 있어요.
            </BotBubble>
            <div className="flex gap-2">
              <ChatActionButton
                icon={iconRetry}
                onClick={() => {
                  removeMessage(message.id)
                  reply(message.question)
                }}
              >
                다시 물어보기
              </ChatActionButton>
              <ChatActionButton icon={iconRecords} onClick={() => navigate(ROUTES.RECORDS)}>
                기록 탭에서 보기
              </ChatActionButton>
            </div>
          </BotMessage>
        )
      case 'need-consent':
        return (
          <BotMessage key={message.id}>
            <BotBubble>
              기록을 보려면 먼저 동의가 필요해요. 동의하지 않으면 일반 질문에만 답할 수 있어요.
            </BotBubble>
            <ChatActionButton
              primary
              onClick={() => {
                setPendingQuestion(message.question)
                setConsentSheet(true)
              }}
            >
              기록 보여 주기
            </ChatActionButton>
          </BotMessage>
        )
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white break-keep">
      <ChatHeader onBack={() => navigate(-1)} onHelp={() => setConsentSheet(true)} />
      <div className="flex flex-1 flex-col gap-4 p-5">
        {messages.length === 0 && <ChatIntro onAsk={ask} />}
        {messages.map(renderMessage)}
        {thinking && <ThinkingBubble label={thinking} />}
      </div>
      <ChatInput disabled={!!thinking} onSend={ask} />

      {consentSheet && (
        <ConsentSheet
          onAgree={() => chooseConsent(true)}
          onDecline={() => chooseConsent(false)}
          onClose={closeConsent}
        />
      )}
      {editing && (
        <DraftEditSheet
          initialText={editing.text}
          onSave={(text) => {
            addDraft(editing.id, text)
            setEditing(null)
          }}
          onClose={() => setEditing(null)}
        />
      )}
      {memoSheet && (
        <ContactMemoSheet
          initialMemo={contactMemo}
          onSave={(memo) => {
            updateProfile({ contactMemo: memo })
            setMemoSheet(false)
            setToast({ message: '연락 기준 메모를 저장했어요' })
          }}
          onClose={() => setMemoSheet(false)}
        />
      )}
      {toast && <Toast message={toast.message} action={toast.action} onClose={closeToast} />}
    </main>
  )
}

export default ChatPage
