import { useRef, useState } from 'react'
import iconCamera from '@/assets/icons/meal-guide/camera.svg'
import iconClose from '@/assets/icons/meal/close.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import ProfileDateSheet from '@/components/my/ProfileDateSheet'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { usePrimaryHospital } from '@/hooks/usePrimaryHospital'
import { useMealGuideStore } from '@/stores/useMealGuideStore'
import { parseDateKey, startOfDay, toDateKey } from '@/utils/date'
import { resizeImageFile } from '@/utils/image'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 예: 10월 14일 (화)
const formatReceivedOn = (date: Date) =>
  `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`

// 예: 10/14
const formatShortDate = (iso: string) => {
  const date = new Date(iso)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const FIELD_CLASS =
  'bg-grey-50 text-grey-900 placeholder:text-grey-400 focus:border-primary rounded-2xl border-2 border-transparent px-4 text-base leading-normal font-medium outline-none focus:bg-white'

// Figma M-15 내 식사 안내. 받은 표현 그대로 적고 식사 기록할 때 꺼내 봄
function MealGuidePage() {
  const goBack = useGoBack(ROUTES.MY_CRITERIA)
  const hospital = usePrimaryHospital()
  const guide = useMealGuideStore((state) => state.guide)
  const saveGuide = useMealGuideStore((state) => state.saveGuide)
  const today = startOfDay(new Date())
  const [receivedOn, setReceivedOn] = useState(guide?.receivedOn ?? toDateKey(today))
  const [place, setPlace] = useState(guide?.place ?? hospital.name)
  const [meals, setMeals] = useState(guide?.meals ?? '')
  const [snacks, setSnacks] = useState(guide?.snacks ?? '')
  const [photo, setPhoto] = useState(guide?.photo)
  const [dateSheet, setDateSheet] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const receivedDate = parseDateKey(receivedOn) ?? today
  const canSave = meals.trim() !== '' || snacks.trim() !== ''

  const addPhoto = async (file: File | undefined) => {
    if (!file) return
    setPhoto(await resizeImageFile(file))
  }

  const save = () => {
    saveGuide({
      receivedOn,
      place: place.trim(),
      meals: meals.trim(),
      snacks: snacks.trim(),
      photo,
    })
    goBack()
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-13 pb-[max(--spacing(9),env(safe-area-inset-bottom))]">
      <SubPageHeader title="내 식사 안내" onBack={goBack} />

      <div className="mt-3.5 flex flex-col gap-5.5">
        <div className="flex flex-col gap-2">
          <h2 className="text-grey-700 text-xl leading-snug font-bold">
            영양 상담에서 받은 식사 안내
          </h2>
          <p className="text-grey-600 text-t7">
            받은 표현 그대로 적어 두면 식사를 기록할 때 꺼내 볼 수 있어요.
          </p>
        </div>

        <div className="flex gap-2.5">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="text-t7 text-grey-700 font-bold">받은 날</span>
            <button
              type="button"
              className={`${FIELD_CLASS} h-13 text-left`}
              onClick={() => setDateSheet(true)}
            >
              {formatReceivedOn(receivedDate)}
            </button>
          </div>
          <label className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="text-t7 text-grey-700 font-bold">받은 곳</span>
            <input
              value={place}
              placeholder="병원 이름"
              className={`${FIELD_CLASS} h-13 min-w-0`}
              onChange={(event) => setPlace(event.target.value)}
            />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-t7 text-grey-700 font-bold">끼니별 안내</span>
          <textarea
            rows={3}
            value={meals}
            placeholder={'아침 · 잡곡밥 2/3공기, 단백질 반찬 1가지\n점심 · …'}
            className={`${FIELD_CLASS} resize-none py-3.5`}
            onChange={(event) => setMeals(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-t7 text-grey-700 font-bold">간식 안내</span>
          <textarea
            rows={1}
            value={snacks}
            placeholder="오전 10시쯤 · 우유 1잔"
            className={`${FIELD_CLASS} field-sizing-content resize-none py-3.5`}
            onChange={(event) => setSnacks(event.target.value)}
          />
        </label>

        <section className="flex flex-col gap-2">
          <h3 className="text-grey-700 text-sm leading-normal font-bold">받은 식단표 사진 (1장)</h3>
          {photo ? (
            <div className="relative">
              <img
                src={photo}
                alt="받은 식단표 사진"
                className="max-h-60 w-full rounded-xl object-contain"
              />
              <button
                type="button"
                aria-label="사진 빼기"
                className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-white/90"
                onClick={() => setPhoto(undefined)}
              >
                <img src={iconClose} alt="" width={18} height={18} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="bg-grey-50 border-grey-300 text-grey-700 flex items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-3.5 text-sm leading-snug"
              onClick={() => fileRef.current?.click()}
            >
              <img src={iconCamera} alt="" width={18} height={18} />
              사진 추가
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              void addPhoto(event.target.files?.[0])
              event.target.value = ''
            }}
          />
          <p className="text-grey-600 text-xs leading-normal">
            사진은 이 기기에만 저장하고 당당 서버에는 올리지 않아요
          </p>
        </section>

        <p className="text-grey-600 text-xs leading-normal">
          {guide &&
            `${formatShortDate(guide.createdAt)} 입력${
              guide.updatedAt ? ` · ${formatShortDate(guide.updatedAt)} 고침` : ''
            } · `}
          바꾸면 고친 날짜가 남아요. 당당은 실제 식사와 비교하지 않아요.
        </p>
      </div>

      {/* 내용이 짧으면 버튼을 아래로, 길면 최소 32px 띄움 */}
      <div className="min-h-8 flex-1" />
      <button
        type="button"
        disabled={!canSave}
        className="text-subtitle-1 disabled:bg-grey-100 disabled:text-grey-400 bg-primary h-14 shrink-0 rounded-xl leading-none text-white"
        onClick={save}
      >
        저장
      </button>

      {dateSheet && (
        <ProfileDateSheet
          title="받은 날"
          description="영양 상담을 받은 날을 골라 주세요"
          initialDate={receivedDate}
          today={today}
          pick="past"
          onSave={(date) => {
            setReceivedOn(toDateKey(date))
            setDateSheet(false)
          }}
          onClose={() => setDateSheet(false)}
        />
      )}
    </main>
  )
}

export default MealGuidePage
