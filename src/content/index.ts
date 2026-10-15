import teagueData from '../../data/teague.json';
import { matchGame } from '../core/matchGame';
import { parseTitleDate } from '../core/dates';
import { summarize } from '../core/summary';
import type { TeagueData } from '../core/types';
import { closePopup, showPopup } from './popup';

const data = teagueData as TeagueData;
const BUTTON_ID = 'teague-time-button';
const TITLE_SELECTOR = 'ytd-watch-metadata #title h1';

let titleObserver: MutationObserver | null = null;

function currentVideoId(): string | null {
  return location.pathname === '/watch' ? new URLSearchParams(location.search).get('v') : null;
}

function readTitle(): string {
  // document.title lags during SPA navigation; the h1 is updated with the new video.
  return document.querySelector(TITLE_SELECTOR)?.textContent?.trim() ?? '';
}

/**
 * Upload date for the current video. The schema.org meta tags are server-rendered and go stale
 * after SPA navigation, so only trust them when their video id matches the URL. Otherwise fetch
 * the watch page (same origin) and read it from there.
 */
async function readUploadDate(videoId: string): Promise<string | null> {
  const metaId = document.querySelector('meta[itemprop="identifier"]')?.getAttribute('content');
  const metaDate =
    document.querySelector('meta[itemprop="uploadDate"]')?.getAttribute('content') ??
    document.querySelector('meta[itemprop="datePublished"]')?.getAttribute('content');
  if (metaId === videoId && metaDate) return metaDate;

  try {
    const html = await (await fetch(`/watch?v=${encodeURIComponent(videoId)}`)).text();
    return html.match(/"uploadDate":"([^"]+)"/)?.[1] ?? html.match(/"publishDate":"([^"]+)"/)?.[1] ?? null;
  } catch {
    return null;
  }
}

async function onClick(button: HTMLButtonElement): Promise<void> {
  const videoId = currentVideoId();
  if (!videoId) return;
  const title = readTitle();
  // Only look up the upload date when the title doesn't already have one.
  const uploadDate = parseTitleDate(title) ? null : await readUploadDate(videoId);
  if (currentVideoId() !== videoId) return; // user navigated away while we were fetching

  const result = matchGame(title, uploadDate, data);
  console.debug('[Teague Time]', { title, uploadDate, result });
  showPopup(button, summarize(result));
}

function injectButton(h1: Element): void {
  document.getElementById(BUTTON_ID)?.remove();
  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.type = 'button';
  button.textContent = 'Teague Time';
  button.title = 'Was Jeff Teague at this game?';
  button.style.cssText = 'margin-left:8px;font-size:12px;vertical-align:middle;cursor:pointer;';
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    void onClick(button);
  });
  h1.appendChild(button);
}

function onNavigate(): void {
  closePopup();
  titleObserver?.disconnect();
  titleObserver = null;
  if (!currentVideoId()) {
    document.getElementById(BUTTON_ID)?.remove();
    return;
  }

  // The title h1 may not exist yet (or may be re-rendered); wait for it, then inject once.
  const tryInject = (): boolean => {
    const h1 = document.querySelector(TITLE_SELECTOR);
    if (!h1) return false;
    injectButton(h1);
    return true;
  };
  if (tryInject()) return;
  titleObserver = new MutationObserver(() => {
    if (tryInject()) {
      titleObserver?.disconnect();
      titleObserver = null;
    }
  });
  titleObserver.observe(document.body, { childList: true, subtree: true });
}

// YouTube is a single-page app: this fires after every in-app navigation (not on full reloads).
document.addEventListener('yt-navigate-finish', onNavigate);
onNavigate();
