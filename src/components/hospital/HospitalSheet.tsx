import { useState } from 'react'
import iconInfo from '@/assets/icons/info-lg.svg'
import iconClose from '@/assets/icons/close.svg'
import BottomSheet from '@/components/common/BottomSheet'
import VisitDateSheet from '@/components/visit/VisitDateSheet'
import { DEPARTMENTS } from '@/constants/hospital'
import type { Department, Hospital, HospitalInfo } from '@/types/hospital'
import { formatMeridiemTime, startOfDay } from '@/utils/date'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 예: 10월 30일 (목) 오전 9:00
const formatVisitAt = (at: Date) =>
  `${at.getMonth() + 1}월 ${at.getDate()}일 (${WEEKDAYS[at.getDay()]}) ${formatMeridiemTime(at)}`

const chipClass = (selected: boolean) =>
  `rounded-full border px-3.5 py-2 text-sm leading-snug ${
    selected
      ? 'bg-primary text-grey-900 border-transparent font-bold'
      : 'border-grey-200 text-grey-800 bg-white font-medium'
  }`

type HospitalSheetProps = {
  info: HospitalInfo
  department?: Department
  nextVisitAt: string | null
  // 검색에 없어 직접 적는 병원. 전화번호도 직접
  manual: boolean
  // 있으면 C-19 고치기
  editing?: boolean
  onSave: (input: Omit<Hospital, 'id'>) => void
  onDelete?: () => void
  onClose: () => void
}

// Figma C-23 병원 추가 · C-19 병원 정보 고치기
function HospitalSheet({
  info,
  department: initialDepartment,
  nextVisitAt,
  manual,
  editing,
  onSave,
  onDelete,
  onClose,
}: HospitalSheetProps) {
  const [name, setName] = useState(info.name)
  const [phone, setPhone] = useState(info.phone ?? '')
  const [department, setDepartment] = useState<Department | null>(initialDepartment ?? null)
  const [visitAt, setVisitAt] = useState<Date | null>(nextVisitAt ? new Date(nextVisitAt) : null)
  const [dateSheet, setDateSheet] = useState(false)
  const details = [info.address, manual ? null : info.phone].filter(Boolean).join(' · ')

  const save = () => {
    if (!name.trim() || !department) return
    onSave({
      ...info,
      name: name.trim(),
      phone: phone.trim() || undefined,
      department,
      nextVisitAt: visitAt?.toISOString() ?? null,
    })
  }

  return (
    <BottomSheet label={editing ? '병원 정보 고치기' : '병원 추가'} onClose={onClose}>
      <div className="flex items-center justify-between">
        <h2 className="text-t4 text-grey-900">{editing ? '병원 정보 고치기' : '병원 추가'}</h2>
        <button type="button" aria-label="닫기" onClick={onClose}>
          <img src={iconClose} alt="" width={22} height={22} />
        </button>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-body-3 text-grey-600">병원 이름</span>
        <input
          value={name}
          maxLength={40}
          placeholder="병원 이름을 적어 주세요"
          className="bg-grey-50 text-body-2 text-grey-900 placeholder:text-grey-400 rounded-key focus:ring-primary px-3.5 py-3 outline-none focus:ring-2"
          onChange={(event) => setName(event.target.value)}
        />
        {details && <span className="text-t7 text-grey-600">{details}</span>}
      </label>

      {manual && (
        <label className="flex flex-col gap-2">
          <span className="text-body-3 text-grey-600">전화번호 (선택)</span>
          <input
            value={phone}
            inputMode="tel"
            maxLength={20}
            placeholder="예: 02-000-0000"
            className="bg-grey-50 text-body-2 text-grey-900 placeholder:text-grey-400 rounded-key focus:ring-primary px-3.5 py-3 outline-none focus:ring-2"
            onChange={(event) => setPhone(event.target.value.replace(/[^\d-]/g, ''))}
          />
        </label>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-body-3 text-grey-600">진료과</span>
        <div className="flex flex-wrap gap-2">
          {DEPARTMENTS.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={department === item}
              className={chipClass(department === item)}
              onClick={() => setDepartment(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-body-3 text-grey-600">다음 진료일</span>
        <div className="flex gap-2">
          {visitAt ? (
            // 날짜가 길어 한 줄로 넓게
            <span className={`${chipClass(true)} flex-3 px-2.5 text-center whitespace-nowrap`}>
              {formatVisitAt(visitAt)}
            </span>
          ) : (
            <button
              type="button"
              aria-pressed
              className={`${chipClass(true)} flex-1`}
              onClick={() => setVisitAt(null)}
            >
              아직 몰라요
            </button>
          )}
          <button
            type="button"
            className={`${chipClass(false)} ${visitAt ? 'flex-2' : 'flex-1'}`}
            onClick={() => setDateSheet(true)}
          >
            {visitAt ? '날짜 바꾸기' : '날짜 고르기'}
          </button>
        </div>
      </div>

      <p className="bg-grey-50 text-t7 text-grey-700 flex items-start gap-2 rounded-xl px-3.5 py-3 leading-relaxed">
        <img src={iconInfo} alt="" width={18} height={18} className="shrink-0" />
        {manual
          ? '직접 적은 병원이에요. 진료 기록과 리포트는 그대로 남아요.'
          : `주소·전화번호는 건강보험심사평가원 병원정보에서 가져왔어요. ${
              editing ? '진료 기록과 리포트는 그대로 남아요.' : '바뀌었으면 고칠 수 있어요.'
            }`}
      </p>

      <button
        type="button"
        disabled={!name.trim() || !department}
        className="bg-primary disabled:bg-grey-100 disabled:text-grey-400 rounded-key py-4 text-base leading-snug font-bold text-white"
        onClick={save}
      >
        {editing ? '저장' : '추가'}
      </button>
      {onDelete && (
        <button
          type="button"
          className="text-grey-600 self-center text-sm leading-snug font-medium"
          onClick={onDelete}
        >
          이 병원 지우기
        </button>
      )}

      {dateSheet && (
        <VisitDateSheet
          editing={!!visitAt}
          hospitalName={name.trim() || info.name}
          initialAt={visitAt}
          today={startOfDay(new Date())}
          onSave={(at) => {
            setVisitAt(at)
            setDateSheet(false)
          }}
          onUnknown={() => {
            setVisitAt(null)
            setDateSheet(false)
          }}
          onClose={() => setDateSheet(false)}
        />
      )}
    </BottomSheet>
  )
}

export default HospitalSheet
