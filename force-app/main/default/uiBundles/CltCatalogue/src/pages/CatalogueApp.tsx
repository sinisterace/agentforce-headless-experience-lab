import { FormEvent, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Code2,
  ExternalLink,
  Globe2,
  Hammer,
  Layers3,
  Monitor,
  Moon,
  PackageSearch,
  Sparkles,
  Sun,
  Workflow,
} from 'lucide-react';
import agentforceLogo from '@/assets/agentforce-logo.png';
import df26HeroPlate from '@/assets/brand/df26/background_dark_blue_black.jpg';
import df26SparkleTeal from '@/assets/brand/df26/sparkle-teal.png';
import df26SparkleYellow from '@/assets/brand/df26/sparkle-yellow.png';
import df26SparkleBlue from '@/assets/brand/df26/sparkle-blue.png';
import df26SparklePink from '@/assets/brand/df26/sparkle-pink.png';
import df26Wave from '@/assets/brand/df26/wave.webp';
import df26Openai from '@/assets/brand/df26/openai.png';
import df26OpenaiLight from '@/assets/brand/df26/openai-light.png';
import df26Claude from '@/assets/brand/df26/claude-color.png';
import df26Slack from '@/assets/brand/df26/slack.png';
import df26SalesforceCloud from '@/assets/brand/df26/salesforce-cloud-3d.png';
import df26Cloudspiral from '@/assets/brand/df26/df26-cloudspiral.png';
import df26Sparkle3dYellow from '@/assets/brand/df26/sparkle3d-yellow.png';
import df26Sparkle3dPink from '@/assets/brand/df26/sparkle3d-pink.png';
import { SurfaceMarquee } from '@/components/df26/SurfaceMarquee';
import TextType from '@/components/df26/TextType';
import LatticeLoader from '@/components/df26/LatticeLoader';
import { StaggeredText } from '@/components/df26/StaggeredText';
import { deployAgent, fetchCatalog, saveProfile, scanCompany } from '@/api/catalogApi';
import type { CompanyProfile, DeployResponse, IndustryOption, Recommendation } from '@/types/catalog';
import { CompanyMark, capabilityIcon, hostnameOf, industryArtwork, industryIcon, initialsOf } from '@/components/shared';
import { derivePalette, sameHex } from '@/lib/palette';
import { CltPlayground } from '@/components/playground/CltPlayground';
import { ChannelViewer } from '@/components/channels/ChannelViewer';
import { CltCodeInspector } from '@/components/playground/CltCodeInspector';
import { BuilderGuide } from '@/components/BuilderGuide';
import { AudienceSwitch, EmployeeFooter, EmployeeTrack, type Audience } from '@/employee/EmployeeTrack';
import { employeeRecommendation } from '@/employee/cardData';
import { DEFAULT_DEPARTMENT } from '@/employee/departments';
import type { EmployeeFunction } from '@/employee/functions';

type Stage = 'welcome' | 'audience' | 'intake' | 'confirm' | 'building' | 'preview' | 'builder';
type Theme = 'dark' | 'light';
type Intake = { companyName: string; website: string; industry: string };

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

/** A display-friendly company name guessed from the website, used only as a hint
 *  for the scan (the AI overwrites it with the real name). "https://acme.com" → "Acme". */
function companyGuessFromWebsite(website: string): string {
  try {
    const label = hostnameOf(website).replace(/^www\./i, '').split('.')[0];
    return label ? label.charAt(0).toUpperCase() + label.slice(1) : '';
  } catch {
    return '';
  }
}

export default function CatalogueApp() {
  const [stage, setStage] = useState<Stage>('welcome');
  const [theme, setTheme] = useState<Theme>('light');
  // The dual-track lens: 'customer' (industry CLTs, external surfaces) vs
  // 'employee' (universal functions, Slack/Agentforce Coworker). Persists across
  // the results → preview journey.
  const [audience, setAudience] = useState<Audience>('customer');
  // The Coworker function chosen in the team track (reported up by EmployeeTrack),
  // so Deploy → build → preview can render it across every surface.
  const [selectedEmpFn, setSelectedEmpFn] = useState<EmployeeFunction | null>(null);
  const [intake, setIntake] = useState<Intake>({ companyName: '', website: '', industry: '' });
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

  // Show only the CLTs catalogued for the SELECTED industry (user decision: each
  // industry surfaces its own set). Once the catalogue has loaded, trust that
  // industry's rows verbatim — an empty result correctly shows the "No experiences
  // catalogued yet" state. Before the catalogue resolves, fall back to the scan
  // recs, but ONLY the ones whose industryKey matches the selected industry, so a
  // card can never render another industry's CLTs (the "random options" bug: the
  // old `forIndustry.length ? forIndustry : recommendations` leaked the scan's
  // single-industry set whenever recsByIndustry[industry] was momentarily empty).
  const activeRecs = useMemo(() => {
    const catalogLoaded = Object.keys(recsByIndustry).length > 0;
    if (catalogLoaded) return recsByIndustry[industry] ?? [];
    return recommendations.filter((r) => r.industryKey === industry);
  }, [recsByIndustry, recommendations, industry]);
  const selectedRec = activeRecs.find((r) => r.cltApiName === selectedCltApiName) ?? activeRecs[0] ?? null;

  const companyName = profile?.companyName || intake.companyName || 'Your company';
  // The synthesized catalogue row for the chosen Coworker card (team track).
  // Fall back to the default department's first function so the team preview is
  // always renderable — e.g. when the audience toggle is flipped to "team" on the
  // preview page without having picked a Coworker action in the configurator.
  const employeeRec = useMemo(
    () => employeeRecommendation(selectedEmpFn ?? DEFAULT_DEPARTMENT.functions[0]),
    [selectedEmpFn]
  );
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
        companyName: intake.companyName || companyGuessFromWebsite(intake.website),
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
    // Both audiences run the SAME server-side build: save the researched company
    // profile and deploy/re-ground the branded FAQ Service Agent + Experience Cloud
    // site. The team track used to skip this and only play a visual walkthrough —
    // which left the customer site unpublished/ungrounded, so flipping to "For
    // customers" on the preview and hitting "Open your site" 404'd until the user
    // went back and ran the customer build. Running save + deploy on both paths
    // keeps that branded site built and up to date regardless of which path (team
    // or customer) the user took. The team track still lands on the Coworker
    // preview and keeps its Coworker-worded walkthrough + timing.
    const isTeam = audience === 'employee';
    setStage('building');
    setBuildStep(0);
    setScanMessage('');

    // Walk visibly through every build step in real time. The real save/deploy run
    // concurrently; we only reach the preview once BOTH the staged walkthrough and
    // the save have finished, so the progress never lies about the work.
    const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
    const walkthrough = (async () => {
      for (let step = 1; step < BUILD_STEP_COUNT; step += 1) {
        // The team walkthrough runs a touch quicker than the customer one.
        await wait(step < FIRST_SAVE_STEP ? (isTeam ? 1200 : 1400) : (isTeam ? 1500 : 1900));
        setBuildStep(step);
      }
    })();

    const save = saveProfile({
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

    // allSettled so the customer-site save never aborts the build: on the team
    // track a save hiccup must NOT throw the user out of the Coworker flow, and on
    // either track the walkthrough + deploy still complete. The save result only
    // feeds the "Consultation" id on the preview contract.
    const [saveOutcome] = await Promise.all([
      Promise.allSettled([save]).then((r) => r[0]),
      walkthrough,
      deploy,
    ]);

    if (saveOutcome.status === 'fulfilled') {
      setSavedName(saveOutcome.value.id);
    } else if (!isTeam) {
      // Customer track: surface the failure and return to the configurator, as before.
      const reason = saveOutcome.reason;
      setScanMessage(reason instanceof Error && reason.message ? reason.message : 'The experience could not be prepared in this org.');
      setStage('confirm');
      return;
    }

    setBuildStep(BUILD_STEP_COUNT - 1);
    await wait(isTeam ? 600 : 700);
    setStage('preview');
  }

  return (
    <div className={`activation-app theme-${theme}`} style={appStyle}>
      <a className="skip-link" href="#main">Skip to main content</a>
      {/* The old top header (brand lockup + phase dock + theme toggle) is
          replaced by the DF26 per-page UI. A single floating theme toggle keeps
          light/dark switching available on every stage during the migration. */}
      <button
        className="df-theme-toggle"
        type="button"
        onClick={() => setTheme((c) => (c === 'dark' ? 'light' : 'dark'))}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        aria-pressed={theme === 'light'}
      >
        {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
      </button>

      <main id="main" className={`stage stage-${stage}`}>
        {catalogError && <p className="mock-ribbon" role="alert"><AlertTriangle aria-hidden="true" /> {catalogError}</p>}

        {stage === 'welcome' && <Welcome onContinue={() => setStage('audience')} theme={theme} />}

        {stage === 'audience' && (
          <AudienceIntake
            onPick={(a) => {
              setAudience(a);
              setStage('intake');
            }}
            onBack={() => setStage('welcome')}
          />
        )}

        {stage === 'intake' && (
          <IntakeScreen intake={intake} setIntake={setIntake} audience={audience} scanning={scanning} onSubmit={analyzeCompany} onBack={() => setStage('audience')} scanMessage={scanMessage} />
        )}

        {stage === 'confirm' && profile && (
          <ConfirmScreen
            profile={profile}
            industry={industry}
            initials={initials}
            audience={audience}
            onAudience={setAudience}
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
            onSelectEmployeeFn={setSelectedEmpFn}
            selectedEmployeeFn={selectedEmpFn}
          />
        )}

        {stage === 'building' && audience === 'employee' && profile && employeeRec && (
          <BuildingScreen profile={profile} buildStep={buildStep} industryLabel={industryLabel} initials={initials} selectedRec={employeeRec} audience="employee" />
        )}

        {stage === 'building' && audience === 'customer' && profile && selectedRec && (
          <BuildingScreen profile={profile} buildStep={buildStep} industryLabel={industryLabel} initials={initials} selectedRec={selectedRec} />
        )}

        {stage === 'preview' && profile && (audience === 'employee' ? employeeRec : selectedRec) && (
          <PreviewScreen
            profile={profile}
            initials={initials}
            selectedRec={(audience === 'employee' ? employeeRec : selectedRec) as Recommendation}
            savedName={savedName}
            deployResult={deployResult}
            deployError={deployError}
            headingRef={previewHeading}
            audience={audience}
            onAudience={setAudience}
            onBack={() => setStage('confirm')}
            onNext={() => setStage('builder')}
          />
        )}

        {stage === 'builder' && profile && selectedRec && (
          <BuilderGuide
            selectedRec={selectedRec}
            onBack={() => setStage('preview')}
          />
        )}
      </main>
    </div>
  );
}

// Full-page animated backgrounds (WebGL/canvas) — lazy so the hero paints first.
const ColorBendsBG = lazy(() => import('@/components/df26/ColorBends'));
const DotFieldBG = lazy(() => import('@/components/df26/DotField'));

/**
 * Welcome / Hero — the DF26 landing stage, redesigned as a single centered
 * column. The old off-canvas particle "headless" mascot is gone; the flowing
 * channel marquee ({@link SurfaceMarquee}) is now the centerpiece — the literal
 * visual answer to the "for any channel" headline. Pure presentation: the only
 * behavior is the single {@link onContinue} handoff to the intake stage (wiring
 * unchanged). Visuals (centered headline-ghost, glass channel chips, glass CTA,
 * blueprint background, floating 3D sparkles) come from df26.css.
 */
/**
 * The title's last words ("any channel") type in with a cursor that disappears
 * once typing finishes; the rest of the title floats in statically.
 */
function TypedTail({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    // initialDelay (title floats in first) + typing + a settle buffer.
    const ms = 850 + text.length * 70 + 450;
    const t = window.setTimeout(() => setDone(true), ms);
    return () => window.clearTimeout(t);
  }, [text]);
  return (
    <TextType
      as="span"
      className="df-hero-type-tail"
      text={text}
      typingSpeed={70}
      initialDelay={850}
      loop={false}
      showCursor={!done}
      cursorCharacter="|"
      cursorBlinkDuration={0.5}
    />
  );
}

function Welcome({ onContinue, theme }: { onContinue: () => void; theme: Theme }) {
  // Mount the animated backgrounds after first paint so the hero renders instantly.
  const [bgMounted, setBgMounted] = useState(false);
  useEffect(() => setBgMounted(true), []);

  return (
    <div className="df-hero df-hero--centered">
      <div aria-hidden className="df-hero-plate" style={{ backgroundImage: `url(${df26HeroPlate})` }} />
      <div aria-hidden className="df-hero-wash" />
      <div aria-hidden className="df-hero-grid" />
      <div aria-hidden className="df-hero-fade" />

      {/* Same design in both themes — flowing color bands + an interactive dot
          grid — just a lighter palette on light and a deeper one on dark. Both
          are pointer-events:none; DotField tracks the cursor via a window listener. */}
      {bgMounted && (
        <Suspense fallback={null}>
          <div aria-hidden className="df-hero-bg df-hero-bg--bends">
            <ColorBendsBG
              colors={theme === 'dark' ? ['#9b5cff', '#d946ef'] : ['#ff5c7a', '#8a5cff', '#00ffd1']}
              rotation={86}
              speed={0.23}
              scale={1.9}
              frequency={1}
              warpStrength={0.995}
              mouseInfluence={1}
              noise={theme === 'dark' ? 0.04 : 0.45}
              parallax={0}
              iterations={1}
              intensity={theme === 'dark' ? 1.05 : 1.5}
              bandWidth={1}
              autoRotate={0}
              transparent
            />
          </div>
          <div aria-hidden className="df-hero-bg df-hero-bg--dots">
            <DotFieldBG
              dotRadius={1.5}
              dotSpacing={14}
              cursorRadius={750}
              cursorForce={0.08}
              bulgeOnly
              bulgeStrength={35}
              glowRadius={0}
              sparkle={false}
              waveAmplitude={7}
              gradientFrom={theme === 'dark' ? 'rgba(176,130,255,0.6)' : 'rgba(84,66,138,0.72)'}
              gradientTo={theme === 'dark' ? 'rgba(214,160,255,0.42)' : 'rgba(126,104,176,0.5)'}
              glowColor="#67E8F9"
            />
          </div>
        </Suspense>
      )}

      {/* Floating 3D sparkles — ambient, scattered around the centered column. */}
      <img src={df26SparkleTeal} alt="" aria-hidden className="df-sparkle df-sparkle--teal" />
      <img src={df26SparkleYellow} alt="" aria-hidden className="df-sparkle df-sparkle--yellow" />
      <img src={df26SparkleBlue} alt="" aria-hidden className="df-sparkle df-sparkle--blue" />
      <img src={df26SparklePink} alt="" aria-hidden className="df-sparkle df-sparkle--pink" />

      <div className="df-hero-body">
        <div className="df-hero-stack df-animate-rise">
          <h1 id="welcome-title" className="df-hero-h1">
            <span className="df-hero-title df-hero-title--float">
              {'Customize\nyour agent\nfor '}
              <TypedTail text="any channel" />
            </span>
          </h1>

          {/* Big surface logos, pulled up to overlay the title's faded bottom. */}
          <div className="df-hero-channels" aria-label="Surfaces where custom Lightning types appear">
            <SurfaceMarquee />
          </div>

          <p className="df-hero-lede">
            Custom Lightning Types let you design rich, interactive experiences for Agentforce.
            Now let&rsquo;s explore the most effective patterns for your company.
          </p>

          <button
            type="button"
            onClick={onContinue}
            className="df-hero-cta df-glass df-glass-hover df-glass-shine df-glow-ring"
          >
            Start Designing <span aria-hidden className="df-cta-arrow">&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Interest / audience choice — a focused step styled like the website intake.
 * This replaced the old toggle-at-top-of-playground as the PRIMARY selection:
 * the user says who the agent is for up front, then the playground keeps a
 * quiet toggle to switch. Reuses the `.df-intake` shell for visual continuity.
 */
function AudienceIntake({ onPick, onBack }: { onPick: (a: Audience) => void; onBack: () => void }) {
  // Cursor-tracked spotlight + subtle tilt (a native take on the BorderGlow /
  // MagicBento interactions) — set CSS vars the card's glow + transform read.
  function onCardMove(e: React.MouseEvent<HTMLButtonElement>) {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty('--mx', `${x}px`);
    el.style.setProperty('--my', `${y}px`);
    el.style.setProperty('--rx', `${((y / r.height) - 0.5) * -5}deg`);
    el.style.setProperty('--ry', `${((x / r.width) - 0.5) * 5}deg`);
  }
  function onCardLeave(e: React.MouseEvent<HTMLButtonElement>) {
    const el = e.currentTarget;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  }
  return (
    <div className="df-intake audience-intake">
      <img src={df26Wave} alt="" aria-hidden className="df-intake-wave" />
      <div aria-hidden className="df-intake-grid" />
      <span aria-hidden className="audience-blob audience-blob-a" />
      <span aria-hidden className="audience-blob audience-blob-b" />
      <img src={df26SparkleTeal} alt="" aria-hidden className="audience-float audience-float-a" />
      <img src={df26SparklePink} alt="" aria-hidden className="audience-float audience-float-b" />
      <img src={df26SparkleBlue} alt="" aria-hidden className="audience-float audience-float-c" />

      <div className="df-intake-topbar">
        <button className="df-intake-back" type="button" onClick={onBack}><ArrowLeft aria-hidden="true" /> Back</button>
      </div>

      <div className="audience-body">
        <header className="audience-head">
          <h1 id="audience-title" className="audience-title"><StaggeredText text="Who do you want to build for?" /></h1>
          <p className="audience-lede">Tell us whether this agent is for your customers or your own team, and we&rsquo;ll tailor the cards, surfaces, and deploy to fit.</p>
        </header>

        <div className="audience-choice">
          {/* Customer world — light glass, Salesforce blue, external surfaces */}
          <button type="button" className="audience-choice-card is-customer" onMouseMove={onCardMove} onMouseLeave={onCardLeave} onClick={() => onPick('customer')}>
            <span className="audience-card-glow" aria-hidden="true" />
            <span className="acc-frame" aria-hidden="true" />
            <span className="audience-card-sheen" aria-hidden="true" />
            <div className="audience-card-head">
              <span className="audience-card-eyebrow">Service Agent</span>
            </div>
            <strong>Your customers</strong>
            <small>An autonomous agent that answers questions and resolves issues on its own.</small>
            <div className="audience-surfaces">
              <span className="audience-surfaces-label">Deploys to</span>
              <span className="audience-surface-chips">
                <span className="surface-chip"><img src={df26SalesforceCloud} alt="" aria-hidden="true" /> Agentforce</span>
                <span className="surface-chip"><img src={df26Openai} alt="" aria-hidden="true" /> ChatGPT</span>
                <span className="surface-chip"><img src={df26Claude} alt="" aria-hidden="true" /> Claude</span>
                <span className="surface-chip"><img src={df26Slack} alt="" aria-hidden="true" /> Slack</span>
              </span>
            </div>
          </button>

          {/* Team world — dark glass, employee-facing agent */}
          <button type="button" className="audience-choice-card is-team" onMouseMove={onCardMove} onMouseLeave={onCardLeave} onClick={() => onPick('employee')}>
            <span className="audience-card-glow" aria-hidden="true" />
            <span className="acc-frame" aria-hidden="true" />
            <span className="audience-card-sheen" aria-hidden="true" />
            <div className="audience-card-head">
              <span className="audience-card-eyebrow">Employee-facing agent</span>
            </div>
            <strong>Your team</strong>
            <small>One AI teammate across Sales, Service, IT, Finance, HR, and Marketing.</small>
            <div className="audience-surfaces">
              <span className="audience-surfaces-label">Deploys to</span>
              <span className="audience-surface-chips">
                <span className="surface-chip"><img src={df26SalesforceCloud} alt="" aria-hidden="true" /> Agentforce Coworker</span>
                <span className="surface-chip"><img src={df26OpenaiLight} alt="" aria-hidden="true" /> ChatGPT</span>
                <span className="surface-chip"><img src={df26Claude} alt="" aria-hidden="true" /> Claude</span>
                <span className="surface-chip"><img src={df26Slack} alt="" aria-hidden="true" /> Slack</span>
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function IntakeScreen({
  intake,
  setIntake,
  audience,
  scanning,
  onSubmit,
  onBack,
  scanMessage,
}: {
  intake: Intake;
  setIntake: React.Dispatch<React.SetStateAction<Intake>>;
  audience: Audience;
  scanning: boolean;
  onSubmit: (event: FormEvent) => void;
  onBack: () => void;
  scanMessage: string;
}) {
  // Website is the only field we ask for — the scan derives everything else.
  const website = intake.website.trim();
  const valid = website.length > 3 && /\.[a-z]{2,}/i.test(website);
  return (
    <div className="df-intake">
      <img src={df26Wave} alt="" aria-hidden className="df-intake-wave" />
      <div aria-hidden className="df-intake-grid" />

      <div className="df-intake-topbar">
        <nav className="df-stepnav" aria-label="Progress">
          <span className="df-step is-active"><i>1</i> Company</span>
          <span className="df-step"><i>2</i> Playground</span>
          <span className="df-step"><i>3</i> Preview</span>
          <span className="df-step"><i>4</i> Agentforce Builder</span>
        </nav>
        <button className="df-intake-back" type="button" onClick={onBack}><ArrowLeft aria-hidden="true" /> Back</button>
      </div>

      <div className="df-intake-solo-body">
        <section className="df-intake-solo-copy" aria-labelledby="intake-title">
          <img src={df26SparklePink} alt="" aria-hidden className="df-sparkle df-intake-solo-sparkle" />
          <span className="df-intake-eyebrow">Start your build</span>
          <h1 id="intake-title" className="df-intake-solo-title">Start with your website</h1>
          <p className="df-intake-solo-lede">
            {audience === 'employee'
              ? 'That’s all we need. We’ll personalize a set of cards for your Agentforce Coworker, so your team gets rich, interactive answers right in the flow of work.'
              : 'That’s all we need. We’ll spin up an Agentforce Service Agent tailored to your company and recommend interfaces based on proven patterns and best practices for your industry.'}
          </p>
        </section>

        <form onSubmit={onSubmit} className="df-intake-solo-form">
          <label className="df-field df-field-website">
            <span className="df-field-label">Company website</span>
            <div className="df-website-input">
              <Globe2 aria-hidden="true" className="df-website-ico" />
              <input
                autoFocus
                value={intake.website}
                onChange={(e) => setIntake((c) => ({ ...c, website: e.target.value }))}
                onBlur={(e) => setIntake((c) => ({ ...c, website: normalizeWebsiteInput(e.target.value) }))}
                placeholder="yourcompany.com"
                inputMode="url"
                autoComplete="url"
                aria-label="Company website"
              />
            </div>
          </label>
          <p className="df-intake-hint">
            Don&rsquo;t have your own? Paste any public company&rsquo;s website and we&rsquo;ll build the experience around it.
          </p>
          {scanMessage && <div className="df-field-notice" role="status">{scanMessage}</div>}
          {scanning ? (
            <div className="df-intake-loading">
              <LatticeLoader
                status="working"
                label="Reading your website"
                pattern="orbit"
                grid={4}
                shape="round"
                cellSize={9}
                gap={4}
                fontSize={13}
                glow
                color="var(--df-loader)"
                glowColor="var(--df-loader)"
              />
            </div>
          ) : (
            <button className="df-intake-submit df-intake-submit-lg" type="submit" disabled={!valid}>
              Create my experience <ArrowRight aria-hidden="true" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

function ConfirmScreen({
  profile,
  industry,
  initials,
  audience,
  onAudience,
  scanMessage,
  industries,
  recommendations,
  selectedRec,
  onSelectClt,
  onIndustry,
  onBack,
  onContinue,
  onPickAccent,
  onSelectEmployeeFn,
  selectedEmployeeFn,
}: {
  profile: CompanyProfile;
  industry: string;
  initials: string;
  audience: Audience;
  onAudience: (a: Audience) => void;
  scanMessage: string;
  industries: IndustryOption[];
  recommendations: Recommendation[];
  selectedRec: Recommendation | null;
  onSelectClt: (apiName: string) => void;
  onIndustry: (key: string) => void;
  onBack: () => void;
  onContinue: () => void;
  onPickAccent: (hex: string) => void;
  onSelectEmployeeFn: (fn: EmployeeFunction) => void;
  selectedEmployeeFn: EmployeeFunction | null;
}) {
  const succeeded = profile.source === 'website';
  // Palette is derived from the ORIGINAL scanned accent, captured once on mount,
  // so the swatches stay stable even as the picked accent (profile.accentColor)
  // changes. ConfirmScreen unmounts when leaving the confirm stage, so a new scan
  // recaptures the base.
  const [baseAccent] = useState(() => profile.accentColor);
  const palette = useMemo(() => derivePalette(baseAccent), [baseAccent]);
  // Surface the selected industry at the front of the scroll row, and glide the row
  // back to the start so the just-picked card stays in view.
  const orderedIndustries = useMemo(() => {
    const sel = industries.find((i) => i.key === industry);
    return sel ? [sel, ...industries.filter((i) => i.key !== industry)] : industries;
  }, [industries, industry]);
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  }, [industry]);
  return (
    <div className="content-shell confirm-layout">
      <div className="df-intake-topbar">
        <nav className="df-stepnav" aria-label="Progress">
          <span className="df-step"><i>1</i> Company</span>
          <span className="df-step is-active"><i>2</i> Playground</span>
          <span className="df-step"><i>3</i> Preview</span>
          <span className="df-step"><i>4</i> Agentforce Builder</span>
        </nav>
        <button className="df-intake-back" type="button" onClick={onBack}><ArrowLeft aria-hidden="true" /> Back</button>
      </div>
      <div className="df-confirm-scroll">
      {scanMessage && <div className="fallback-notice df-confirm-notice" role="status">{scanMessage}</div>}
      <AudienceSwitch value={audience} onChange={onAudience} />
      {audience === 'customer' ? (
      <section className="experience-configurator" aria-label="Experience starting point">
        <header className="configurator-head">
          <span className="configurator-eyebrow">Tailored to your industry</span>
          <h2 className="configurator-title">Select your agent&rsquo;s interactive components</h2>
          <p className="configurator-lede">Custom Lightning Types (CLTs) are interactive cards your agent renders in the conversation — pick any to preview it.</p>
        </header>
        <fieldset className="industry-fieldset">
          <legend className="sr-only">Experience starting point</legend>
          <div className="industry-options" ref={scrollerRef}>
            {orderedIndustries.map((option) => {
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
                  const selected = selectedRec?.cltApiName === rec.cltApiName;
                  const words = rec.description.trim().split(/\s+/);
                  const shortDesc = words.length > 10 ? `${words.slice(0, 10).join(' ')}…` : rec.description;
                  return (
                    <button type="button" className={selected ? 'template-option selected' : 'template-option'} onClick={() => onSelectClt(rec.cltApiName)} aria-pressed={selected} key={rec.cltApiName}>
                      <span className="template-option-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                      <span className="template-option-copy"><strong>{rec.label}</strong><small>{shortDesc}</small></span>
                      <span className="template-option-state" aria-hidden="true">{selected ? <Check /> : <ArrowRight />}</span>
                    </button>
                  );
                })}
              </div>
              {selectedRec && <CltPlayground key={selectedRec.cltApiName} recommendation={selectedRec} accentColor={profile.accentColor} companyName={profile.companyName} />}
            </>
          )}
        </div>
      </section>
      ) : (
        <EmployeeTrack companyName={profile.companyName} onSelectFunction={onSelectEmployeeFn} />
      )}

      <section className="confirm-copy" aria-labelledby="confirm-title">
        <div className="profile-card" style={{ '--profile-accent': profile.accentColor } as React.CSSProperties}>
          <span className="source-label"><img src={df26SparkleTeal} className="source-label-icon" alt="" aria-hidden="true" /> {succeeded ? 'Live website profile' : 'Starter profile'}</span>
          <div className="profile-grid">
            <div className="profile-col-left">
              <div className="profile-idrow">
                <CompanyMark profile={profile} initials={initials} />
                <div>
                  <h2 id="confirm-title">{profile.companyName}</h2>
                  <a href={profile.website} target="_blank" rel="noreferrer">{hostnameOf(profile.website)} <ExternalLink aria-hidden="true" /></a>
                </div>
              </div>
              <p className="profile-summary">{profile.summary}</p>
            </div>
            <div className="profile-col-right">
              <ul className="profile-checklist" aria-label="Extracted signals">
                {profile.signals.map((signal) => <li key={signal}><Check aria-hidden="true" /> <span>{signal}</span></li>)}
              </ul>
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
        </div>
      </section>
      </div>

      {audience === 'customer' ? (
      <div className="configurator-footer">
        <span className="build-bar-icon" aria-hidden="true">
          {(() => {
            const art = industryArtwork(industry);
            const Icon = industryIcon(industry);
            return art ? <img src={art} alt="" /> : <Icon />;
          })()}
        </span>
        <span className="build-bar-copy">
          <strong>{selectedRec?.label ?? 'Experience'}</strong>
          <span className="build-bar-surfaces">
            <span className="build-surface-stack" aria-hidden="true">
              <img src={df26SalesforceCloud} alt="" />
              <img src={df26Openai} alt="" />
              <img src={df26Claude} alt="" />
              <img src={df26Slack} alt="" />
            </span>
            <span className="build-bar-surfaces-note">Want to see it on every surface? Start building.</span>
          </span>
        </span>
        <button className="primary-action" type="button" onClick={onContinue}><Hammer aria-hidden="true" /> Build your experience <ArrowRight aria-hidden="true" /></button>
      </div>
      ) : (
        <EmployeeFooter fn={selectedEmployeeFn} onContinue={onContinue} />
      )}
    </div>
  );
}

/** Coworker-worded build steps (team track), parallel to {@link buildStepCopy}. */
function coworkerStepCopy(ctx: { company: string; experience: string }) {
  return [
    { title: `Grounding on ${ctx.company}'s Data 360`, detail: `Mapping ${ctx.company}'s Salesforce and connected data — no training needed` },
    { title: 'Mapping your Employee Agents', detail: 'Coworker learns which specialist to route each task to' },
    { title: `Tailoring the ${ctx.experience} card`, detail: `Shaping ${ctx.experience} around ${ctx.company}` },
    { title: 'Publishing to Agentforce Coworker', detail: 'Writing the interactive card so it renders inline' },
    { title: `Connecting ${ctx.company}'s Coworker`, detail: 'Live across Salesforce, Claude, and ChatGPT' },
  ];
}

function BuildingScreen({
  profile,
  buildStep,
  industryLabel,
  initials,
  selectedRec,
  audience,
}: {
  profile: CompanyProfile;
  buildStep: number;
  industryLabel: string;
  initials: string;
  selectedRec: Recommendation;
  audience?: 'customer' | 'employee';
}) {
  const isTeam = audience === 'employee';
  const steps = isTeam
    ? coworkerStepCopy({ company: profile.companyName, experience: selectedRec.label })
    : buildStepCopy({
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
        <h1>{isTeam ? 'Agentforce is bringing Coworker to your team.' : 'Agentforce is assembling your service experience.'}</h1>
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
            <div className={`assembly-card website-piece ${buildStep >= 0 ? 'online' : ''}`}><Globe2 /><span>{isTeam ? `${profile.companyName} · Data 360` : hostnameOf(profile.website)}</span></div>
            <div className="assembly-line"><i /></div>
            <div className={`assembly-agent ${buildStep >= 2 ? 'online' : ''}`}>
              <span className="agent-halo" /><img src={agentforceLogo} alt="" />
              <div><strong>{isTeam ? 'Agentforce Coworker' : 'Service Agent'}</strong><span>{isTeam ? 'routes to Employee Agents' : `${industryLabel} specialist`}</span></div>
            </div>
            <div className="assembly-line"><i /></div>
            <div className={`assembly-card clt-piece ${buildStep >= 3 ? 'online' : ''}`}><CltIcon /><span>{selectedRec.label}</span></div>
          </div>
          <div className="build-console" aria-live="polite">
            <div><span>BUILD LOG</span><span>secure session</span></div>
            {steps.slice(0, buildStep + 1).map((step, index) => (
              <p key={index} className={index === buildStep ? 'current' : ''}>
                <CheckCircle2 aria-hidden="true" />{step.title}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Every surface the built CLT will render on (matches the Lovable design). */}
      <div className="build-surfaces" aria-label="Building for every surface">
        <span className="build-surfaces-label">Building for every surface</span>
        <div className="build-surfaces-marks">
          <span className="surface-pill"><img src={df26SalesforceCloud} alt="" aria-hidden="true" /> {isTeam ? 'Agentforce Coworker' : 'Salesforce'}</span>
          <span className="surface-pill">
            <img className="surface-openai-dark" src={df26Openai} alt="" aria-hidden="true" />
            <img className="surface-openai-light" src={df26OpenaiLight} alt="" aria-hidden="true" /> ChatGPT
          </span>
          <span className="surface-pill"><img src={df26Claude} alt="" aria-hidden="true" /> Claude</span>
          <span className="surface-pill"><img src={df26Slack} alt="" aria-hidden="true" /> Slack</span>
        </div>
        {buildStep >= BUILD_STEP_COUNT - 1 ? (
          <span className="build-surfaces-status ready"><Check aria-hidden="true" /> Ready</span>
        ) : (
          <span className="build-surfaces-status"><i aria-hidden="true" /> In progress</span>
        )}
      </div>
    </div>
  );
}

function PreviewScreen({
  profile,
  initials,
  selectedRec,
  savedName,
  deployResult,
  deployError,
  headingRef,
  onBack,
  onNext,
  audience,
  onAudience,
}: {
  profile: CompanyProfile;
  initials: string;
  selectedRec: Recommendation;
  savedName: string | null;
  deployResult: DeployResponse | null;
  deployError: string | null;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onBack: () => void;
  onNext: () => void;
  audience?: 'customer' | 'employee';
  onAudience?: (a: Audience) => void;
}) {
  const isTeam = audience === 'employee';
  const [previewMode, setPreviewMode] = useState<'experience' | 'code'>('experience');
  // Type contract — Lovable's horizontal spec, filled with the app's REAL facts.
  const contract: { label: string; value: string; mono?: boolean }[] = [
    { label: 'Experience', value: selectedRec.label },
    { label: 'Capability', value: selectedRec.capabilityKey, mono: true },
    { label: 'Custom Lightning Type', value: `c__${selectedRec.cltApiName}`, mono: true },
    { label: 'Personalization', value: profile.source === 'website' ? 'Website profile' : 'Industry starter' },
    { label: 'Consultation', value: savedName ?? 'Not saved', mono: true },
  ];
  return (
    <div className="preview-stage df-launch">
      <img src={df26Sparkle3dYellow} alt="" aria-hidden="true" className="df-launch-sparkle df-launch-sparkle-a" />
      <img src={df26Sparkle3dPink} alt="" aria-hidden="true" className="df-launch-sparkle df-launch-sparkle-b" />
      <div className="df-intake-topbar">
        <nav className="df-stepnav" aria-label="Progress">
          <span className="df-step"><i>1</i> Company</span>
          <span className="df-step"><i>2</i> Playground</span>
          <span className="df-step is-active"><i>3</i> Preview</span>
          <span className="df-step"><i>4</i> Agentforce Builder</span>
        </nav>
        <button className="df-intake-back" type="button" onClick={onBack}><ArrowLeft aria-hidden="true" /> Back</button>
      </div>

      {onAudience && <AudienceSwitch value={audience ?? 'customer'} onChange={onAudience} />}

      <section className="df-launch-intro">
        <div className="df-launch-intro-copy">
          {!isTeam && <span className="df-type-eyebrow">Headless surface previews</span>}
          <h1 ref={headingRef} tabIndex={-1}>{isTeam ? 'Preview Coworker across every surface' : 'Preview Your Agent Across Any Interface'}</h1>
        </div>
        <div className="preview-actions">
          <div className="preview-mode-switch" role="group" aria-label="Preview mode">
            <button type="button" className={previewMode === 'experience' ? 'active' : ''} onClick={() => setPreviewMode('experience')}><Monitor aria-hidden="true" /> Experience</button>
            <button type="button" className={previewMode === 'code' ? 'is-source active' : 'is-source'} onClick={() => setPreviewMode('code')}><Code2 aria-hidden="true" /> CLT source</button>
          </div>
          {!isTeam && (
            <button className="df-launch-more-cta" type="button" onClick={onNext}>Try it in Agentforce Builder <ArrowRight aria-hidden="true" /></button>
          )}
        </div>
      </section>

      {previewMode === 'code' ? (
        <CltCodeInspector recommendation={selectedRec} />
      ) : (
        <ChannelViewer recommendation={selectedRec} profile={profile} initials={initials} deployResult={deployResult} deployError={deployError} audience={audience} />
      )}

      <section className="df-launch-header df-launch-card">
        <img src={df26Cloudspiral} alt="" aria-hidden="true" className="df-launch-ombre" />
        <span aria-hidden="true" className="df-launch-sweep" />
        <div className="df-launch-inner">
          <div className="df-launch-cardhead">
            <span className="df-launch-ready"><span className="df-launch-ready-dot" aria-hidden="true" /> {isTeam ? 'Live on Coworker' : 'Experience ready'}</span>
            <h2 className="df-agent-name">{isTeam ? `${profile.companyName} · Agentforce Coworker` : `${profile.companyName} Service Agent`}</h2>
          </div>
          <div className="df-type-contract">
            <span className="df-type-eyebrow">Type contract</span>
            <dl className="df-type-grid">
              {contract.map((r) => (
                <div className="df-type-row" key={r.label}>
                  <dt>{r.label}</dt>
                  <dd className={r.mono ? 'df-type-mono' : ''}>{r.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </div>
  );
}
