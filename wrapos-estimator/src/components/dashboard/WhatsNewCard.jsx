export default function WhatsNewCard() {
  return (
    <div className="bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] rounded shadow-sm p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-[#7D93AE]">What's New</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2E8BF0]/10 text-[#2E8BF0] font-medium">v1.4.2</span>
      </div>

      {/* Released */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/20 text-green-400 font-medium">Shipped Apr 7</span>
        </div>
        <ul className="space-y-1.5">
          <li className="flex items-start gap-2 text-xs text-[#0F1923] dark:text-[#F8FAFE]">
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
            Fixed WrapMind sync issue on caliper-only PPF jobs
          </li>
          <li className="flex items-start gap-2 text-xs text-[#0F1923] dark:text-[#F8FAFE]">
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
            Faster vision analysis — 2.1s → 1.3s avg processing time
          </li>
          <li className="flex items-start gap-2 text-xs text-[#0F1923] dark:text-[#F8FAFE]">
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
            Improved material cost accuracy for 3M vs Xpel pricing
          </li>
        </ul>
      </div>

      <div className="border-t border-gray-200 dark:border-[#243348]" />

      {/* Coming soon */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2E8BF0]/10 text-[#2E8BF0] font-medium">Coming in v1.5</span>
        </div>
        <ul className="space-y-1.5">
          <li className="flex items-start gap-2 text-xs text-[#0F1923] dark:text-[#F8FAFE]">
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#2E8BF0] flex-shrink-0" />
            Fleet mode — batch estimates for multi-vehicle clients
          </li>
          <li className="flex items-start gap-2 text-xs text-[#0F1923] dark:text-[#F8FAFE]">
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#2E8BF0] flex-shrink-0" />
            SMS approval links — customers approve from their phone
          </li>
          <li className="flex items-start gap-2 text-xs text-[#0F1923] dark:text-[#F8FAFE]">
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#2E8BF0] flex-shrink-0" />
            Client-side negotiation — real-time line-item adjustments
          </li>
        </ul>
      </div>

      <div className="mt-auto pt-1 border-t border-gray-200 dark:border-[#243348]">
        <button className="text-xs text-[#2E8BF0] hover:text-[#1a7ae0] font-medium">
          View changelog →
        </button>
      </div>
    </div>
  );
}
