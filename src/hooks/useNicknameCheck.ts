import { useEffect, useState } from 'react'
import { checkNicknameAvailable } from '@/api/communityProfile'
import { checkNicknameFormat, type NicknameCheck } from '@/utils/nickname'

// 입력을 멈추고 기다렸다 확인. 글자마다 서버를 부르지 않게
const CHECK_DELAY_MS = 300

// 닉네임 형식은 바로, 쓰는 사람이 있는지는 서버에서 확인. 지금 내 닉네임은 확인 안 함
export function useNicknameCheck(name: string, current?: string | null): NicknameCheck {
  const trimmed = name.trim()
  const format = checkNicknameFormat(trimmed)
  const needsServer = format === 'ok' && trimmed !== current
  const [result, setResult] = useState<{ name: string; available: boolean } | null>(null)

  useEffect(() => {
    if (!needsServer) return
    // 늦게 온 이전 이름 결과는 버림
    let stale = false
    const timer = window.setTimeout(() => {
      checkNicknameAvailable(trimmed)
        .then((available) => {
          if (!stale) setResult({ name: trimmed, available })
        })
        .catch(() => {
          // 확인을 못 하면 막지 않음. 저장할 때 서버가 중복을 다시 막음
          if (!stale) setResult({ name: trimmed, available: true })
        })
    }, CHECK_DELAY_MS)
    return () => {
      stale = true
      window.clearTimeout(timer)
    }
  }, [trimmed, needsServer])

  if (format !== 'ok') return format
  if (!needsServer) return 'ok'
  if (result?.name !== trimmed) return 'checking'
  return result.available ? 'ok' : 'taken'
}
