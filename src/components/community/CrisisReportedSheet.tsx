import BottomSheet from '@/components/common/BottomSheet'

type CrisisReportedSheetProps = {
  onClose: () => void
}

// Figma U-13b 걱정되는 글 신고 완료. 운영팀이 먼저 보고, 신고한 사람에게도 상담 전화 안내
function CrisisReportedSheet({ onClose }: CrisisReportedSheetProps) {
  return (
    <BottomSheet label="신고했어요" onClose={onClose}>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-t4 text-grey-900">신고했어요. 가장 먼저 확인할게요</h2>
        <p className="text-t6 text-grey-700">
          걱정되는 글은 운영팀이 먼저 살펴봐요.
          <br />
          지금 위험해 보이면 119에 알려 주세요.
        </p>
      </div>
      <section className="bg-grey-50 rounded-key flex flex-col gap-1.5 px-4 py-3.5">
        <h3 className="text-t6 text-grey-900 font-bold">신고하면서 마음이 무거워졌다면</h3>
        <p className="text-t7 text-grey-700">
          <a href="tel:109" className="font-bold underline">
            109 자살예방상담
          </a>
          <br />
          <a href="tel:15770199" className="font-bold underline">
            1577-0199 정신건강 위기상담
          </a>
          <br />
          언제든 이야기 나눌 수 있어요.
        </p>
      </section>
      <button
        type="button"
        className="text-subtitle-1 bg-primary h-14 rounded-xl leading-none text-white"
        onClick={onClose}
      >
        확인
      </button>
    </BottomSheet>
  )
}

export default CrisisReportedSheet
