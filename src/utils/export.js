import html2canvas from "html2canvas";

/**
 * Export a DOM element to PNG and trigger download.
 * @param {HTMLElement} element - The element to capture.
 */
export const exportToPng = async (element) => {
  if (!element) return;
  const canvas = await html2canvas(element, { backgroundColor: null });
  const imgData = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = imgData;
  link.download = 'export.png';
  link.click();
};

/**
 * Export a DOM element to PDF (A4 size) using a new window and print.
 * @param {HTMLElement} element - The element to capture.
 */
export const exportToPdf = async (element) => {
  if (!element) return;
  const canvas = await html2canvas(element, { backgroundColor: null });
  const imgData = canvas.toDataURL('image/png');
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>Export PDF</title></head>
    <body style="margin:0;padding:0;display:flex;justify-content:center;align-items:center;background:#fff;">
      <img src="${imgData}" style="max-width:100%;height:auto;"/>
    </body></html>`);
  win.document.close();
  win.onload = () => {
    setTimeout(() => win.print(), 500);
  };
};

/**
 * Export both PNG and PDF sequentially.
 */
export const exportToPdfAndPng = async (element) => {
  if (!element) return;
  await exportToPng(element);
  await exportToPdf(element);
};
