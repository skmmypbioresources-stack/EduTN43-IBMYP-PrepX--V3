// QR Code Generation and Dedicated Print Service
import QRCode from 'qrcode';
import { ClassSection } from '../types';
import { getQRTargetBaseUrl } from './storageService';

export const generateClassQRDataUrl = async (classId: string, customBaseUrl?: string): Promise<string> => {
  const baseUrl = (customBaseUrl && customBaseUrl.trim().length > 0)
    ? customBaseUrl.trim().replace(/\/+$/, '')
    : getQRTargetBaseUrl();

  const targetUrl = `${baseUrl}/?classId=${encodeURIComponent(classId)}&creator=SKM`;
  return QRCode.toDataURL(targetUrl, {
    width: 350,
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'H'
  });
};

export const printQRCardsSheet = async (classes: ClassSection[], wingName: string, customBaseUrl?: string) => {
  const baseUrl = (customBaseUrl && customBaseUrl.trim().length > 0)
    ? customBaseUrl.trim().replace(/\/+$/, '')
    : getQRTargetBaseUrl();

  // Generate all QR Data URLs in parallel
  const cardsData = await Promise.all(
    classes.map(async (cls) => {
      const qrDataUrl = await generateClassQRDataUrl(cls.id, baseUrl);
      const targetUrl = `${baseUrl}/?classId=${encodeURIComponent(cls.id)}&creator=SKM`;
      return {
        cls,
        qrDataUrl,
        targetUrl
      };
    })
  );

  // Build the complete printable HTML document
  const printableHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GSIS PrepX QR Cards - ${wingName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
    
    @page {
      size: A4 portrait;
      margin: 8mm;
    }
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      color: #0f172a;
    }

    .header-banner {
      text-align: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #0f172a;
    }

    .school-title {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 0 0 2px 0;
      color: #0f172a;
    }

    .doc-subtitle {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0;
    }

    .grid-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .qr-card {
      border: 2px solid #0f172a;
      border-radius: 12px;
      padding: 12px 10px 10px;
      text-align: center;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      page-break-inside: avoid;
      break-inside: avoid;
      min-height: 250px;
      position: relative;
    }

    .wing-pill {
      position: absolute;
      top: 6px;
      right: 6px;
      font-size: 9px;
      font-weight: 800;
      background: #f1f5f9;
      color: #334155;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
    }

    .grade-title {
      font-size: 18px;
      font-weight: 900;
      text-transform: uppercase;
      margin: 0 0 4px 0;
      color: #0f172a;
      line-height: 1.1;
    }

    .section-badge {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 12px;
      border-radius: 9999px;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    .qr-image {
      width: 140px;
      height: 140px;
      display: block;
      margin: 2px auto 6px;
      border-radius: 6px;
    }

    .footer-label {
      font-size: 8.5px;
      font-weight: 800;
      color: #475569;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 0;
    }

    .sub-meta {
      font-size: 7.5px;
      color: #94a3b8;
      font-weight: 600;
      margin-top: 2px;
    }

    @media print {
      .no-print {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }

    .print-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #0f172a;
      color: white;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
    }

    .print-btn {
      background: #10b981;
      color: white;
      font-weight: 700;
      font-size: 14px;
      padding: 8px 20px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
    }

    .content-wrap {
      margin-top: 0;
    }
  </style>
</head>
<body>
  <div class="content-wrap">
    <div class="header-banner">
      <h1 class="school-title">Good Shepherd International School (GSIS)</h1>
      <p class="doc-subtitle">Prep Duty Classroom Entrance QR Cards &middot; ${wingName} Wing</p>
    </div>

    <div class="grid-container">
      ${cardsData
        .map(
          ({ cls, qrDataUrl }) => `
        <div class="qr-card">
          <div class="wing-pill">${cls.wing}</div>
          <div>
            <h2 class="grade-title">${cls.grade}</h2>
            <div class="section-badge">SECTION ${cls.section}</div>
          </div>
          <img src="${qrDataUrl}" alt="QR Code ${cls.grade} ${cls.section}" class="qr-image" />
          <div>
            <p class="footer-label">Scan with PrepX to Enter Class</p>
            <p class="sub-meta">${cls.students?.length || 0} Students Enrolled &middot; Creator SKM</p>
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;

  // Create a hidden iframe or open popup window to print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printableHtml);
    printWindow.document.close();
  } else {
    // If popup was blocked by browser iframe restrictions, use invisible iframe fallback
    const existingIframe = document.getElementById('qr-print-frame');
    if (existingIframe) existingIframe.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'qr-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(printableHtml);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 600);
    }
  }
};
