import type { WidgetDef } from './types';
import { EcwOpenRolesCard, OPEN_ROLES_TEST } from '@/employee/cards/EcwOpenRolesCard';
import { structureFromPayload } from '@/employee/cardData';

/** EcwOpenRolesCard — HR · Open roles. */
export const ecwOpenRolesDef: WidgetDef = {
  kind: 'ecwOpenRolesJSON',
  dtoField: 'ecwOpenRolesJSON',
  label: 'Agentforce Coworker · HR · Open roles',
  defaults: OPEN_ROLES_TEST,
  structure: structureFromPayload(OPEN_ROLES_TEST as unknown as Record<string, unknown>),
  Preview: EcwOpenRolesCard,
};
