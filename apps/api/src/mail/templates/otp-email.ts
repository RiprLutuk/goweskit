import type { SendOtpRequest } from '@goweskit/contracts';

export function buildOtpEmailHtml(
  otpCode: string,
  purpose: SendOtpRequest['purpose'],
): { html: string; text: string } {
  const actionLabel =
    purpose === 'reset_password'
      ? 'mereset kata sandi akun GowesKit Anda'
      : 'menyelesaikan pendaftaran akun GowesKit Anda';

  const text = `Halo Rider!

Gunakan kode OTP berikut untuk ${actionLabel}:

>> ${otpCode} <<

Kode verifikasi ini hanya berlaku selama 5 menit.
Jangan pernah memberikan kode ini kepada siapapun demi keamanan akun dan data solo-ride Anda.

Salam gowes,
Tim GowesKit
Workshop & Safety Platform`;

  // Split OTP into 6 individual characters for pro telemetry grid display
  const digits = otpCode.split('').slice(0, 6);
  const digitCellsHtml = digits
    .map(
      (digit) => `
      <td align="center" valign="middle" style="width: 44px; height: 54px; background-color: #FFFFFF; border: 2px solid #17202A; border-radius: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 28px; font-weight: 900; color: #17202A; box-shadow: 0 3px 0 #17202A;">
        ${digit}
      </td>
    `,
    )
    .join('<td style="width: 8px;"></td>');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kode Keamanan Rider — GowesKit</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #17202A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8F6F0; padding: 36px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 500px; background-color: #FFFFFF; border: 1.5px solid #17202A; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 36px rgba(23, 32, 42, 0.08);">
          
          <!-- Pro Header Brand Bar -->
          <tr>
            <td style="background-color: #17202A; padding: 28px 32px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                <tr>
                  <!-- Monogram G-Wheel Badge -->
                  <td valign="middle" style="width: 40px; height: 40px; background-color: #24303E; border: 1.5px solid #C9F36A; border-radius: 12px; text-align: center;">
                    <div style="font-size: 20px; line-height: 1; display: inline-block;">⚡</div>
                  </td>
                  <!-- Brand Lockup -->
                  <td valign="middle" style="padding-left: 14px; text-align: left;">
                    <div style="font-size: 22px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.04em; line-height: 1.1;">
                      Gowes<span style="color: #8EDDF4;">Kit</span><span style="display: inline-block; width: 6px; height: 6px; background-color: #C9F36A; border-radius: 50%; margin-left: 4px; vertical-align: middle;"></span>
                    </div>
                    <div style="font-size: 10px; font-weight: 800; color: #94A3B8; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 2px;">
                      Workshop &amp; Safety Platform
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td style="padding: 36px 32px 28px 32px; text-align: center;">
              
              <!-- Badge Eyebrow -->
              <div style="display: inline-block; padding: 4px 14px; background-color: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 9999px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px;">
                🛡️ Autentikasi Rider
              </div>

              <h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 900; color: #17202A; letter-spacing: -0.03em; line-height: 1.2;">
                Kode Keamanan Akun
              </h1>
              
              <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.5; color: #475569; max-width: 380px; display: inline-block;">
                Gunakan kode OTP 6-digit di bawah ini untuk <strong>${actionLabel}</strong>.
              </p>

              <!-- Telemetry Digit Cluster -->
              <div style="background-color: #FAF9F5; border: 1.5px solid #E2E8F0; border-radius: 20px; padding: 24px 20px; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 14px;">
                  Kode Verifikasi OTP 6-Digit
                </div>
                
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                  <tr>
                    ${digitCellsHtml}
                  </tr>
                </table>
              </div>

              <!-- Expiry & Security Notice Banner -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FEF9C3; border: 1.5px solid #FACC15; border-radius: 14px; padding: 14px 16px; margin-bottom: 24px; text-align: left;">
                <tr>
                  <td valign="top" style="font-size: 18px; line-height: 1; padding-right: 10px;">⏱️</td>
                  <td style="font-size: 12.5px; color: #713F12; line-height: 1.45;">
                    <strong>Masa Berlaku:</strong> Kode ini hanya aktif selama <strong>5 menit</strong>. Jangan pernah memberikan kode ini kepada siapapun demi keamanan data sepeda &amp; solo-ride Anda.
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; color: #94A3B8; line-height: 1.5;">
                Jika Anda tidak merasa melakukan permintaan ini di GowesKit, Anda dapat mengabaikan email ini dengan aman.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 22px 32px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #475569;">
                GowesKit — Lightweight Cycling Knowledge, Workshop &amp; Safety
              </p>
              <p style="margin: 0; font-size: 11px; color: #94A3B8;">
                © ${String(new Date().getFullYear())} GowesKit Platform. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, text };
}
