// @ 없음, 도메인 없음, 한글·특수문자 포함은 형식 오류
export const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

export const PASSWORD_MIN = 8

// 자주 틀리는 도메인 → 맞는 도메인
const DOMAIN_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'naver.con': 'naver.com',
  'navre.com': 'naver.com',
  'naver.co': 'naver.com',
  'hanmial.net': 'hanmail.net',
  'hanmail.ent': 'hanmail.net',
  'daum.ent': 'daum.net',
  'nate.con': 'nate.com',
}

// 오타로 보이면 고친 도메인, 아니면 null
export function suggestDomain(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase()
  return (domain && DOMAIN_TYPOS[domain]) ?? null
}

export function replaceDomain(email: string, domain: string) {
  return `${email.split('@')[0]}@${domain}`
}

export function checkPassword(password: string) {
  return {
    length: password.length >= PASSWORD_MIN,
    mix: /[A-Za-z]/.test(password) && /\d/.test(password),
    space: /\s/.test(password),
  }
}
