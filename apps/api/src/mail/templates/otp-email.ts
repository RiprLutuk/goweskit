import type { SendOtpRequest } from '@goweskit/contracts';

export function buildOtpEmailHtml(
  otpCode: string,
  purpose: SendOtpRequest['purpose'],
): { html: string; text: string } {
  const actionLabel =
    purpose === 'reset_password'
      ? 'mereset kata sandi akun GowesKit Anda'
      : 'verifikasi dan pendaftaran akun GowesKit Anda';

  const text = `Halo Rider!

Gunakan kode OTP berikut untuk ${actionLabel}:

>> ${otpCode} <<

Kode ini berlaku selama 5 menit. Jangan bagikan kode ini kepada siapapun demi keamanan akun Anda.

Salam gowes,
Tim GowesKit
Workshop & Safety Platform`;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Kode Verifikasi GowesKit</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F6F5F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #17202A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F6F5F0; padding: 40px 16px;">
    <tr>
      <td align="center">
        
        <!-- Main Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 460px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid #E6E4DD; box-shadow: 0 4px 20px rgba(23, 32, 42, 0.04); overflow: hidden;">
          
          <!-- Top Header Brand -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #F0EFE9;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <!-- Monogram G Badge -->
                        <td style="width: 36px; height: 36px; background-color: #17202A; border-radius: 10px; text-align: center; vertical-align: middle;">
                          <span style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 18px; font-weight: 900; color: #C9F36A; line-height: 1; display: inline-block;">G</span>
                        </td>
                        <!-- Wordmark -->
                        <td style="padding-left: 12px; vertical-align: middle;">
                          <span style="font-size: 20px; font-weight: 900; color: #17202A; letter-spacing: -0.03em;">Gowes<span style="color: #0F766E;">Kit</span></span>
                          <span style="display: inline-block; width: 6px; height: 6px; background-color: #C9F36A; border-radius: 50%; margin-left: 2px; vertical-align: middle;"></span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; font-size: 10px; font-weight: 800; color: #64748B; background-color: #F1F5F9; border: 1px solid #E2E8F0; padding: 4px 10px; border-radius: 9999px; letter-spacing: 0.06em; text-transform: uppercase;">
                      Rider Security
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 32px 36px 32px;">
              
              <h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 800; color: #17202A; letter-spacing: -0.03em; line-height: 1.25;">
                Verifikasi Akun Anda
              </h1>
              
              <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.55; color: #4B5563;">
                Gunakan kode OTP 6-digit berikut untuk ${actionLabel}:
              </p>

              <!-- Pro Cycling Telemetry HUD Code Box -->
              <div style="background-color: #17202A; border: 1.5px solid #24303E; border-radius: 16px; padding: 24px 20px; text-align: center; margin-bottom: 24px; box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);">
                <div style="font-size: 11px; font-weight: 800; color: #8EDDF4; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px;">
                  Kode Verifikasi OTP
                </div>
                <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #C9F36A; line-height: 1; padding-left: 10px;">
                  ${otpCode}
                </div>
                <div style="font-size: 10.5px; font-weight: 700; color: #94A3B8; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 10px;">
                  ⏱️ Berlaku 5 Menit · Single-Use
                </div>
              </div>

              <!-- Security Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px 16px; margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 12.5px; line-height: 1.5; color: #475569;">
                    🔒 <strong>Keamanan:</strong> Jangan berikan kode ini kepada siapapun termasuk pihak GowesKit demi keamanan garasi dan data solo-ride Anda.
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #94A3B8;">
                Jika Anda tidak merasa meminta kode ini, Anda dapat mengabaikan email ini dengan aman.
              </p>

            </td>
          </tr>

        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 460px; margin-top: 24px;">
          <tr>
            <td align="center" style="font-size: 11.5px; color: #94A3B8; line-height: 1.5;">
              <strong>GowesKit</strong> · Workshop &amp; Safety Platform for Cyclists<br>
              © ${String(new Date().getFullYear())} GowesKit. All rights reserved.
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
