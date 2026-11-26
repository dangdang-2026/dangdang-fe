import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { useNavigate } from 'react-router'
import { getErrorCode } from '@/api/axios'
import { askChat } from '@/api/chat'
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
import { ROUTES } from '@/constants/routes'
import { useCriteria } from '@/hooks/useCriteria'
import { saveChatConsents, useAiStore } from '@/stores/useAiStore'
import {
  loadOlderChatMessages,
  rateChatAnswer,
  syncChatMessages,
  useChatStore,
} from '@/stores/useChatStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { saveQuestion } from '@/stores/useVisitStore'
import type { ChatMessage } from '@/types/chat'
import { DRAFT_INTRO, summarizeServerCard } from '@/utils/chat'

const newId = () => crypto.randomUUID()

// Figma Q-01~Q-09 당당이에게 물어보기. 답의 종류 · 판단은 서버가 하고 화면은 그리기만
function ChatPage() {
  const navigate = useNavigate()
  const messages = useChatStore((state) => state.messages)
  const consent = useAiStore((state) => state.chat)
  const overseas = useAiStore((state) => state.overseas)
  const setConsent = useAiStore((state) => state.setConsent)
  const addMessage = useChatStore((state) => state.addMessage)
  const updateMessage = useChatStore((state) => state.updateMessage)
  const removeMessage = useChatStore((state) => state.removeMessage)
  const criteria = useCriteria()
  const contactMemo = useProfileStore((state) => state.contactMemo)
  const updateProfile = useProfileStore((state) => state.updateProfile)

  // 기록 보기 · 해외로 보내기 중 아직 안 물어본 게 있으면 동의부터
  const [consentSheet, setConsentSheet] = useState(consent === null || overseas === null)
  // 동의를 기다리는 기록 질문
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null)
  const [thinking, setThinking] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null)
  const [memoSheet, setMemoSheet] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    action?: { label: string; onClick: () => void }
  } | null>(null)

  // 들어올 때 지난 대화를 받음. 받기 전엔 첫 화면(추천 질문)을 숨김
  const [loaded, setLoaded] = useState(false)
  // 이전 대화를 더 부를 커서. 더 없으면 null
  const [olderCursor, setOlderCursor] = useState<number | null>(null)
  const [loadingOlder, setLoadingOlder] = useState(false)

  useEffect(() => {
    syncChatMessages()
      .then((page) => setOlderCursor(page.hasNext ? page.nextCursorId : null))
      // 못 받으면 지금 화면 그대로
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const loadOlder = () => {
    if (olderCursor === null || loadingOlder) return
    setLoadingOlder(true)
    loadOlderChatMessages(olderCursor)
      .then((page) => setOlderCursor(page.hasNext ? page.nextCursorId : null))
      .catch(() => setToast({ message: '이전 대화를 불러오지 못했어요' }))
      .finally(() => setLoadingOlder(false))
  }

  // 새 말풍선이 입력 바 위로 보이게 맨 아래로. 이전 대화를 앞에 붙일 땐 그대로
  const lastId = messages.at(-1)?.id
  useEffect(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }, [lastId, thinking])

  // 서버에 묻고 답을 붙임. 서버에 안 남는 실패(403 · 429 · 연결)는 기기에만 안내
  // userId는 방금 보낸 말풍선. 없으면 이미 화면에 있는 질문을 다시 묻는 것
  const reply = (question: string, userId?: string) => {
    setThinking('답을 찾고 있어요')
    askChat(question)
      .then((result) => {
        // 새로 보낸 말풍선은 서버 번호로 바꿈. 다시 묻기 · 동의 뒤 묻기는 앞 말풍선이 이미 있어 답만
        if (userId) {
          removeMessage(userId)
          addMessage(result.question)
        }
        addMessage(result.answer)
      })
      .catch((error: unknown) => {
        const code = getErrorCode(error)
        if (code === 'AI_40301') {
          // 다른 기기에서 껐을 수 있어 기기도 해외로 보내기 안 함으로
          setConsent('overseas', false)
          addMessage({
            id: newId(),
            from: 'bot',
            kind: 'need-consent',
            question,
            reason: 'overseas',
          })
        } else if (code === 'AI_42901') {
          addMessage({ id: newId(), from: 'bot', kind: 'limit' })
        } else {
          addMessage({ id: newId(), from: 'bot', kind: 'fail', question })
        }
      })
      .finally(() => setThinking(null))
  }

  const ask = (text: string) => {
    const id = newId()
    addMessage({ id, from: 'user', text })
    reply(text, id)
  }

  // 커뮤니티 검색 등에서 질문을 들고 오면 한 번만 바로 물어봄
  const location = useLocation()
  const initialAsk = (location.state as { ask?: string } | null)?.ask
  const askedRef = useRef(false)
  useEffect(() => {
    if (!initialAsk || askedRef.current) return
    askedRef.current = true
    navigate(location.pathname, { replace: true, state: null })
    // 주소의 state를 비우면 effect가 다시 돌아도 askedRef로 한 번만 물어봄
    window.setTimeout(() => ask(initialAsk))
    // 들어올 때 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAsk])

  const addDraft = (id: string, text: string) => {
    // 서버 「물어볼 말 정리」 답이면 답 번호를 같이 보내 당당이 질문으로 남김
    const draft = messages.find((message) => message.id === id)
    const chatMessageId = draft && 'chatMessageId' in draft ? draft.chatMessageId : undefined
    updateMessage(id, { text, added: true })
    // 서버에 못 남기면 추가 전으로 되돌림
    saveQuestion(text, { chatMessageId }).catch(() => {
      updateMessage(id, { added: false })
      setToast({ message: '물어볼 것을 저장하지 못했어요. 잠시 후 다시 시도해 주세요' })
    })
    setToast({
      message: '물어볼 것에 추가했어요',
      action: { label: '진료 탭에서 보기', onClick: () => navigate(ROUTES.VISIT) },
    })
  }

  // 답 대신 내가 물어볼 말로 직접 정리
  const addDraftMessage = (question: string) =>
    addMessage({
      id: newId(),
      from: 'bot',
      kind: 'draft',
      intro: DRAFT_INTRO,
      text: question,
      added: false,
    })

  const closeToast = useCallback(() => setToast(null), [])
  const closeConsent = useCallback(() => {
    setConsentSheet(false)
    setPendingQuestion(null)
  }, [])

  // 기록 보기는 고른 대로, 해외로 보내기는 필수라 늘 동의. 기다리던 질문은 저장 뒤 다시 물음
  const chooseConsent = (records: boolean) => {
    const question = pendingQuestion
    setConsentSheet(false)
    setPendingQuestion(null)
    saveChatConsents({ records, overseas: true })
      .then(() => {
        if (question) reply(question)
      })
      .catch(() => setToast({ message: '동의를 저장하지 못했어요. 잠시 후 다시 시도해 주세요' }))
  }

  const renderMessage = (message: ChatMessage) => {
    if (message.from === 'user') return <UserBubble key={message.id} text={message.text} />

    switch (message.kind) {
      case 'records': {
        const summary = summarizeServerCard(message.card, criteria)
        return (
          <BotMessage key={message.id}>
            {summary.measured === 0 ? (
              <>
                <BotBubble>
                  {summary.range} {summary.label} 기록이 없어요. 기록 탭에서 다른 날을 볼 수 있어요.
                </BotBubble>
                <ChatActionButton icon={iconRecords} onClick={() => navigate(ROUTES.RECORDS)}>
                  기록 탭에서 보기
                </ChatActionButton>
              </>
            ) : (
              <>
                <BotBubble>{message.text}</BotBubble>
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
        return (
          <BotMessage key={message.id}>
            <InfoAnswer
              text={message.text}
              sources={message.sources}
              feedback={message.feedback}
              onFeedback={(feedback) =>
                rateChatAnswer(message.id, feedback).catch(() =>
                  setToast({ message: '의견을 보내지 못했어요. 잠시 후 다시 시도해 주세요' }),
                )
              }
            />
          </BotMessage>
        )
      }
      case 'risk':
        return (
          <div key={message.id} className="flex flex-col gap-2.5">
            <RiskCard text={message.text} actions={message.actions} dose={message.dose} />
            {/* 약 용량은 진료 때 잊지 않게 물어볼 말로 */}
            {message.dose && (
              <ChatActionButton primary onClick={() => addDraftMessage(message.question)}>
                물어볼 말로 정리하기
              </ChatActionButton>
            )}
          </div>
        )
      case 'unknown':
        return (
          <BotMessage key={message.id}>
            <BotBubble>{message.text}</BotBubble>
            <ChatActionButton primary onClick={() => addDraftMessage(message.question)}>
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
              {/* 이전 대화 장 경계에서 앞 질문을 모르면 다시 묻기 숨김 */}
              {message.question && (
                <ChatActionButton
                  icon={iconRetry}
                  onClick={() => {
                    removeMessage(message.id)
                    reply(message.question)
                  }}
                >
                  다시 물어보기
                </ChatActionButton>
              )}
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
              {message.reason === 'records'
                ? '기록을 보려면 먼저 동의가 필요해요. 동의하지 않으면 일반 질문에만 답할 수 있어요.'
                : 'AI가 답하려면 해외 AI 서비스 이용(국외 이전) 동의가 필요해요.'}
            </BotBubble>
            <ChatActionButton
              primary
              onClick={() => {
                setPendingQuestion(message.question)
                setConsentSheet(true)
              }}
            >
              {message.reason === 'records' ? '기록 보여 주기' : '동의하고 물어보기'}
            </ChatActionButton>
          </BotMessage>
        )
      case 'limit':
        return (
          <BotMessage key={message.id} avatar="sorry">
            <BotBubble>
              오늘은 질문을 모두 쓰셨어요. 내일 다시 물어봐 주세요. 기록은 기록 탭에서 바로 볼 수
              있어요.
            </BotBubble>
            <ChatActionButton icon={iconRecords} onClick={() => navigate(ROUTES.RECORDS)}>
              기록 탭에서 보기
            </ChatActionButton>
          </BotMessage>
        )
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white break-keep">
      <ChatHeader onBack={() => navigate(-1)} onHelp={() => setConsentSheet(true)} />
      <div className="flex flex-1 flex-col gap-4 p-5">
        {olderCursor !== null && (
          <button
            type="button"
            disabled={loadingOlder}
            className="text-grey-600 self-center text-sm leading-normal underline"
            onClick={loadOlder}
          >
            {loadingOlder ? '불러오는 중…' : '이전 대화 더 보기'}
          </button>
        )}
        {loaded && messages.length === 0 && (
          <ChatIntro
            onAsk={ask}
            recordsDeclined={consent !== null && !consent.agreed}
            hideSuggestions={overseas !== null && !overseas.agreed}
            onOpenSettings={() => navigate(ROUTES.MY_AI)}
          />
        )}
        {messages.map(renderMessage)}
        {thinking && <ThinkingBubble label={thinking} />}
      </div>
      <ChatInput disabled={!!thinking} onSend={ask} />

      {consentSheet && <ConsentSheet onSubmit={chooseConsent} onClose={closeConsent} />}
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
