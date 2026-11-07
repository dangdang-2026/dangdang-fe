// 받침이 있으면 앞 조사, 없으면 뒤 조사. 숫자·기호로 끝나면 받침 있는 것으로 봄
function hasBatchim(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  return code < 0 || code > 11171 || code % 28 !== 0
}

// 예: 병원을 · 의원을 · 산부인과를
export const objectParticle = (word: string) => (hasBatchim(word) ? '을' : '를')
