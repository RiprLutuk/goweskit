export function buildOtpEmailHtml(otpCode: string): {
  html: string;
  text: string;
} {
  const actionLabel = 'menyelesaikan pendaftaran akun GowesKit Anda';

  const text = `Halo Rider!

Gunakan kode OTP berikut untuk ${actionLabel}:

${otpCode}

Kode ini berlaku selama 5 menit. Jangan bagikan kode ini kepada siapa pun demi keamanan akun Anda.

Salam gowes,
Tim GowesKit`;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kode Verifikasi GowesKit</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #181D27;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8F9FA; padding: 48px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 460px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E9EAEB; box-shadow: 0 1px 3px rgba(16, 24, 40, 0.06), 0 4px 12px rgba(16, 24, 40, 0.04); overflow: hidden;">
          
          <!-- Brand Header -->
          <tr>
            <td style="padding: 32px 36px 20px 36px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 32px; height: 32px; background-color: #17202A; border-radius: 8px; text-align: center; vertical-align: middle;">
                          <span style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 16px; font-weight: 900; color: #C9F36A; line-height: 1; display: inline-block;">G</span>
                        </td>
                        <td style="padding-left: 10px; vertical-align: middle;">
                          <span style="font-size: 18px; font-weight: 800; color: #17202A; letter-spacing: -0.03em;">Gowes<span style="color: #0F766E;">Kit</span></span>
                          <span style="display: inline-block; width: 5px; height: 5px; background-color: #C9F36A; border-radius: 50%; margin-left: 2px; vertical-align: baseline;"></span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 0 36px 36px 36px;">
              
              <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #181D27; letter-spacing: -0.02em;">
                Kode verifikasi Anda
              </h1>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.5; color: #535862;">
                Gunakan kode 6-digit berikut untuk ${actionLabel}:
              </p>

              <!-- Sleek Clean OTP Box -->
              <div style="background-color: #F8F9FA; border: 1px solid #E9EAEB; border-radius: 12px; padding: 18px 24px; text-align: center; margin-bottom: 24px;">
                <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #181D27; display: inline-block; padding-left: 8px;">
                  ${otpCode}
                </span>
              </div>

              <!-- Expiry & Safety Notice -->
              <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.5; color: #535862;">
                ⏱️ Kode ini hanya berlaku selama <strong>5 menit</strong>. Jangan bagikan kode ini kepada siapa pun.
              </p>

              <hr style="border: none; border-top: 1px solid #F0F1F2; margin: 24px 0;" />

              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #717680;">
                Jika Anda tidak meminta kode ini, Anda dapat mengabaikan email ini dengan aman.
              </p>

            </td>
          </tr>

        </table>

        <!-- Subtle Minimal Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 460px; margin-top: 24px;">
          <tr>
            <td style="text-align: center; font-size: 12px; color: #94969C; line-height: 1.5;">
              GowesKit — Workshop &amp; Safety Platform for Cyclists
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
