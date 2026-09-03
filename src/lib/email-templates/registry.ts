import type { ComponentType } from 'react'
import { template as lembreteCobranca } from './lembrete-cobranca'
import { template as cobrancaAtrasada } from './cobranca-atrasada'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'lembrete-cobranca': lembreteCobranca,
  'cobranca-atrasada': cobrancaAtrasada,
}
