import type { Recommendation } from '@/types/catalog';
import type { Lang } from './highlight';
import { pretty, safeParse } from './payloads';

/**
 * Synthesizes the full Custom Lightning Type "package" for a CLT — the same set
 * of artifacts a real Agentforce Lightning Type compiles to (Lightning Type
 * bundle, LWC, Apex DTO, GenAiFunction action wrapper). Generated client-side
 * from the catalogue row, so it needs no build step and covers every CLT.
 *
 * Fidelity: the LT schema/renderer, the Apex DTO, the LWC .js-meta.xml, and the
 * action wrapper are DETERMINISTIC and match the deployed shape in the
 * `clt-library` package. The LWC .html/.js/.css are REPRESENTATIVE boilerplate
 * (the deployed component ships the full hand-built design).
 */

/** CLTs authored in the playground that do NOT yet have a deployed clt-library
 *  bundle. Keep in sync as bundles are authored. */
const UNDEPLOYED = new Set<string>([
  'asaInsuranceIdCard',
  'asaLegalPracticeAreas',
  'asaLegalCaseEvaluation',
  'asaLegalAttorneyMatch',
  'asaLegalConsultScheduler',
  'asaTravelSeatMap',
  'asaTravelFlightStatus',
  'asaTravelBoardingPass',
  'asaTravelRoomSelector',
]);

/** Apex DTO class name, derived generically from the CLT api name
 *  (asaMfgQuoteBuilder → AsaMfgQuoteBuilderData, ecwForecast → EcwForecastData). */
export function apexClassName(cltApiName: string): string {
  const name = cltApiName || '';
  const prefix = /^ecw/i.test(name) ? 'Ecw' : 'Asa';
  const bare = name.replace(/^(asa|ecw)/i, '');
  return prefix + bare.charAt(0).toUpperCase() + bare.slice(1) + 'Data';
}

/** Bundle name PascalCased for the LWC class (asaMfgQuoteBuilder → AsaMfgQuoteBuilder). */
function pascal(cltApiName: string): string {
  return (cltApiName || '').charAt(0).toUpperCase() + (cltApiName || '').slice(1);
}

function xmlEscape(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export type CltFile = { key: string; label: string; path: string; content: string; lang: Lang };
export type CltArtifacts = {
  cltApiName: string;
  apexClass: string;
  dtoField: string;
  isDeployed: boolean;
  files: CltFile[];
  actionWrapper: { masterLabel: string; actionDescription: string; inputDescription: string };
};

/** Build the full artifact set for a catalogue recommendation. */
export function generateCltArtifacts(rec: Recommendation): CltArtifacts {
  const clt = rec.cltApiName;
  const dto = rec.dtoFieldName;
  const apex = apexClassName(clt);
  const label = rec.label || clt;
  const description = rec.description || `Custom Lightning Type renderer for ${label}.`;
  const cls = pascal(clt);

  const payloadObj = safeParse<Record<string, unknown>>(rec.defaultPayloadJson) ?? {};
  const payloadPretty = pretty(payloadObj);
  const topKeys = Object.keys(payloadObj).slice(0, 6);

  // ── Lightning Type bundle ────────────────────────────────────────────────
  const schema = pretty({
    title: label,
    description,
    'lightning:type': `@apexClassType/c__${apex}`,
  });
  const renderer = pretty({ renderer: { componentOverrides: { $: { definition: `c/${clt}` } } } });

  // ── Apex DTO (deterministic — matches the deployed class) ─────────────────
  const apexSrc = `@JsonAccess(serializable='always' deserializable='always')
global class ${apex} {

    @AuraEnabled
    global String ${dto};

    global ${apex}(String ${dto}) {
        this.${dto} = ${dto};
    }

    global ${apex}() {
        this.${dto} = '';
    }
}
`;

  // ── LWC .js-meta.xml (deterministic — matches the deployed targets) ───────
  const jsMeta = `<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>67.0</apiVersion>
    <isExposed>true</isExposed>
    <masterLabel>${xmlEscape(label)}</masterLabel>
    <description>${xmlEscape(description)}</description>
    <targets>
        <target>lightning__AgentforceOutput</target>
        <target>lightningSnapin__ChatMessage</target>
    </targets>
    <targetConfigs>
        <targetConfig targets="lightning__AgentforceOutput">
            <sourceType name="c__${clt}"/>
        </targetConfig>
    </targetConfigs>
</LightningComponentBundle>
`;

  // ── LWC controller (representative) ───────────────────────────────────────
  const js = `import { LightningElement, api } from 'lwc';

/**
 * ${label}
 * Renders the c__${clt} Lightning Type. Agentforce passes the typed value; the
 * single JSON-string field (${dto}) is parsed and rendered by the template.
 */
export default class ${cls} extends LightningElement {
    @api ${dto};

    get data() {
        try {
            return JSON.parse(this.${dto} || '{}');
        } catch (e) {
            return {};
        }
    }
${topKeys.map((k) => `    get ${k}() { return this.data?.${k}; }`).join('\n')}
}
`;

  // ── LWC template (representative) ─────────────────────────────────────────
  const html = `<template>
    <!-- Representative markup — the deployed component ships the full ${label} card. -->
    <article class="asa-card">
        <template lwc:if={data.title}>
            <h2 class="asa-card__title">{data.title}</h2>
        </template>
${topKeys
  .filter((k) => k !== 'title')
  .map((k) => `        <div class="asa-card__row" data-field="${k}"><!-- {${k}} --></div>`)
  .join('\n')}
        <template lwc:if={data.submitText}>
            <button class="asa-card__cta" onclick={handleSubmit}>{data.submitText}</button>
        </template>
    </article>
</template>
`;

  // ── LWC styles (representative) ───────────────────────────────────────────
  const css = `:host {
    display: block;
}
/* Representative styles — the deployed component ships the full design system. */
.asa-card {
    border: 1px solid var(--slds-g-color-border-base-1, #e5e5e5);
    border-radius: 12px;
    padding: 1rem;
    background: var(--slds-g-color-neutral-base-100, #fff);
}
.asa-card__title {
    font-size: 1rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
}
.asa-card__cta {
    width: 100%;
    min-height: 2.75rem;
    border: 0;
    border-radius: 0.5rem;
    color: #fff;
    background: var(--slds-g-color-brand-base-50, #0b5cab);
    cursor: pointer;
}
`;

  // ── GenAiFunction action wrapper (the "Action Wrapper") ───────────────────
  const actionDescription = description;
  const inputDescription = payloadPretty;

  const files: CltFile[] = [
    { key: 'input', label: 'Input', path: `Details · agent input (${dto})`, content: payloadPretty, lang: 'json' },
    { key: 'lt', label: 'LT', path: `lightningTypes/${clt}/schema.json`, content: schema, lang: 'json' },
    { key: 'renderer', label: 'Renderer', path: `lightningTypes/${clt}/lightningDesktopGenAi/renderer.json`, content: renderer, lang: 'json' },
    { key: 'apex', label: 'Apex', path: `classes/${apex}.cls`, content: apexSrc, lang: 'apex' },
    { key: 'html', label: 'HTML', path: `lwc/${clt}/${clt}.html`, content: html, lang: 'xml' },
    { key: 'js', label: 'JS', path: `lwc/${clt}/${clt}.js`, content: js, lang: 'js' },
    { key: 'css', label: 'CSS', path: `lwc/${clt}/${clt}.css`, content: css, lang: 'css' },
    { key: 'xml', label: 'XML', path: `lwc/${clt}/${clt}.js-meta.xml`, content: jsMeta, lang: 'xml' },
  ];

  return {
    cltApiName: clt,
    apexClass: apex,
    dtoField: dto,
    isDeployed: !UNDEPLOYED.has(clt),
    files,
    actionWrapper: { masterLabel: label, actionDescription, inputDescription },
  };
}
