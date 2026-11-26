import LegalTable from '@/components/legal/LegalTable'
import { TRANSFER_RECIPIENTS } from '@/constants/legal'

// Figma N-02 제6조 · N-05 국외 이전 받는 곳마다 표 하나
function TransferTables() {
  return (
    <div className="flex w-full flex-col gap-3">
      {TRANSFER_RECIPIENTS.map(({ name, purpose, rows }) => (
        <LegalTable key={name} title={name} caption={purpose} rows={rows} />
      ))}
    </div>
  )
}

export default TransferTables
