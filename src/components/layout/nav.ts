import { ArrowLeftRight, MessageSquareText, type LucideIcon } from 'lucide-react'
import type { Section } from '@/hooks/useSection'

export interface NavItem {
  id: Section
  label: string
  blurb: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'swap', label: 'Swap Explorer', blurb: 'USDC to cirBTC on Arc', icon: ArrowLeftRight },
  { id: 'guestbook', label: 'Onchain Guestbook', blurb: 'Public messages onchain', icon: MessageSquareText },
]
