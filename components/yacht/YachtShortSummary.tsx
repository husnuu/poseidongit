import bodyText from '@/components/yacht/yachtBodyTextMatch.module.css'

interface YachtShortSummaryProps {
  text?: string | null
}

export default function YachtShortSummary({ text }: YachtShortSummaryProps) {
  if (!text?.trim()) return null
  return <p className={`${bodyText.text} mb-6 max-w-[977px] sm:mb-8`}>{text.trim()}</p>
}
