import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bot,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  CodeXml,
  ExternalLink,
  Globe2,
  HeartPulse,
  Layers3,
  LifeBuoy,
  LoaderCircle,
  Monitor,
  Moon,
  PackageSearch,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Workflow,
} from 'lucide-react';
import agentforceLogo from '@/assets/agentforce-logo.png';
import storySparkle from '@/assets/story-sparkle.png';
import agentforceFront from '@/assets/brand/agentforce-front.png';
import { deployAgent, fetchCatalog, saveProfile, scanCompany } from '@/api/catalogApi';
import type { CompanyProfile, DeployResponse, IndustryOption, PlanSection, Recommendation } from '@/types/catalog';
import { CompanyMark, capabilityIcon, hostnameOf, industryArtwork, industryIcon, initialsOf } from '@/components/shared';
import { derivePalette, sameHex } from '@/lib/palette';
import { CltPlayground } from '@/components/playground/CltPlayground';
import { ChannelViewer } from '@/components/channels/ChannelViewer';
import BorderGlow from '@/components/BorderGlow';
import Dock, { type DockItemData } from '@/components/Dock';

type Stage = 'welcome' | 'intake' | 'confirm' | 'building' | 'preview';
type Theme = 'dark' | 'light';
type Intake = { firstName: string; lastName: string; email: string; companyName: string; website: string; industry: string };

/**
 * Build steps mirror real work: the first three already ran during the scan;
 * the last two track the live save. (UI spec §6.)
 *
 * The icons/order/timing are fixed here; the copy is generated per company in
 * {@link buildStepCopy} so every line names the customer's own brand, site,
 * industry, and chosen experience — the build must feel bespoke, never like a
 * catalogue being handed out.
 */
const BUILD_STEP_ICONS = [Globe2, PackageSearch, Layers3, Workflow, Sparkles];
const BUILD_STEP_COUNT = BUILD_STEP_ICONS.length;
const FIRST_SAVE_STEP = 3;

function buildStepCopy(ctx: { company: string; hostname: string; industryLabel: string; experience: string }) {
  const industry = ctx.industryLabel.toLowerCase();
  return [
    { title: `Reading ${ctx.hostname}`, detail: `Finding the services and language ${ctx.company} customers see` },
    { title: `Learning the ${ctx.company} brand`, detail: 'Mapping your identity into accessible interface roles' },
    { title: `Tailoring your ${ctx.experience} experience`, detail: `Shaping a ${industry} experience around ${ctx.company}` },
    { title: `Saving the ${ctx.company} service profile`, detail: 'Writing your researched company data to the org' },
    { title: `Connecting your ${ctx.company} agent`, detail: 'Your agent reads this profile on the next request' },
  ];
}

function normalizeWebsiteInput(input: string) {
  let value = input.trim().replace(/\s+/g, '');
  if (/^https?\/\//i.test(value)) value = value.replace(/^(https?)\/\//i, '$1://');
  else if (/^https?:\/(?!\/)/i.test(value)) value = value.replace(/^(https?):\//i, '$1://');
  else if (/^https?:[^/]/i.test(value)) value = value.replace(/^(https?):/i, '$1://');
  return value;
}

export default function CatalogueApp() {
  const [stage, setStage] = useState<Stage>('welcome');
  const [theme, setTheme] = useState<Theme>('light');
  const [intake, setIntake] = useState<Intake>({ firstName: '', lastName: '', email: '', companyName: '', website: '', industry: '' });
  const [industries, setIndustries] = useState<IndustryOption[]>([]);
  const [recsByIndustry, setRecsByIndustry] = useState<Record<string, Recommendation[]>>({});
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedCltApiName, setSelectedCltApiName] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [catalogError, setCatalogError] = useState('');
  const [buildStep, setBuildStep] = useState(0);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [deployResult, setDeployResult] = useState<DeployResponse | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const previewHeading = useRef<HTMLHeadingElement>(null);

  // The chosen industry: facilitator override wins, then AI, then catalog default.
  const industry = intake.industry || profile?.industryKey || industries[0]?.key || '';
  const industryLabel = industries.find((i) => i.key === industry)?.label || 'Customer service';

  // Show only the CLTs catalogued for the selected industry (user decision:
  // each industry surfaces its own set — 4 for Financial Services, 3 for
  // Insurance, etc.). Prefer the catalogue rows loaded on mount; fall back to
  // whatever the scan surfaced (already scoped to this industry) if the
  // catalogue hasn't loaded yet.
  const activeRecs = useMemo(() => {
    const forIndustry = recsByIndustry[industry] ?? [];
    return forIndustry.length ? forIndustry : recommendations;
  }, [recsByIndustry, recommendations, industry]);
  const selectedRec = activeRecs.find((r) => r.cltApiName === selectedCltApiName) ?? activeRecs[0] ?? null;

  const companyName = profile?.companyName || intake.companyName || 'Your company';
  const initials = initialsOf(companyName);
  const appStyle = useMemo(
    () => ({ '--customer-accent': profile?.accentColor || '#0b5cab' }) as React.CSSProperties,
    [profile?.accentColor]
  );

  useEffect(() => {
    let active = true;
    fetchCatalog()
      .then((catalog) => {
        if (!active) return;
        setIndustries(catalog.industries);
        setRecsByIndustry(catalog.recommendationsByIndustry);
      })
      .catch(() => active && setCatalogError('The CLT catalogue could not be loaded from this org.'));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (stage === 'preview') window.setTimeout(() => previewHeading.current?.focus(), 200);
  }, [stage]);

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  // Keep a valid CLT selected as the recommendation set changes.
  useEffect(() => {
    if (activeRecs.length && !activeRecs.some((r) => r.cltApiName === selectedCltApiName)) {
      setSelectedCltApiName(activeRecs[0].cltApiName);
    }
  }, [activeRecs, selectedCltApiName]);

  async function analyzeCompany(event: FormEvent) {
    event.preventDefault();
    setScanning(true);
    setScanMessage('');
    try {
      const { profile: scanned, recommendations: recs } = await scanCompany({
        companyName: intake.companyName,
        website: intake.website,
        industry: intake.industry || undefined,
      });
      // accentColor is the brand's real primary color, resolved server-side by the
      // scan (web-retriever prompt template, with a knowledge-only fallback) and
      // used verbatim to seed the palette. It's native to the platform — no logo
      // pixel-reading, which the browser can't do cross-origin without the host's
      // CORS cooperation anyway.
      setProfile(intake.industry ? { ...scanned, industryKey: intake.industry } : scanned);
      setRecommendations(recs);
      if (scanned.source === 'fallback') {
        setScanMessage('The website could not be read, so we prepared a reliable industry starter instead.');
      }
      setStage('confirm');
    } catch (error) {
      setScanMessage(error instanceof Error && error.message ? error.message : 'The live scan is unavailable. Check the details and try again.');
    } finally {
      setScanning(false);
    }
  }

  async function buildExperience() {
    if (!profile) return;
    setStage('building');
    setBuildStep(0);
    setScanMessage('');

    // Walk visibly through every build step in real time. The real save runs
    // concurrently; we only reach the preview once BOTH the staged walkthrough
    // and the save have finished, so the progress never lies about the work.
    const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
    const walkthrough = (async () => {
      for (let step = 1; step < BUILD_STEP_COUNT; step += 1) {
        await wait(step < FIRST_SAVE_STEP ? 1400 : 1900);
        setBuildStep(step);
      }
    })();

    const save = saveProfile({
      firstName: intake.firstName,
      lastName: intake.lastName,
      email: intake.email,
      companyName: profile.companyName,
      website: profile.website,
      industryKey: industry,
      summary: profile.summary,
      planNarrative: profile.planNarrative,
      accentColor: profile.accentColor,
      logoUrl: profile.logoUrl,
      source: profile.source,
      confidence: profile.confidence ?? null,
      signals: profile.signals,
    });

    // Deploy the FAQ Service Agent in parallel: generate + ground its knowledge on this
    // company and re-skin the chat widget to the brand. Non-fatal — if it fails the CLT
    // preview still renders; we surface the outcome on the preview screen.
    setDeployResult(null);
    setDeployError(null);
    const deploy = deployAgent({
      companyName: profile.companyName,
      website: profile.website,
      industryKey: industry,
      summary: profile.summary,
      planNarrative: profile.planNarrative,
      accentColor: profile.accentColor,
      logoUrl: profile.logoUrl,
      signals: profile.signals,
    })
      .then((result) => setDeployResult(result))
      .catch((error) =>
        setDeployError(error instanceof Error && error.message ? error.message : 'The FAQ agent could not be deployed.')
      );

    try {
      const [response] = await Promise.all([save, walkthrough, deploy]);
      setSavedName(response.id);
      setBuildStep(BUILD_STEP_COUNT - 1);
      await wait(700);
      setStage('preview');
    } catch (error) {
      setScanMessage(error instanceof Error && error.message ? error.message : 'The experience could not be prepared in this org.');
      setStage('confirm');
    }
  }

  function restart() {
    setStage('welcome');
    setIntake({ firstName: '', lastName: '', email: '', companyName: '', website: '', industry: '' });
    setProfile(null);
    setRecommendations([]);
    setSelectedCltApiName('');
    setScanMessage('');
    setBuildStep(0);
    setSavedName(null);
    setDeployResult(null);
    setDeployError(null);
  }

  const journeyPhase = stage === 'preview' ? 'preview' : stage === 'building' ? 'build' : 'company';

  // Header phase chips double as navigation so the journey is reversible.
  // Company → the company step (configurator if a profile exists, else intake).
  // Preview → jump straight to the preview if it's already built, otherwise
  // build it now. Build stays a status-only indicator (it's a transient phase).
  const goCompany = () => setStage(profile ? 'confirm' : 'intake');
  const goPreview = () => {
    if (savedName) setStage('preview');
    else if (profile) buildExperience();
  };
  const canPreview = !!profile || !!savedName;
  const dockItems: DockItemData[] = [
    {
      icon: <Globe2 aria-hidden="true" />,
      label: 'Company',
      onClick: goCompany,
      disabled: stage === 'building',
      active: journeyPhase === 'company',
    },
    {
      icon: <Sparkles aria-hidden="true" />,
      label: 'Build',
      onClick: () => undefined,
      disabled: true,
      active: journeyPhase === 'build',
    },
    {
      icon: <Monitor aria-hidden="true" />,
      label: 'Preview',
      onClick: goPreview,
      disabled: !canPreview || stage === 'building',
      active: journeyPhase === 'preview',
    },
  ];

  return (
    <div className={`activation-app theme-${theme}`} style={appStyle}>
      <a className="skip-link" href="#main">Skip to main content</a>
      <header className="app-header">
        <button className="brand-lockup" type="button" onClick={restart} aria-label="Restart experience">
          <img className="brand-mark" src={agentforceLogo} alt="" aria-hidden="true" />
          <span>Custom Agentforce Interfaces</span>
        </button>
        <div className="header-dock-shell">
          <BorderGlow
            className="header-dock-glow"
            edgeSensitivity={18}
            glowColor="205 92 66"
            backgroundColor="rgba(247,251,255,.62)"
            borderRadius={18}
            glowRadius={24}
            glowIntensity={0.72}
            coneSpread={22}
            colors={['#38cfe1', '#5876e2', '#b94bc0']}
            fillOpacity={0.14}
            animated={stage === 'welcome'}
          >
            <Dock
              items={dockItems}
              className="header-dock"
              distance={112}
              panelHeight={48}
              baseItemSize={36}
              baseItemWidth={96}
              dockHeight={50}
              magnification={41}
              magnificationWidth={108}
              labelMode="inline"
              spring={{ mass: 0.12, stiffness: 220, damping: 17 }}
              ariaLabel={`Experience phases; current phase: ${journeyPhase}`}
            />
          </BorderGlow>
        </div>
        <div className="header-meta">
          <i className="header-live-dot" aria-hidden="true" />
          <span>CLT catalogue lab</span>
          <BorderGlow
            className="theme-toggle-glow"
            edgeSensitivity={16}
            glowColor="205 90 67"
            backgroundColor="rgba(247,251,255,.6)"
            borderRadius={12}
            glowRadius={16}
            glowIntensity={0.58}
            coneSpread={20}
            colors={['#38cfe1', '#6078e4', '#bb5cc6']}
            fillOpacity={0.12}
          >
            <button
              className="theme-toggle"
              type="button"
              onClick={() => setTheme((c) => (c === 'dark' ? 'light' : 'dark'))}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-pressed={theme === 'light'}
            >
              <span className="theme-toggle-track" aria-hidden="true"><Sun /><Moon /><i /></span>
            </button>
          </BorderGlow>
        </div>
      </header>

      <main id="main" className={`stage stage-${stage}`}>
        {catalogError && <p className="mock-ribbon" role="alert"><AlertTriangle aria-hidden="true" /> {catalogError}</p>}

        {stage === 'welcome' && <Welcome onContinue={() => setStage('intake')} />}

        {stage === 'intake' && (
          <IntakeScreen intake={intake} setIntake={setIntake} scanning={scanning} industries={industries} onSubmit={analyzeCompany} onBack={() => setStage('welcome')} scanMessage={scanMessage} />
        )}

        {stage === 'confirm' && profile && (
          <ConfirmScreen
            profile={profile}
            industry={industry}
            initials={initials}
            scanMessage={scanMessage}
            industries={industries}
            recommendations={activeRecs}
            selectedRec={selectedRec}
            onSelectClt={setSelectedCltApiName}
            onIndustry={(value) => {
              setIntake((c) => ({ ...c, industry: value }));
              setProfile((c) => (c ? { ...c, industryKey: value } : c));
            }}
            onBack={() => setStage('intake')}
            onContinue={buildExperience}
            onPickAccent={(hex) => setProfile((c) => (c ? { ...c, accentColor: hex } : c))}
          />
        )}

        {stage === 'building' && profile && selectedRec && (
          <BuildingScreen profile={profile} buildStep={buildStep} industryLabel={industryLabel} initials={initials} selectedRec={selectedRec} />
        )}

        {stage === 'preview' && profile && selectedRec && (
          <PreviewScreen
            profile={profile}
            initials={initials}
            industryLabel={industryLabel}
            selectedRec={selectedRec}
            savedName={savedName}
            deployResult={deployResult}
            deployError={deployError}
            headingRef={previewHeading}
            onBack={() => setStage('confirm')}
            onRestart={restart}
          />
        )}
      </main>
    </div>
  );
}

function Welcome({ onContinue }: { onContinue: () => void }) {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    let resizeObserver: ResizeObserver | undefined;
    let mutationObserver: MutationObserver | undefined;
    const syncAvailableHeight = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const page = pageRef.current;
        if (!page) return;
        const top = Math.max(0, page.getBoundingClientRect().top);
        const viewport = window.visualViewport;
        const viewportBottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
        page.style.setProperty('--welcome-available-height', `${Math.max(0, Math.floor(viewportBottom - top))}px`);
      });
    };
    syncAvailableHeight();
    if (pageRef.current?.parentElement) {
      resizeObserver = new ResizeObserver(syncAvailableHeight);
      resizeObserver.observe(pageRef.current.parentElement);
      mutationObserver = new MutationObserver(syncAvailableHeight);
      mutationObserver.observe(pageRef.current.parentElement, { childList: true });
    }
    window.addEventListener('resize', syncAvailableHeight);
    window.visualViewport?.addEventListener('resize', syncAvailableHeight);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener('resize', syncAvailableHeight);
      window.visualViewport?.removeEventListener('resize', syncAvailableHeight);
    };
  }, []);

  return (
    <div className="sa-page" ref={pageRef}>
      <div className="sa-welcome-layout">
        <section className="sa-welcome-copy" aria-labelledby="welcome-title">
          <h1 id="welcome-title">Design custom Agentforce interfaces for your industry</h1>
          <p className="sa-welcome-lede">Custom Lightning Types let you design rich, interactive experiences for Agentforce. Now let&rsquo;s explore the most effective patterns for your company.</p>
          <button className="sa-primary-action" type="button" onClick={onContinue}>Start designing <ArrowRight aria-hidden="true" /></button>
          <div className="sa-welcome-proof" aria-label="What will be created">
            <span><Globe2 aria-hidden="true" /> Website context</span>
            <span><Bot aria-hidden="true" /> Service agent</span>
            <span><Layers3 aria-hidden="true" /> Adaptive service experience</span>
          </div>
          <p className="sa-privacy-note">We&rsquo;ll only read public content from your company website.</p>
        </section>
        <SaExperiencePanel variant="welcome" />
      </div>
    </div>
  );
}

/**
 * Shared V1 "experience" collage — a static, inert mockup (aria-hidden) of the
 * Agentforce agent composing an experience: floating glass Custom Lightning Type
 * cards around the Agentforce mark, over a read → shape → render stepper. Reused
 * on the welcome and company-form stages. Presentation only; no app behavior.
 */
function SaExperiencePanel({ variant, showFlow = true }: { variant: 'welcome' | 'intake'; showFlow?: boolean }) {
  return (
    <aside className={`sa-build-ribbon sa-ribbon-${variant}`} aria-label="Experience overview">
      <div className="sa-experience-field" aria-hidden="true">
        <div className="sa-field-grid" />
        <article className="sa-field-card sa-field-services">
          <header><HeartPulse aria-hidden="true" /><span><strong>Choose a service</strong><small>Matched to your business</small></span></header>
          <div className="sa-field-choice selected"><span><i>01</i>Medical care</span><Check aria-hidden="true" /></div>
          <div className="sa-field-choice"><span><i>02</i>Wellness consult</span><ChevronRight aria-hidden="true" /></div>
        </article>
        <article className="sa-field-card sa-field-appointment">
          <header><CalendarDays aria-hidden="true" /><span><strong>Book a consultation</strong><small>Live availability</small></span></header>
          <div className="sa-field-slot selected"><span><strong>Tomorrow</strong><small>Aug 14</small></span><b>10:30 AM</b><Check aria-hidden="true" /></div>
          <div className="sa-field-slot"><span><strong>Thursday</strong><small>Aug 15</small></span><b>1:00 PM</b><i /></div>
          <span className="sa-field-continue">Continue <ArrowRight aria-hidden="true" /></span>
        </article>
        <article className="sa-field-card sa-field-products">
          <header><ShoppingBag aria-hidden="true" /><span><strong>Recommended for you</strong><small>Personalized collection</small></span></header>
          <div className="sa-field-products-grid">
            <span><i /><strong>Everyday carry</strong><small>$48</small></span>
            <span><i /><strong>Travel edit</strong><small>$72</small></span>
          </div>
        </article>
        <article className="sa-field-card sa-field-support">
          <header><LifeBuoy aria-hidden="true" /><span><strong>Support request</strong><small>Specialist routing</small></span></header>
          <div className="sa-field-status"><span><CheckCircle2 aria-hidden="true" /></span><p><strong>Case understood</strong><small>Billing specialist joined</small></p></div>
        </article>
        <div className="sa-field-payload"><CodeXml aria-hidden="true" /><span><strong>CLT payload ready</strong><small>4 surfaces mapped</small></span><i /></div>
        <div className="sa-field-agent-core">
          <span className="sa-field-agent-halo" />
          <img src={agentforceFront} alt="" />
          <div><Sparkles aria-hidden="true" /><span><strong>Agentforce</strong><small>Composing your experience</small></span></div>
        </div>
        <div className="sa-field-vignette" />
      </div>
      {showFlow && (
        <div className="sa-ribbon-flow">
          <div><span>01</span><strong>Read your website</strong></div>
          <ChevronRight aria-hidden="true" />
          <div><span>02</span><strong>Shape the agent</strong></div>
          <ChevronRight aria-hidden="true" />
          <div><span>03</span><strong>Render the experience</strong></div>
        </div>
      )}
    </aside>
  );
}

function IntakeScreen({
  intake,
  setIntake,
  scanning,
  industries,
  onSubmit,
  onBack,
  scanMessage,
}: {
  intake: Intake;
  setIntake: React.Dispatch<React.SetStateAction<Intake>>;
  scanning: boolean;
  industries: IndustryOption[];
  onSubmit: (event: FormEvent) => void;
  onBack: () => void;
  scanMessage: string;
}) {
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(intake.email.trim());
  const valid =
    intake.firstName.trim().length > 0 &&
    intake.lastName.trim().length > 0 &&
    emailValid &&
    intake.companyName.trim().length > 1 &&
    intake.website.trim().length > 3;
  return (
    <div className="sa-intake-page">
      <div className="sa-intake-layout">
        <section className="sa-form-section" aria-labelledby="intake-title">
          <button className="sa-back-action" type="button" onClick={onBack}><ArrowLeft aria-hidden="true" /> Back</button>
          <div className="sa-section-number">01</div>
          <h1 id="intake-title">Tell us about your company.</h1>
          <p>We'll use these details to generate a personalized plan, tailor an interactive CLT playground to your industry, and preview a branded agent experience for your customers.</p>
          {scanMessage && <div className="fallback-notice" role="status">{scanMessage}</div>}
          <form onSubmit={onSubmit} className="sa-company-form">
            <div className="sa-field-row">
              <label>
                First name
                <input autoFocus value={intake.firstName} onChange={(e) => setIntake((c) => ({ ...c, firstName: e.target.value }))} placeholder="Alex" autoComplete="given-name" />
              </label>
              <label>
                Last name
                <input value={intake.lastName} onChange={(e) => setIntake((c) => ({ ...c, lastName: e.target.value }))} placeholder="Rivera" autoComplete="family-name" />
              </label>
            </div>
            <label>
              Work email
              <input type="email" value={intake.email} onChange={(e) => setIntake((c) => ({ ...c, email: e.target.value }))} placeholder="alex@example.com" inputMode="email" autoComplete="email" />
            </label>
            <label>
              Company name
              <input value={intake.companyName} onChange={(e) => setIntake((c) => ({ ...c, companyName: e.target.value }))} placeholder="Northern Trail Outfitters" autoComplete="organization" />
            </label>
            <label>
              Company website
              <span className="sa-input-with-icon">
                <Globe2 aria-hidden="true" />
                <input value={intake.website} onChange={(e) => setIntake((c) => ({ ...c, website: e.target.value }))} onBlur={(e) => setIntake((c) => ({ ...c, website: normalizeWebsiteInput(e.target.value) }))} placeholder="example.com" inputMode="url" autoComplete="url" />
              </span>
            </label>
            <label>
              Industry <span className="sa-optional-label">Optional</span>
              <select value={intake.industry} onChange={(e) => setIntake((c) => ({ ...c, industry: e.target.value }))}>
                <option value="">Let Agentforce infer it</option>
                {industries.map((i) => <option value={i.key} key={i.key}>{i.label}</option>)}
              </select>
            </label>
            <button className="sa-primary-action sa-submit-action" type="submit" disabled={!valid || scanning}>
              {scanning ? <><LoaderCircle className="spin" aria-hidden="true" /> Reading website</> : <>Continue <ArrowRight aria-hidden="true" /></>}
            </button>
          </form>
        </section>
        <SaExperiencePanel variant="intake" showFlow={false} />
      </div>
    </div>
  );
}

function ConfirmScreen({
  profile,
  industry,
  initials,
  scanMessage,
  industries,
  recommendations,
  selectedRec,
  onSelectClt,
  onIndustry,
  onBack,
  onContinue,
  onPickAccent,
}: {
  profile: CompanyProfile;
  industry: string;
  initials: string;
  scanMessage: string;
  industries: IndustryOption[];
  recommendations: Recommendation[];
  selectedRec: Recommendation | null;
  onSelectClt: (apiName: string) => void;
  onIndustry: (key: string) => void;
  onBack: () => void;
  onContinue: () => void;
  onPickAccent: (hex: string) => void;
}) {
  const succeeded = profile.source === 'website';
  // Palette is derived from the ORIGINAL scanned accent, captured once on mount,
  // so the swatches stay stable even as the picked accent (profile.accentColor)
  // changes. ConfirmScreen unmounts when leaving the confirm stage, so a new scan
  // recaptures the base.
  const [baseAccent] = useState(() => profile.accentColor);
  const palette = useMemo(() => derivePalette(baseAccent), [baseAccent]);
  return (
    <div className="content-shell confirm-layout">
      <button className="back-action" type="button" onClick={onBack}><ArrowLeft aria-hidden="true" /> Back</button>
      <section className="confirm-copy" aria-labelledby="confirm-title">
        <div className="confirm-intro">
          <div className="section-number">02 · {succeeded ? 'PROFILE READY' : 'STARTER PROFILE READY'}</div>
          <h1 id="confirm-title">Here's your personalized starting point.</h1>
          <p>{succeeded ? 'We read your public website to tailor the plan below and recommend interactive experiences for your industry.' : 'We prepared an industry-aware plan and recommendations you can tailor before you preview them.'}</p>
          {scanMessage && <div className="fallback-notice" role="status">{scanMessage}</div>}
          <div className="extraction-proof">
            <span><ShieldCheck aria-hidden="true" /> {succeeded ? 'Public website verified' : 'Industry fallback active'}</span>
            <span><Sparkles aria-hidden="true" /> {profile.signals.length} {succeeded ? 'brand signals mapped' : 'starter signals prepared'}</span>
          </div>
        </div>

        <div className="profile-card" style={{ '--profile-accent': profile.accentColor } as React.CSSProperties}>
          <div className="profile-light" aria-hidden="true" />
          <div className="profile-card-top">
            <CompanyMark profile={profile} initials={initials} />
            <span className="source-label"><i /> {succeeded ? 'Live website profile' : 'Starter profile'}</span>
          </div>
          <div className="profile-main">
            <div className="profile-heading">
              <div>
                <h2>{profile.companyName}</h2>
                <a href={profile.website} target="_blank" rel="noreferrer">{hostnameOf(profile.website)} <ExternalLink aria-hidden="true" /></a>
              </div>
            </div>
            <p>{profile.summary}</p>
            <div className="signal-list" aria-label="Extracted signals">
              {profile.signals.map((signal) => <span key={signal}><Check aria-hidden="true" /> {signal}</span>)}
            </div>
            <div className="brand-palette" role="group" aria-label="Brand palette — choose the accent applied to your experiences">
              <span className="brand-palette-label">Brand palette</span>
              <div className="brand-swatches">
                {palette.map((sw) => {
                  const active = sameHex(sw.hex, profile.accentColor);
                  return (
                    <button
                      type="button"
                      key={sw.hex}
                      className={active ? 'brand-swatch is-active' : 'brand-swatch'}
                      style={{ '--sw': sw.hex } as React.CSSProperties}
                      aria-pressed={active}
                      aria-label={`${sw.name} ${sw.hex}${active ? ' (applied)' : ''}`}
                      title={`${sw.name} · ${sw.hex}`}
                      onClick={() => onPickAccent(sw.hex)}
                    >
                      {active && <Check aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <PlanBand plan={profile.plan} companyName={profile.companyName} succeeded={succeeded} />

      <section className="experience-configurator" aria-label="Experience starting point">
        <div className="configurator-heading">
          <span className="liquid-switch"><i /> AI selected</span>
        </div>
        <fieldset className="industry-fieldset">
          <legend className="sr-only">Experience starting point</legend>
          <div className="industry-options elastic-industry-toolbar">
            {industries.map((option) => {
              const Icon = industryIcon(option.key);
              const artwork = industryArtwork(option.key);
              const selected = industry === option.key;
              return (
                <button type="button" className={`${selected ? 'industry-option selected' : 'industry-option'} industry-${option.key}`} key={option.key} onClick={() => onIndustry(option.key)} aria-pressed={selected}>
                  <span className="industry-art" aria-hidden="true">
                    {artwork ? <img src={artwork} alt="" /> : <Icon />}
                    <i />
                  </span>
                  <span className="industry-card-copy"><strong>{option.label}</strong></span>
                  <span className="industry-card-state" aria-hidden="true">{selected ? <CheckCircle2 /> : <ArrowRight />}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="template-picker">
          {recommendations.length === 0 ? (
            <div className="template-empty" role="status">
              <PackageSearch aria-hidden="true" />
              <p><strong>No experiences catalogued yet.</strong><small>The catalogue set is coming soon.</small></p>
            </div>
          ) : (
            <>
              <div className="template-options">
                {recommendations.map((rec, index) => {
                  const Icon = capabilityIcon(rec.capabilityKey);
                  const selected = selectedRec?.cltApiName === rec.cltApiName;
                  return (
                    <button type="button" className={selected ? 'template-option selected' : 'template-option'} onClick={() => onSelectClt(rec.cltApiName)} aria-pressed={selected} key={rec.cltApiName}>
                      <span className="template-option-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                      <span className="template-option-icon" aria-hidden="true"><Icon /></span>
                      <span className="template-option-copy"><strong>{rec.label}</strong><small>{rec.description}</small></span>
                      <span className="template-option-state" aria-hidden="true">{selected ? <Check /> : <ArrowRight />}</span>
                    </button>
                  );
                })}
              </div>
              {selectedRec && <CltPlayground key={selectedRec.cltApiName} recommendation={selectedRec} accentColor={profile.accentColor} companyName={profile.companyName} />}
            </>
          )}
        </div>

        <div className="configurator-footer">
          <div className="selection-summary">
            {selectedRec && (() => { const Icon = capabilityIcon(selectedRec.capabilityKey); return <Icon aria-hidden="true" />; })()}
            <span><strong>{selectedRec?.label ?? 'Experience'}</strong><small>Interactive UI · personalized content · live in Agentforce</small></span>
          </div>
          <button className="primary-action" type="button" onClick={onContinue}>Build the experience <ArrowRight aria-hidden="true" /></button>
        </div>
      </section>
    </div>
  );
}

/** Always-present links to the core Custom Lightning Type documentation. */
const CLT_RESOURCES = [
  { label: 'Core concepts', href: 'https://developer.salesforce.com/docs/platform/lightning-types/guide/lightning-types-core.html' },
  { label: 'Get started', href: 'https://developer.salesforce.com/docs/platform/lightning-types/guide/lightning-types.html' },
  { label: 'UI configuration', href: 'https://developer.salesforce.com/docs/platform/lightning-types/guide/lightning-types-ui-config.html' },
  { label: 'Apex-based types', href: 'https://developer.salesforce.com/docs/platform/lightning-types/guide/lightning-types-apex.html' },
];

/**
 * The guided consultation plan — a full-width band a Salesforce employee walks the
 * customer through. Each section carries curated CLT/adoption content (always present),
 * plus an AI-enriched paragraph specific to the company when the website scan succeeded.
 * Sections are accordions so the plan can be scanned and collapsed. Resource pills to the
 * core CLT docs are always shown. The server always returns the full curated spine, so
 * this never renders empty.
 */
function PlanBand({
  plan,
  companyName,
  succeeded,
}: {
  plan: PlanSection[];
  companyName: string;
  succeeded: boolean;
}) {
  // First section open by default; the rest collapsed for scannability.
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries((plan ?? []).map((s, i) => [s.key, i === 0]))
  );
  if (!plan?.length) return null;
  const enrichedCount = plan.filter((s) => s.personalized).length;
  const allOpen = plan.every((s) => open[s.key]);
  const toggle = (key: string) => setOpen((o) => ({ ...o, [key]: !o[key] }));
  const setAll = (value: boolean) => setOpen(Object.fromEntries(plan.map((s) => [s.key, value])));

  return (
    <section className="plan-band" aria-labelledby="plan-band-title">
      <div className="plan-band-heading">
        <img className="plan-hero-icon" src={agentforceLogo} alt="" aria-hidden="true" />
        <div className="plan-band-copy">
          <span className="plan-kicker"><img src={storySparkle} alt="" aria-hidden="true" /> Agentic plan</span>
          <h2 id="plan-band-title">Walking {companyName} through interactive service experiences</h2>
          <p>
            {succeeded
              ? enrichedCount > 0
                ? `A guided walkthrough of Custom Lightning Types — personalized with ${enrichedCount} insight${enrichedCount === 1 ? '' : 's'} from your website.`
                : 'A guided walkthrough of Custom Lightning Types and why they drive AI service-agent adoption.'
              : 'A guided walkthrough of Custom Lightning Types and why they drive AI service-agent adoption.'}
          </p>
          <button type="button" className="plan-expand-all" onClick={() => setAll(!allOpen)}>
            {allOpen ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      </div>

      <TextVsCltContrast />

      <ol className="plan-sections">
        {plan.map((section, index) => {
          const isOpen = !!open[section.key];
          const panelId = `plan-panel-${section.key}`;
          return (
            <li className={`plan-section ${isOpen ? 'open' : ''}`} key={section.key}>
              <button
                type="button"
                className="plan-section-head"
                onClick={() => toggle(section.key)}
                aria-expanded={isOpen}
                aria-controls={panelId}
              >
                <span className="plan-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <h3>{section.title}</h3>
                {section.personalized && <span className="plan-enriched-dot" title="Personalized from your website"><Sparkles aria-hidden="true" /></span>}
                <ChevronDown className="plan-chevron" aria-hidden="true" />
              </button>
              {isOpen && (
                <div className="plan-section-body" id={panelId}>
                  <p className="plan-section-copy">{section.body}</p>
                  {section.personalized && (
                    <div className="plan-personalized">
                      <span className="plan-personalized-tag"><Sparkles aria-hidden="true" /> For {companyName}</span>
                      <p>{section.personalized}</p>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="plan-resources" aria-label="Custom Lightning Type resources">
        <span className="plan-resources-label">Learn more</span>
        {CLT_RESOURCES.map((r) => (
          <a className="plan-resource-pill" href={r.href} target="_blank" rel="noreferrer" key={r.href}>
            {r.label} <ExternalLink aria-hidden="true" />
          </a>
        ))}
      </div>
    </section>
  );
}

/** A compact side-by-side: a plain-text agent reply vs. the same answer as an interactive CLT. */
function TextVsCltContrast() {
  return (
    <div className="plan-contrast" aria-label="Plain text versus Custom Lightning Type">
      <div className="contrast-card contrast-text">
        <span className="contrast-tag">Typical agent · plain text</span>
        <div className="contrast-bubble">
          <p>Here are three appointment times: Tuesday 9:00 AM, Tuesday 2:00 PM, or Wednesday 11:00 AM. Please reply with the one you'd like and I'll book it.</p>
        </div>
        <small>The customer has to read, decide, and retype.</small>
      </div>
      <div className="contrast-arrow" aria-hidden="true"><ArrowRight /></div>
      <div className="contrast-card contrast-clt">
        <span className="contrast-tag"><Sparkles aria-hidden="true" /> With a Custom Lightning Type</span>
        <div className="contrast-bubble">
          <div className="contrast-slots">
            <button type="button" disabled>Tue 9:00 AM</button>
            <button type="button" className="chosen" disabled>Tue 2:00 PM</button>
            <button type="button" disabled>Wed 11:00 AM</button>
          </div>
        </div>
        <small>One tap. The choice flows straight back to the agent.</small>
      </div>
    </div>
  );
}

function BuildingScreen({
  profile,
  buildStep,
  industryLabel,
  initials,
  selectedRec,
}: {
  profile: CompanyProfile;
  buildStep: number;
  industryLabel: string;
  initials: string;
  selectedRec: Recommendation;
}) {
  const steps = buildStepCopy({
    company: profile.companyName,
    hostname: hostnameOf(profile.website),
    industryLabel,
    experience: selectedRec.label,
  });
  const progress = Math.round(((buildStep + 1) / BUILD_STEP_COUNT) * 100);
  const ActiveIcon = BUILD_STEP_ICONS[buildStep];
  const CltIcon = capabilityIcon(selectedRec.capabilityKey);
  const detail = steps[buildStep].detail;
  return (
    <div className="build-stage" aria-live="polite">
      <section className="build-heading">
        <div className="company-chip"><CompanyMark profile={profile} initials={initials} compact /> <span>{profile.companyName}</span></div>
        <h1>Agentforce is assembling your service experience.</h1>
        <p>{detail}</p>
      </section>
      <div className="build-canvas">
        <div className="build-orchestrator">
          <div className="orchestrator-topline"><span>Agent build</span><strong>{progress}%</strong></div>
          <div className="build-current-card">
            <div className="current-step-visual"><span className="current-step-orbit" /><ActiveIcon aria-hidden="true" /></div>
            <span>Step {buildStep + 1} of {BUILD_STEP_COUNT}</span>
            <h2>{steps[buildStep].title}</h2>
            <p>{detail}</p>
            <div className="scan-lines" aria-hidden="true"><i /><i /><i /></div>
          </div>
          <div className="elastic-build-dock" aria-label={`Build step ${buildStep + 1} of ${BUILD_STEP_COUNT}`}>
            {BUILD_STEP_ICONS.map((Icon, index) => {
              const state = index < buildStep ? 'complete' : index === buildStep ? 'active' : 'pending';
              return <span className={`dock-tool ${state}`} title={steps[index].title} key={index}>{state === 'complete' ? <Check aria-hidden="true" /> : <Icon aria-hidden="true" />}</span>;
            })}
          </div>
          <div className="orchestrator-status"><i /><span>{buildStep < BUILD_STEP_COUNT - 1 ? 'Working in the background' : 'Final checks in progress'}</span><b>{BUILD_STEP_COUNT - buildStep - 1} remaining</b></div>
        </div>
        <div className="assembly-visual">
          <div className="assembly-grid" aria-hidden="true" />
          <div className="assembly-live-label"><i /> Agentforce build runtime</div>
          <div className="assembly-diagram" aria-hidden="true">
            <div className={`assembly-card website-piece ${buildStep >= 0 ? 'online' : ''}`}><Globe2 /><span>{hostnameOf(profile.website)}</span></div>
            <div className="assembly-line"><i /></div>
            <div className={`assembly-agent ${buildStep >= 2 ? 'online' : ''}`}>
              <span className="agent-halo" /><img src={agentforceLogo} alt="" />
              <div><strong>Service Agent</strong><span>{industryLabel} specialist</span></div>
            </div>
            <div className="assembly-line"><i /></div>
            <div className={`assembly-card clt-piece ${buildStep >= 3 ? 'online' : ''}`}><CltIcon /><span>{selectedRec.label}</span></div>
          </div>
          <div className="build-console" aria-live="polite">
            <div><span>BUILD LOG</span><span>secure session</span></div>
            {steps.slice(0, buildStep + 1).map((step, index) => (
              <p key={index} className={index === buildStep ? 'current' : ''}>
                <CheckCircle2 aria-hidden="true" /><time>{String(index + 1).padStart(2, '0')}:0{index + 2}</time>{step.title}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewScreen({
  profile,
  initials,
  industryLabel,
  selectedRec,
  savedName,
  deployResult,
  deployError,
  headingRef,
  onBack,
  onRestart,
}: {
  profile: CompanyProfile;
  initials: string;
  industryLabel: string;
  selectedRec: Recommendation;
  savedName: string | null;
  deployResult: DeployResponse | null;
  deployError: string | null;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onBack: () => void;
  onRestart: () => void;
}) {
  const [previewMode, setPreviewMode] = useState<'experience' | 'code'>('experience');
  const CltIcon = capabilityIcon(selectedRec.capabilityKey);
  return (
    <div className="preview-stage">
      <button className="back-action" type="button" onClick={onBack}><ArrowLeft aria-hidden="true" /> Back to experiences</button>
      <div className="preview-topbar">
        <div>
          <p className="preview-kicker"><CheckCircle2 aria-hidden="true" /> Experience ready</p>
          <h1 ref={headingRef} tabIndex={-1}>{profile.companyName} Service Agent</h1>
        </div>
        <div className="preview-actions">
          <div className="preview-mode-switch" role="group" aria-label="Preview mode">
            <button type="button" className={previewMode === 'experience' ? 'active' : ''} onClick={() => setPreviewMode('experience')}><Monitor aria-hidden="true" /> Experience</button>
            <button type="button" className={previewMode === 'code' ? 'active' : ''} onClick={() => setPreviewMode('code')}><Code2 aria-hidden="true" /> CLT source</button>
          </div>
          <button className="secondary-action" type="button" onClick={onRestart}><RotateCcw aria-hidden="true" /> Start over</button>
        </div>
      </div>

      <div className="preview-workspace">
        <aside className="experience-blueprint" aria-label="Experience blueprint">
          <div className="blueprint-head">
            <CompanyMark profile={profile} initials={initials} />
            <div className="blueprint-company"><strong>{profile.companyName}</strong><span>{industryLabel}</span></div>
          </div>
          <div className="blueprint-facts">
            <div className="blueprint-fact">
              <span className="blueprint-fact-icon"><CltIcon aria-hidden="true" /></span>
              <div><dt>Experience</dt><dd>{selectedRec.label}</dd></div>
            </div>
            <div className="blueprint-fact">
              <span className="blueprint-fact-icon"><Layers3 aria-hidden="true" /></span>
              <div><dt>Capability</dt><dd>{selectedRec.capabilityKey}</dd></div>
            </div>
            <div className="blueprint-fact">
              <span className="blueprint-fact-icon"><Code2 aria-hidden="true" /></span>
              <div><dt>Custom Lightning Type</dt><dd className="blueprint-mono">c__{selectedRec.cltApiName}</dd></div>
            </div>
            <div className="blueprint-fact">
              <span className="blueprint-fact-icon"><ShieldCheck aria-hidden="true" /></span>
              <div><dt>Personalization</dt><dd>{profile.source === 'website' ? 'Website profile' : 'Industry starter'}</dd></div>
            </div>
            <div className="blueprint-fact">
              <span className="blueprint-fact-icon"><Workflow aria-hidden="true" /></span>
              <div><dt>Consultation</dt><dd className="blueprint-mono">{savedName ?? 'Not saved'}</dd></div>
            </div>
          </div>
          <p className="blueprint-note"><Sparkles aria-hidden="true" /> One CLT payload drives every client — switch channel tabs to see it render in each.</p>
          <AgentDeployPanel profile={profile} deployResult={deployResult} deployError={deployError} />
        </aside>

        {previewMode === 'code' ? (
          <CltCodeInspector recommendation={selectedRec} profile={profile} industryLabel={industryLabel} />
        ) : (
          <ChannelViewer recommendation={selectedRec} profile={profile} />
        )}
      </div>
    </div>
  );
}

/**
 * Preview-screen panel reporting the live FAQ Service Agent deployment: whether the
 * agent was grounded on this company's FAQ and whether the chat widget was re-skinned
 * to the brand. Non-blocking — if deploy failed the rest of the preview still works.
 */
function AgentDeployPanel({
  profile,
  deployResult,
  deployError,
}: {
  profile: CompanyProfile;
  deployResult: DeployResponse | null;
  deployError: string | null;
}) {
  if (deployError && !deployResult) {
    return (
      <div className="agent-deploy-panel is-error" role="status">
        <div className="agent-deploy-head"><AlertTriangle aria-hidden="true" /> <strong>FAQ agent not deployed</strong></div>
        <p>{deployError}</p>
        <small>Your interactive experiences above are unaffected.</small>
      </div>
    );
  }
  if (!deployResult) {
    return (
      <div className="agent-deploy-panel is-pending" role="status">
        <div className="agent-deploy-head"><LoaderCircle className="spin" aria-hidden="true" /> <strong>Deploying your FAQ agent…</strong></div>
      </div>
    );
  }
  return (
    <div className="agent-deploy-panel is-live" role="status" style={{ '--deploy-accent': profile.accentColor } as React.CSSProperties}>
      <div className="agent-deploy-head"><Bot aria-hidden="true" /> <strong>{profile.companyName} FAQ agent is live</strong></div>
      <ul className="agent-deploy-facts">
        <li>
          <CheckCircle2 aria-hidden="true" />
          <span>Grounded on {deployResult.faqCount} FAQ answer{deployResult.faqCount === 1 ? '' : 's'}{deployResult.faqIsFallback ? ' (industry starter)' : ' from your website'}</span>
        </li>
        <li>
          <CheckCircle2 aria-hidden="true" />
          <span>Personalized site branded to your colors, logo &amp; FAQ</span>
        </li>
      </ul>
      {deployResult.siteUrl ? (
        <a className="agent-deploy-site" href={deployResult.siteUrl} target="_blank" rel="noreferrer">
          <ExternalLink aria-hidden="true" /> Open your personalized site
        </a>
      ) : (
        <p className="agent-deploy-note"><Sparkles aria-hidden="true" /> Embedded on your personalized site. The branded site link appears here once your site is published.</p>
      )}
    </div>
  );
}

function CltCodeInspector({
  recommendation,
  profile,
  industryLabel,
}: {
  recommendation: Recommendation;
  profile: CompanyProfile;
  industryLabel: string;
}) {
  const [activeFile, setActiveFile] = useState<'schema' | 'renderer' | 'payload'>('schema');
  const [copied, setCopied] = useState(false);

  const schema = JSON.stringify({ title: recommendation.label, description: recommendation.description, 'lightning:type': `@apexClassType/c__${cltDtoClass(recommendation)}` }, null, 2);
  const renderer = JSON.stringify({ renderer: { componentOverrides: { $: { definition: `c/${recommendation.cltApiName}` } } } }, null, 2);
  const payload = JSON.stringify({ [recommendation.dtoFieldName]: recommendation.defaultPayloadJson, companyName: profile.companyName, industryLabel, accentColor: profile.accentColor }, null, 2);

  const files = {
    schema: { name: `lightningTypes/${recommendation.cltApiName}/schema.json`, content: schema, tag: 'deployed' },
    renderer: { name: `lightningTypes/${recommendation.cltApiName}/lightningDesktopGenAi/renderer.json`, content: renderer, tag: 'deployed' },
    payload: { name: `${recommendation.dtoFieldName} (this consultation)`, content: payload, tag: 'live values' },
  };
  const current = files[activeFile];

  async function copyCode() {
    await navigator.clipboard.writeText(current.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <section className="clt-code-inspector" aria-label="Deployed Custom Lightning Type source">
      <div className="code-inspector-header">
        <div><Code2 aria-hidden="true" /><span><strong>Deployed Custom Lightning Type</strong><small>{recommendation.cltApiName} · {recommendation.capabilityKey}</small></span></div>
        <button type="button" onClick={copyCode}>{copied ? <Check aria-hidden="true" /> : <Code2 aria-hidden="true" />} {copied ? 'Copied' : 'Copy'}</button>
      </div>
      <div className="code-inspector-body">
        <nav className="code-file-list" aria-label="Deployed files">
          {(Object.keys(files) as Array<keyof typeof files>).map((key) => (
            <button type="button" className={activeFile === key ? 'active' : ''} onClick={() => setActiveFile(key)} key={key}><Code2 aria-hidden="true" /><span>{files[key].name}</span></button>
          ))}
          <div className="bundle-facts">
            <span>Renderer</span><strong>c/{recommendation.cltApiName}</strong>
            <span>DTO field</span><strong>{recommendation.dtoFieldName}</strong>
            <span>Data source</span><strong>Catalogue default</strong>
          </div>
        </nav>
        <div className="code-editor">
          <div className="code-editor-tab"><span>{current.name}</span><i>{current.tag}</i></div>
          <pre>{current.content.split('\n').map((line, index) => <code key={`${activeFile}-${index}`}><span>{index + 1}</span>{line || ' '}</code>)}</pre>
        </div>
      </div>
    </section>
  );
}

/** The DTO Apex class backing a CLT, derived from its DTO field name. */
function cltDtoClass(rec: Recommendation): string {
  switch (rec.dtoFieldName) {
    case 'finServMoneyMovementJSON':
      return 'AsaFinServMoneyMovementData';
    case 'finServAdvisorMeetingJSON':
      return 'AsaFinServAdvisorMeetingData';
    case 'finServTransactionsJSON':
      return 'AsaFinServTransactionsData';
    case 'healthcareApptSchedulerJSON':
      return 'AsaHealthcareApptSchedulerData';
    case 'healthcareFindCareJSON':
      return 'AsaHealthcareFindCareData';
    case 'healthcareCareOptionsJSON':
      return 'AsaHealthcareCareOptionsData';
    case 'healthcareRxRefillJSON':
      return 'AsaHealthcareRxRefillData';
    case 'retailProductCarouselJSON':
      return 'AsaRetailProductCarouselData';
    case 'retailOrderTrackingJSON':
      return 'AsaRetailOrderTrackingData';
    case 'retailReturnsJSON':
      return 'AsaRetailReturnsData';
    case 'retailStorePickupJSON':
      return 'AsaRetailStorePickupData';
    case 'tmcPlanCompareJSON':
      return 'AsaTmcPlanCompareData';
    case 'tmcDataUsageJSON':
      return 'AsaTmcDataUsageData';
    case 'tmcServiceStatusJSON':
      return 'AsaTmcServiceStatusData';
    case 'tmcBillExplainerJSON':
      return 'AsaTmcBillExplainerData';
    case 'mfgEquipmentMonitorJSON':
      return 'AsaMfgEquipmentMonitorData';
    case 'mfgPartReorderJSON':
      return 'AsaMfgPartReorderData';
    case 'mfgWorkOrderJSON':
      return 'AsaMfgWorkOrderData';
    case 'mfgQuoteBuilderJSON':
      return 'AsaMfgQuoteBuilderData';
    case 'energyOutageTrackerJSON':
      return 'AsaEnergyOutageTrackerData';
    case 'energyUsageCostJSON':
      return 'AsaEnergyUsageCostData';
    case 'energyBudgetBillingJSON':
      return 'AsaEnergyBudgetBillingData';
    case 'energyRebateOffersJSON':
      return 'AsaEnergyRebateOffersData';
    default:
      return 'AsaFinServAccountSelectorData';
  }
}
