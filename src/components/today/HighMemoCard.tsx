// Figma H-06c 목표보다 높은 값을 저장한 직후: 병원에 알릴 일은 연락 메모에
function HighMemoCard({ onWriteMemo }: { onWriteMemo: () => void }) {
  return (
    <section className="rounded-banner flex flex-col gap-2 bg-white p-5">
      <h2 className="text-grey-900 text-base leading-normal font-bold">
        병원에 알릴 일이 있으면
        <br />
        연락 메모에 적어 두세요
      </h2>
      <p className="text-grey-700 text-sm leading-normal">
        다음 진료 때 리포트와 함께 보여 드릴 수 있어요
      </p>
      <button
        type="button"
        className="text-t6 bg-grey-100 text-grey-900 mt-1.5 h-12 rounded-xl font-bold"
        onClick={onWriteMemo}
      >
        연락 메모에 적어 두기
      </button>
    </section>
  )
}

export default HighMemoCard
