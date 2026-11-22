import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { EmployeeTrack, EmployeeFooter } from '@/employee/EmployeeTrack';
import type { EmployeeFunction } from '@/employee/functions';

/**
 * Standalone review surface (route: #coworker) for the team / Agentforce
 * Coworker track — decoupled from the intake → scan → confirm flow so the
 * department lanes + bespoke cards can be designed with instant HMR and no
 * org dependency. It renders the exact EmployeeTrack the real confirm screen
 * ships, inside the same confirm-layout shell, with a theme toggle so both
 * light and dark are reviewable. `vite dev` → localhost:5173/#coworker.
 */
const COMPANY = 'Northern Trail Co.';

export default function CoworkerPreview() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [fn, setFn] = useState<EmployeeFunction | null>(null);
  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return (
    <div className={`activation-app theme-${theme}`} style={{ '--customer-accent': '#5d5cde' } as React.CSSProperties}>
      <button
        className="df-theme-toggle"
        type="button"
        onClick={() => setTheme((c) => (c === 'dark' ? 'light' : 'dark'))}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
      </button>

      <main className="stage stage-confirm">
        <div className="content-shell confirm-layout">
          <div className="df-confirm-scroll">
            <EmployeeTrack companyName={COMPANY} onSelectFunction={setFn} />
          </div>
          <EmployeeFooter fn={fn} onContinue={() => {}} />
        </div>
      </main>
    </div>
  );
}
