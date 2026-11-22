import type { WidgetDef } from './types';
import { EcwOnboardingCard, ONBOARDING_TEST } from '@/employee/cards/EcwOnboardingCard';
import { structureFromPayload } from '@/employee/cardData';

/** EcwOnboardingCard — HR · Onboarding. */
export const ecwOnboardingDef: WidgetDef = {
  kind: 'ecwOnboardingJSON',
  dtoField: 'ecwOnboardingJSON',
  label: 'Agentforce Coworker · HR · Onboarding',
  defaults: ONBOARDING_TEST,
  structure: structureFromPayload(ONBOARDING_TEST as unknown as Record<string, unknown>),
  Preview: EcwOnboardingCard,
};
