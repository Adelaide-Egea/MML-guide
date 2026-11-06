// Title and description for a caregiver link preview (WhatsApp, iMessage…),
// so each link says who it is for and what it covers instead of the site name.
// Only names travel in the preview. Never notes, allergies or medicines.

import type { Handover, Household, Scenario } from '@mml/core';
import { chromeFor, subjectsFor } from '@mml/core';

export interface SharePreview {
  readonly title: string;
  readonly description: string;
}

function scenarioLabel(scenario: Scenario, language: string): string {
  const chrome = chromeFor(language || 'en');
  const labels: Record<Scenario, string> = {
    evening: chrome.scenarioEvening,
    fullday: chrome.scenarioFullDay,
    weekend: chrome.scenarioWeekend,
    cleaner: chrome.scenarioCleaner,
    petsitter: chrome.scenarioPetSitter,
    goingtoyours: chrome.scenarioGoingToYours,
  };
  return labels[scenario] ?? '';
}

export function sharePreview(household: Household, handover: Handover): SharePreview {
  const chrome = chromeFor(handover.language || 'en');
  const name = handover.caregiverName.trim();
  const kind = scenarioLabel(handover.scenario, handover.language);
  const lead = name ? chrome.forName(name) : kind || 'Domela';
  const title = name && kind ? `${lead} · ${kind}` : lead;

  const names = subjectsFor(household, handover)
    .map((s) => s.name.trim())
    .filter(Boolean);
  const description = names.length > 0 ? `${names.join(' · ')} · Domela` : 'Domela';

  return { title, description };
}
