// Email Templates for SalonBooker
// These are HTML email templates for various booking notifications

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export function bookingConfirmationEmail(
  customerName: string,
  serviceName: string,
  date: string,
  time: string,
  salonName: string = 'HairsalonX'
): EmailTemplate {
  return {
    subject: `Afspraakverzoek ontvangen - ${salonName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Afspraakverzoek</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0f172a; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .detail-row:last-child { border-bottom: none; }
    .button { display: inline-block; background: #0f172a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✂️ ${salonName}</h1>
    </div>
    <div class="content">
      <h2>Beste ${customerName},</h2>
      <p>Bedankt voor je afspraakverzoek! We hebben je boeking ontvangen en zullen deze zo snel mogelijk bevestigen.</p>
      
      <div class="details">
        <h3>Jouw afspraak</h3>
        <div class="detail-row">
          <span><strong>Behandeling:</strong></span>
          <span>${serviceName}</span>
        </div>
        <div class="detail-row">
          <span><strong>Datum:</strong></span>
          <span>${date}</span>
        </div>
        <div class="detail-row">
          <span><strong>Tijd:</strong></span>
          <span>${time}</span>
        </div>
        <div class="detail-row">
          <span><strong>Status:</strong></span>
          <span style="color: #d97706;">⏳ In afwachting van bevestiging</span>
        </div>
      </div>
      
      <p>Je ontvangt een email zodra je afspraak definitief is bevestigd.</p>
      
      <p>Wil je je afspraak wijzigen of annuleren? Bel ons dan op <strong>06-12345678</strong>.</p>
      
      <div class="footer">
        <p>Met vriendelijke groet,<br><strong>${salonName}</strong></p>
        <p style="font-size: 12px; margin-top: 20px;">
          Hoofdstraat 123, 6041 AB Roermond<br>
          info@hairsalonx.nl | www.hairsalonx.nl
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Beste ${customerName},

Bedankt voor je afspraakverzoek bij ${salonName}!

Jouw afspraak:
- Behandeling: ${serviceName}
- Datum: ${date}
- Tijd: ${time}
- Status: In afwachting van bevestiging

Je ontvangt een email zodra je afspraak definitief is bevestigd.

Wil je je afspraak wijzigen of annuleren? Bel ons dan op 06-12345678.

Met vriendelijke groet,
${salonName}
Hoofdstraat 123, 6041 AB Roermond
info@hairsalonx.nl | www.hairsalonx.nl
    `
  }
}

export function bookingConfirmedEmail(
  customerName: string,
  serviceName: string,
  date: string,
  time: string,
  salonName: string = 'HairsalonX'
): EmailTemplate {
  return {
    subject: `✅ Afspraak bevestigd - ${salonName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Afspraak Bevestigd</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #22c55e; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; border: 2px solid #22c55e; }
    .success-icon { font-size: 60px; margin-bottom: 10px; }
    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .detail-row:last-child { border-bottom: none; }
    .button { display: inline-block; background: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-icon">✓</div>
      <h1>Afspraak Bevestigd!</h1>
    </div>
    <div class="content">
      <h2>Beste ${customerName},</h2>
      <p style="font-size: 18px;">Geweldig nieuws! Je afspraak is <strong>bevestigd</strong>. We zien je graag op de afgesproken tijd.</p>
      
      <div class="details">
        <h3>Jouw bevestigde afspraak</h3>
        <div class="detail-row">
          <span><strong>Behandeling:</strong></span>
          <span>${serviceName}</span>
        </div>
        <div class="detail-row">
          <span><strong>Datum:</strong></span>
          <span>${date}</span>
        </div>
        <div class="detail-row">
          <span><strong>Tijd:</strong></span>
          <span>${time}</span>
        </div>
        <div class="detail-row">
          <span><strong>Status:</strong></span>
          <span style="color: #22c55e;">✅ Bevestigd</span>
        </div>
      </div>
      
      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <strong>📍 Locatie:</strong><br>
        Hoofdstraat 123<br>
        6041 AB Roermond
      </div>
      
      <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <strong>💡 Tip:</strong><br>
        Kom 5 minuten voor je afspraak aan zodat we relaxed kunnen beginnen.
      </div>
      
      <div class="footer">
        <p>Met vriendelijke groet,<br><strong>${salonName}</strong></p>
        <p style="font-size: 12px; margin-top: 20px;">
          Hoofdstraat 123, 6041 AB Roermond<br>
          📞 06-12345678<br>
          ✉️ info@hairsalonx.nl
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
    text: `
✅ AFSpraak Bevestigd!

Beste ${customerName},

Geweldig nieuws! Je afspraak is BEVESTIGD. We zien je graag op de afgesproken tijd.

Jouw bevestigde afspraak:
- Behandeling: ${serviceName}
- Datum: ${date}
- Tijd: ${time}
- Status: ✅ Bevestigd

📍 Locatie:
Hoofdstraat 123
6041 AB Roermond

💡 Tip: Kom 5 minuten voor je afspraak aan zodat we relaxed kunnen beginnen.

Wil je je afspraak wijzigen? Bel ons op 06-12345678.

Met vriendelijke groet,
${salonName}
    `
  }
}

export function bookingCancelledEmail(
  customerName: string,
  serviceName: string,
  date: string,
  time: string,
  salonName: string = 'HairsalonX',
  reason?: string
): EmailTemplate {
  return {
    subject: `❌ Afspraak geannuleerd - ${salonName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Afspraak Geannuleerd</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fef2f2; padding: 30px; border-radius: 0 0 8px 8px; border: 2px solid #ef4444; }
    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; opacity: 0.7; }
    .button { display: inline-block; background: #0f172a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Afspraak Geannuleerd</h1>
    </div>
    <div class="content">
      <h2>Beste ${customerName},</h2>
      <p>Je afspraak is geannuleerd.</p>
      
      ${reason ? `<p style="background: #fff; padding: 15px; border-radius: 8px;"><strong>Reden:</strong> ${reason}</p>` : ''}
      
      <div class="details">
        <h3>Geannuleerde afspraak</h3>
        <p><strong>Behandeling:</strong> ${serviceName}</p>
        <p><strong>Datum:</strong> ${date}</p>
        <p><strong>Tijd:</strong> ${time}</p>
      </div>
      
      <p>Wil je een nieuwe afspraak maken? Klik op de knop hieronder:</p>
      
      <a href="https://hairsalonx.nl" class="button">Nieuwe afspraak maken</a>
      
      <div class="footer">
        <p>Met vriendelijke groet,<br><strong>${salonName}</strong></p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Beste ${customerName},

Je afspraak is geannuleerd.

${reason ? `Reden: ${reason}\n` : ''}
Geannuleerde afspraak:
- Behandeling: ${serviceName}
- Datum: ${date}
- Tijd: ${time}

Wil je een nieuwe afspraak maken? Bezoek https://hairsalonx.nl

Met vriendelijke groet,
${salonName}
    `
  }
}

export function bookingReminderEmail(
  customerName: string,
  serviceName: string,
  date: string,
  time: string,
  salonName: string = 'HairsalonX'
): EmailTemplate {
  return {
    subject: `⏰ Herinnering: Afspraak morgen - ${salonName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Afspraak Herinnering</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #d97706; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fffbeb; padding: 30px; border-radius: 0 0 8px 8px; }
    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #d97706; }
    .button { display: inline-block; background: #0f172a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Herinnering</h1>
    </div>
    <div class="content">
      <h2>Beste ${customerName},</h2>
      <p style="font-size: 18px;">Dit is een vriendelijke herinnering voor je afspraak <strong>morgen</strong>!</p>
      
      <div class="details">
        <h3>Jouw afspraak</h3>
        <p><strong>📅 Datum:</strong> ${date}</p>
        <p><strong>🕐 Tijd:</strong> ${time}</p>
        <p><strong>💇 Behandeling:</strong> ${serviceName}</p>
      </div>
      
      <div style="background: #fef3c7; padding: 15px; border-radius: 8px;">
        <strong>📍 Locatie:</strong><br>
        Hoofdstraat 123, 6041 AB Roermond
      </div>
      
      <p>Kun je niet komen? Bel ons dan zo snel mogelijk op <strong>06-12345678</strong>.</p>
      
      <div class="footer">
        <p>Tot morgen!<br><strong>${salonName}</strong></p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
    text: `
⏰ HERINNERING

Beste ${customerName},

Dit is een vriendelijke herinnering voor je afspraak MORGEN!

Jouw afspraak:
- 📅 Datum: ${date}
- 🕐 Tijd: ${time}
- 💇 Behandeling: ${serviceName}

📍 Locatie:
Hoofdstraat 123, 6041 AB Roermond

Kun je niet komen? Bel ons dan zo snel mogelijk op 06-12345678.

Tot morgen!
${salonName}
    `
  }
}

export function welcomeEmail(
  customerName: string,
  salonName: string = 'HairsalonX'
): EmailTemplate {
  return {
    subject: `Welkom bij ${salonName}!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welkom</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0f172a; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fdf2f8; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #d4a574; color: #0f172a; padding: 15px 40px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ Welkom bij ${salonName}</h1>
    </div>
    <div class="content">
      <h2>Beste ${customerName},</h2>
      <p>Welkom bij ${salonName}! We zijn verheugd dat je voor ons kiest voor je haarverzorging.</p>
      
      <p>Bij ons staat jouw tevredenheid centraal. Of je nu een knipbeurt, kleurbehandeling of een complete metamorfose wilt - wij zorgen ervoor dat je stralend de salon verlaat.</p>
      
      <div style="text-align: center;">
        <a href="https://hairsalonx.nl" class="button">Maak direct een afspraak</a>
      </div>
      
      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Onze diensten</h3>
        <ul>
          <li>✂️ Knippen dames, heren & kinderen</li>
          <li>🎨 Kleurbehandelingen</li>
          <li>✨ Highlights & Balayage</li>
          <li>💆 Haarverzorging</li>
        </ul>
      </div>
      
      <div class="footer">
        <p>We kijken ernaar uit je te verwelkomen!<br><strong>${salonName}</strong></p>
        <p>📞 06-12345678 | ✉️ info@hairsalonx.nl</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Welkom bij ${salonName}!

Beste ${customerName},

Welkom bij ${salonName}! We zijn verheugd dat je voor ons kiest voor je haarverzorging.

Bij ons staat jouw tevredenheid centraal. Of je nu een knipbeurt, kleurbehandeling of een complete metamorfose wilt - wij zorgen ervoor dat je stralend de salon verlaat.

Maak direct een afspraak: https://hairsalonx.nl

Onze diensten:
- Knippen dames, heren & kinderen
- Kleurbehandelingen
- Highlights & Balayage
- Haarverzorging

We kijken ernaar uit je te verwelkomen!

${salonName}
📞 06-12345678
✉️ info@hairsalonx.nl
    `
  }
}
