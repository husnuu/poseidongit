import bodyText from '@/components/yacht/yachtBodyTextMatch.module.css'

interface YachtShortSummaryProps {
  text?: string | null
}

export default function YachtShortSummary({ text }: YachtShortSummaryProps) {
  if (!text?.trim()) return null
  return <p className={`${bodyText.text} max-w-[977px] mb-8`}>{text.trim()}</p>
}
