import { apiClient } from '@/api/axios'
import type { ReportReason } from '@/types/community'

// 화면 신고 이유 → 서버 ReportReason(U-12 6개)
const REASON: Record<ReportReason, string> = {
  medical: 'MEDICAL_ADVICE',
  compare: 'NUMBER_COMPARE',
  ad: 'AD_SALES',
  privacy: 'PRIVACY',
  abuse: 'ABUSE',
  etc: 'ETC',
}

// 글 · 댓글 신고. 같은 대상을 다시 신고해도 200, 내 글은 REPORT_40001
export async function report(
  targetType: 'POST' | 'COMMENT',
  targetId: string,
  reason: ReportReason,
) {
  await apiClient.post('/reports', {
    targetType,
    targetId: Number(targetId),
    reason: REASON[reason],
  })
}
