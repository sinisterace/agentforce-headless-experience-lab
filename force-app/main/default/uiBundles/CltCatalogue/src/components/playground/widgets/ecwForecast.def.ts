import type { WidgetDef } from './types';
import { EcwForecastCard, FORECAST_TEST } from '@/employee/cards/EcwForecastCard';
import { structureFromPayload } from '@/employee/cardData';

/** ecwForecast — Sales · forecast coverage (coverage bar). */
export const ecwForecastDef: WidgetDef = {
  kind: 'ecwForecastJSON',
  dtoField: 'ecwForecastJSON',
  label: 'Agentforce Coworker · Sales · Forecast',
  defaults: FORECAST_TEST,
  structure: structureFromPayload(FORECAST_TEST as unknown as Record<string, unknown>),
  Preview: EcwForecastCard,
};
