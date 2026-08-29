export function buildOtpEmailHtml(email: string, otpCode: string): { html: string; text: string } {
  const text = `Halo Rider!

Kode verifikasi OTP pendaftaran akun GowesKit Anda adalah: ${otpCode}

Kode ini berlaku selama 5 menit. Jangan bagikan kode ini kepada siapapun demi keamanan akun Anda.

Salam gowes,
Tim GowesKit`;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kode Verifikasi GowesKit</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFDF7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17202A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFDF7; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="520" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #FFFFFF; border: 1px solid #E5E0D8; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 30px rgba(23, 32, 42, 0.06);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #17202A; padding: 28px 32px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                <tr>
                  <td style="background-color: #C9F36A; width: 36px; height: 36px; border-radius: 10px; text-align: center; vertical-align: middle; font-size: 20px; font-weight: bold;">
                    🚲
                  </td>
                  <td style="padding-left: 12px; text-align: left;">
                    <span style="display: block; font-size: 22px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.03em;">Gowes<span style="color: #C9F36A;">Kit</span></span>
                    <span style="display: block; font-size: 11px; font-weight: 700; color: #8EDDF4; letter-spacing: 0.08em; text-transform: uppercase;">Workshop &amp; Safety</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px 28px 32px; text-align: center;">
              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 800; color: #17202A; letter-spacing: -0.02em;">Verifikasi Akun Rider Anda</h1>
              <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.5; color: #40505F;">
                Gunakan kode OTP 6-digit di bawah ini untuk menyelesaikan pendaftaran akun di <strong>${email}</strong>.
              </p>

              <!-- OTP Code Display Card -->
              <div style="background-color: #F8FAFC; border: 2px dashed #CBD5E1; border-radius: 16px; padding: 20px 24px; margin-bottom: 24px;">
                <span style="display: block; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">Kode Verifikasi OTP</span>
                <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 36px; font-weight: 900; letter-spacing: 0.2em; color: #17202A; display: inline-block; padding-left: 0.2em;">
                  ${otpCode}
                </span>
              </div>

              <!-- Expiry & Safety Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FEF3C7; border: 1px solid #FDE68A; border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: left;">
                <tr>
                  <td style="font-size: 13px; color: #92400E; line-height: 1.4;">
                    ⏱️ <strong>Masa Berlaku:</strong> Kode ini hanya valid selama <strong>5 menit</strong>. Jangan pernah membagikan kode ini kepada pihak manapun.
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; color: #94A3B8; line-height: 1.5;">
                Jika Anda tidak merasa mendaftar di GowesKit, Anda dapat mengabaikan email ini dengan aman.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748B;">
                © ${new Date().getFullYear()} GowesKit Platform · Lightweight Cycling Knowledge, Workshop &amp; Safety.
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
