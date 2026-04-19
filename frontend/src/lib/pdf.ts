// Shared helpers for requesting the board-brief PDF and triggering a
// browser download or preview tab.

const PDF_ENDPOINT = 'http://localhost:3001/api/export-pdf';

async function fetchPdfBlob(payload: any): Promise<Blob> {
  const res = await fetch(PDF_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
  });
  if (!res.ok) {
    throw new Error(`PDF export failed: HTTP ${res.status}`);
  }
  const blob = await res.blob();
  if (blob.type && !blob.type.includes('pdf')) {
    throw new Error(`Unexpected response type: ${blob.type}`);
  }
  return blob;
}

function slugify(s: string): string {
  return (s || 'deal_brief')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'deal_brief';
}

export async function downloadBrief(payload: any, filenameHint?: string): Promise<void> {
  const blob = await fetchPdfBlob(payload);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(filenameHint || 'deal_brief')}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function previewBrief(payload: any): Promise<void> {
  const blob = await fetchPdfBlob(payload);
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win) {
    // Popup blocked — fall back to download.
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
