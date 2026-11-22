import type { WidgetDef } from './types';
import { EcwPerformanceMatrixCard, PERFORMANCE_MATRIX_TEST } from '@/employee/cards/EcwPerformanceMatrixCard';
import { structureFromPayload } from '@/employee/cardData';

/** EcwPerformanceMatrixCard — Marketing · Performance matrix. */
export const ecwPerformanceMatrixDef: WidgetDef = {
  kind: 'ecwPerformanceMatrixJSON',
  dtoField: 'ecwPerformanceMatrixJSON',
  label: 'Agentforce Coworker · Marketing · Performance matrix',
  defaults: PERFORMANCE_MATRIX_TEST,
  structure: structureFromPayload(PERFORMANCE_MATRIX_TEST as unknown as Record<string, unknown>),
  Preview: EcwPerformanceMatrixCard,
};
