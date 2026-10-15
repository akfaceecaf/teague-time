import type { Summary } from '../core/summary';

const POPUP_ID = 'teague-time-popup';

function onOutsideClick(e: MouseEvent): void {
  const popup = document.getElementById(POPUP_ID);
  if (popup && !popup.contains(e.target as Node)) closePopup();
}

export function closePopup(): void {
  document.getElementById(POPUP_ID)?.remove();
  document.removeEventListener('click', onOutsideClick);
}

export function showPopup(anchor: HTMLElement, summary: Summary): void {
  closePopup();

  const popup = document.createElement('div');
  popup.id = POPUP_ID;
  popup.setAttribute('role', 'dialog');
  popup.style.cssText =
    'position:absolute;z-index:9999;max-width:360px;padding:12px 14px;background:#fff;color:#111;' +
    'border:1px solid #ccc;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.2);font:14px/1.4 sans-serif;';

  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '✕';
  close.setAttribute('aria-label', 'Close');
  close.style.cssText = 'float:right;border:none;background:none;cursor:pointer;font-size:14px;';
  close.addEventListener('click', closePopup);

  const headline = document.createElement('strong');
  headline.textContent = summary.headline;

  popup.append(close, headline);
  for (const line of summary.details) {
    const p = document.createElement('p');
    p.textContent = line;
    p.style.cssText = 'margin:6px 0 0;color:#444;font-size:13px;';
    popup.append(p);
  }

  const rect = anchor.getBoundingClientRect();
  popup.style.top = `${rect.bottom + window.scrollY + 6}px`;
  popup.style.left = `${rect.left + window.scrollX}px`;
  document.body.append(popup);

  // Defer so the click that opened the popup doesn't immediately close it.
  setTimeout(() => document.addEventListener('click', onOutsideClick));
}
