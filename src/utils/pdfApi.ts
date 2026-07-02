import api from './api';

/**
 * Fetches the dynamically-generated registration PDF and triggers a download.
 * PDFs are never stored — the backend renders on the fly from the DB.
 */
export async function downloadRegistrationPdf(applicationId: string, phone: string): Promise<void> {
  const res = await api.get('/registration-pdf', {
    params: { applicationId, phone },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${applicationId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Defer revocation so the download isn't cancelled before it starts (Safari).
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
