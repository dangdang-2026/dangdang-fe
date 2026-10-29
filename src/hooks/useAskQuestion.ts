import { useCallback, useState } from 'react'
import { useNow } from '@/hooks/useNow'
import { useVisitStore } from '@/stores/useVisitStore'
import { formatMonthDay } from '@/utils/date'
import { getVisitStatus } from '@/utils/visit'

// 자료를 읽다가 물어볼 것 적기. 시트 열림·저장·토스트 상태
export function useAskQuestion() {
  const addQuestion = useVisitStore((state) => state.addQuestion)
  const nextVisitAt = useVisitStore((state) => state.nextVisitAt)
  const status = getVisitStatus(nextVisitAt, useNow())
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  // 세터를 밖으로 넘겨서 컴파일러가 의존성에 넣길 원함
  const closeSheet = useCallback(() => setOpen(false), [setOpen])
  const closeToast = useCallback(() => setToast(null), [setToast])

  const save = (text: string) => {
    addQuestion(text)
    setOpen(false)
    setToast('물어볼 것에 적었어요')
  }

  return {
    open,
    toast,
    visitLabel: status.kind === 'unknown' ? undefined : `${formatMonthDay(status.at)} 진료`,
    openSheet: () => setOpen(true),
    closeSheet,
    closeToast,
    showToast: setToast,
    save,
  }
}
