/**
 * Security & Anti-Inspection Shield
 * - Disables Right-Click context menu
 * - Blocks F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Cmd+Opt+I/J/C/U
 * - Suppresses browser console logs and outputs
 * - Cleans and prevents source inspection
 */

export function initSecurityShield(): void {
  if (typeof window === 'undefined') return;

  // 1. Right Click (Context Menu) Engelleme
  document.addEventListener(
    'contextmenu',
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    },
    { capture: true }
  );

  // 2. F12 ve İncele Kısayollarını Engelleme
  window.addEventListener(
    'keydown',
    (e) => {
      // F12 tuşu
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd) {
        const key = (e.key || '').toLowerCase();

        // Ctrl+Shift+I (İncele / Elements)
        // Ctrl+Shift+J (Konsol)
        // Ctrl+Shift+C (Öğe Seçici)
        // Ctrl+Shift+K (Firefox Konsol)
        if (e.shiftKey && (key === 'i' || key === 'j' || key === 'c' || key === 'k')) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        // Ctrl+U (Sayfa Kaynağını Görüntüle / View Source)
        if (key === 'u') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        // Ctrl+S (Sayfayı Kaydet)
        if (key === 's') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    },
    { capture: true }
  );

  // 3. Konsol Çıktılarını ve Hata/Bilgi Dökümlerini Susturma
  const noop = () => {};
  try {
    console.log = noop;
    console.info = noop;
    console.debug = noop;
    console.dir = noop;
    console.table = noop;
  } catch {}

  // 4. Konsolu periyodik olarak temiz tutma
  setInterval(() => {
    try {
      console.clear();
    } catch {}
  }, 1500);
}
