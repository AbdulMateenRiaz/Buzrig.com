import { CheckCircle, XCircle, Minus } from 'lucide-react'

const rows = [
  { feature: 'Testing frequency', buzrig: 'Continuous (24/7)', pentest: 'Annual', scanner: 'Scheduled' },
  { feature: 'Attack-chain reasoning', buzrig: true, pentest: true, scanner: false },
  { feature: 'Business logic testing', buzrig: true, pentest: true, scanner: false },
  { feature: 'Verified proof-of-concept', buzrig: true, pentest: true, scanner: false },
  { feature: 'Auto-generated code fix', buzrig: true, pentest: false, scanner: false },
  { feature: 'Pull request with remediation', buzrig: true, pentest: false, scanner: false },
  { feature: 'Mean time to fix', buzrig: '2.3 hours', pentest: '3–6 months', scanner: 'N/A' },
  { feature: 'False positive rate', buzrig: '<0.1%', pentest: '<1%', scanner: '30–60%' },
  { feature: 'Cost per year', buzrig: '$24K–90K', pentest: '$15–50K × 1', scanner: '$5–20K' },
  { feature: 'Compliance reporting', buzrig: true, pentest: 'partial', scanner: 'partial' },
]

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) return <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
  if (value === false) return <XCircle className="h-4 w-4 text-surface-300 mx-auto" />
  if (value === 'partial') return <Minus className="h-4 w-4 text-amber-400 mx-auto" />
  return <span className="text-sm text-surface-700">{value}</span>
}

export default function ComparisonTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-200">
            <th className="text-left py-3 pr-6 text-xs font-medium text-surface-500 uppercase tracking-wider w-1/4"></th>
            <th className="py-3 px-4 text-center">
              <div className="inline-flex flex-col items-center">
                <span className="text-xs font-bold text-brand-500 uppercase tracking-wider">Buzrig</span>
              </div>
            </th>
            <th className="py-3 px-4 text-center">
              <span className="text-xs font-medium text-surface-500 uppercase tracking-wider">Annual Pentest</span>
            </th>
            <th className="py-3 px-4 text-center">
              <span className="text-xs font-medium text-surface-500 uppercase tracking-wider">Vuln Scanner</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100">
          {rows.map((row) => (
            <tr key={row.feature} className="hover:bg-surface-50 transition-colors">
              <td className="py-3 pr-6 text-sm text-surface-700 font-medium">{row.feature}</td>
              <td className="py-3 px-4 text-center bg-brand-50/30"><CellValue value={row.buzrig} /></td>
              <td className="py-3 px-4 text-center"><CellValue value={row.pentest} /></td>
              <td className="py-3 px-4 text-center"><CellValue value={row.scanner} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
