import iconPathChevron from '@/assets/icons/community/path-chevron.svg'
import iconPolicyAbuse from '@/assets/icons/community/policy-abuse.svg'
import iconPolicyAd from '@/assets/icons/community/policy-ad.svg'
import iconPolicyCompare from '@/assets/icons/community/policy-compare.svg'
import iconPolicyMedical from '@/assets/icons/community/policy-medical.svg'
import iconPolicyPrivacy from '@/assets/icons/community/policy-privacy.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'

const RULES = [
  {
    icon: iconPolicyMedical,
    title: '진단·처방, 약 이름·용량 권유',
    description: '“이 약 이만큼 드세요” 같은 글은 병원에 물어봐 주세요',
  },
  {
    icon: iconPolicyCompare,
    title: '혈당 수치 비교·순위',
    description: '사람마다 병원 기준이 달라서 비교하면 불안해질 수 있어요',
  },
  {
    icon: iconPolicyAd,
    title: '광고·판매·후원 요청',
    description: '제휴 광고는 AD 표시로만 보여요',
  },
  {
    icon: iconPolicyPrivacy,
    title: '개인정보 노출',
    description: '실명·연락처·진료 기록 사진은 올리지 마세요',
  },
  { icon: iconPolicyAbuse, title: '비방·혐오·성적인 글' },
]

const STEPS = ['글 가림', '작성자에게 알림', '반복 시 이용 제한']

// Figma N-06 커뮤니티 운영정책
function PolicyPage() {
  const goBack = useGoBack(ROUTES.COMMUNITY)

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-10">
      <SubPageHeader title="커뮤니티 운영정책" onBack={goBack} />

      <div className="mt-5 flex flex-col gap-4.5">
        <div className="flex flex-col gap-2">
          <h2 className="text-t3 text-grey-900">함께 지키는 커뮤니티 약속</h2>
          <p className="text-grey-600 text-sm leading-relaxed">
            같은 길을 걷는 산모끼리 안전하게 이야기할 수 있도록 아래 글은 가려요.
          </p>
        </div>

        <ul className="border-grey-200 divide-grey-100 rounded-key divide-y border">
          {RULES.map(({ icon, title, description }) => (
            <li key={title} className="flex items-start gap-3 px-4 py-3.5">
              <img src={icon} alt="" width={20} height={20} className="shrink-0" />
              <div className="flex flex-col gap-0.5">
                <p className="text-t6 text-grey-900 leading-snug font-bold">{title}</p>
                {description && <p className="text-t7 text-grey-600">{description}</p>}
              </div>
            </li>
          ))}
        </ul>

        <h3 className="text-t6 text-grey-900 leading-snug font-bold">이렇게 처리해요</h3>
        <ol className="flex items-center gap-1">
          {STEPS.map((step, index) => (
            <li key={step} className="flex flex-1 items-center gap-1">
              {index > 0 && <img src={iconPathChevron} alt="" width={14} height={14} />}
              <span className="bg-grey-50 rounded-tag text-grey-800 flex-1 px-1.5 py-2 text-center text-xs leading-snug font-medium">
                {step}
              </span>
            </li>
          ))}
        </ol>
        <p className="text-t7 text-grey-600 leading-relaxed">
          가려진 글이 억울하면 글 메뉴 › 이의 신청으로 알려 주세요. 다른 사람 글은 ⋮ › 신고하기로
          알려 주세요. 제한 기간 기준은 운영하며 정하고 바뀌면 미리 알려요.
        </p>
      </div>
    </main>
  )
}

export default PolicyPage
