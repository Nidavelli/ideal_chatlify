export function createWelcomeEmailTemplate(name, clientURL) {
  // --- Twilight UI Dark Mode Variables Mapped for Email Inline Style ---
  const DARK_THEME = {
    colorPrimary: "#a283c7", // Ethereal Lavender
    colorPrimaryHover: "#b899e0",
    colorBgBase: "#1a1a2e",
    colorBgSurface: "#2c2c44",
    colorTextPrimary: "#e0e0e8",
    colorTextSecondary: "#a0a0b4",
    colorTextSubtle: "#6f6f87",
    colorBorder: "#3a3a5a",
    fontHeading: '"Cinzel", serif',
    fontBody: '"Spectral", serif',
    fontSizeBase: "16px", // Mapping clamp(1rem, ...) to a fixed size for email
    fontSizeLg: "20px", // Mapping clamp(1.375rem, ...) to a fixed size for email
    lineHeightBody: "1.6",
    borderRadiusLg: "16px",
    spacingLg: "1.5rem",
    spacingMd: "1rem",
    shadowLow: "0 4px 10px rgba(0,0,0,0.5)", // Simplified dark shadow
  };

  const primaryGradient = `linear-gradient(135deg, ${DARK_THEME.colorSecondary} 0%, ${DARK_THEME.colorPrimary} 100%)`;

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>An Invocation: Welcome to Messenger</title>
  </head>
  <body style="font-family: ${DARK_THEME.fontBody}; line-height: ${DARK_THEME.lineHeightBody}; color: ${DARK_THEME.colorTextSecondary}; max-width: 600px; margin: 0 auto; padding: 20px; background-color: ${DARK_THEME.colorBgBase};">
    
    <div style="background: ${primaryGradient}; padding: 30px; text-align: center; border-radius: ${DARK_THEME.borderRadiusLg} ${DARK_THEME.borderRadiusLg} 0 0;">
      <img src="https://img.freepik.com/free-vector/hand-drawn-message-element-vector-cute-sticker_53876-118344.jpg?t=st=1741295028~exp=1741298628~hmac=0d076f885d7095f0b5bc8d34136cd6d64749455f8cb5f29a924281bafc11b96c&w=1480" alt="Messenger Sigil" style="width: 80px; height: 80px; margin-bottom: 20px; border-radius: 50%; background-color: ${DARK_THEME.colorBgSurface}; padding: 10px; border: 3px solid ${DARK_THEME.colorTextPrimary};">
      <h1 style="color: ${DARK_THEME.colorTextPrimary}; margin: 0; font-size: 28px; font-weight: 700; font-family: ${DARK_THEME.fontHeading};">
        A New Realm Awaits
      </h1>
    </div>
    
    <div style="background-color: ${DARK_THEME.colorBgSurface}; padding: 35px; border-radius: 0 0 ${DARK_THEME.borderRadiusLg} ${DARK_THEME.borderRadiusLg}; box-shadow: ${DARK_THEME.shadowLow}; border: 1px solid ${DARK_THEME.colorBorder}; border-top: none;">
      <p style="font-size: ${DARK_THEME.fontSizeLg}; color: ${DARK_THEME.colorPrimary}; font-weight: 700;">
        <span style="font-family: ${DARK_THEME.fontHeading};">Greetings, Initiate ${name},</span>
      </p>
      
      <p style="font-size: ${DARK_THEME.fontSizeBase}; color: ${DARK_THEME.colorTextSecondary};">
        You have been successfully registered into the digital ether. Messenger connects you with fellow voyagers across the unseen world, allowing you to share whispered secrets and powerful incantations in real-time.
      </p>
      
      <div style="background-color: ${DARK_THEME.colorBgBase}; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid ${DARK_THEME.colorPrimary}; border-radius: 4px;">
        <p style="font-size: 16px; margin: 0 0 15px 0; color: ${DARK_THEME.colorTextPrimary}; font-weight: 700;">
          <strong>Steps for your First Invocation:</strong>
        </p>
        <ul style="padding-left: 20px; margin: 0; color: ${DARK_THEME.colorTextSecondary}; list-style: circle;">
          <li style="margin-bottom: 10px;">Forge your <b>Avatar</b> (Profile Picture)</li>
          <li style="margin-bottom: 10px;">Discover and bind your <b>Contacts</b></li>
          <li style="margin-bottom: 10px;">Whisper your first <b>Message</b></li>
          <li style="margin-bottom: 0;">Share digital relics (photos, videos, and more)</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${clientURL}" style="background: ${DARK_THEME.colorPrimary}; color: ${DARK_THEME.colorBgSurface}; text-decoration: none; padding: 12px 30px; border-radius: 50px; font-weight: 700; display: inline-block; font-size: 16px; border: 1px solid ${DARK_THEME.colorPrimary};">
          Unseal the Grimoire (Open Messenger)
        </a>
      </div>
      
      <p style="margin-bottom: 5px; color: ${DARK_THEME.colorTextSecondary};">
        Should the path be shrouded in mist, our Scribes are ready to illuminate the way.
      </p>
      <p style="margin-top: 0; color: ${DARK_THEME.colorTextSecondary};">
        May your messages find their mark!
      </p>
      
      <p style="margin-top: 25px; margin-bottom: 0; color: ${DARK_THEME.colorTextPrimary}; font-weight: 700;">
        The Conclave of Messenger Scribes
      </p>
    </div>
    
    <div style="text-align: center; padding: 20px 0; color: ${DARK_THEME.colorTextSubtle}; font-size: 12px;">
      <p style="margin: 0;">© 2025 Messenger Conclave. All rights reserved by the Digital Covenant.</p>
      <p style="margin: 10px 0 0 0;">
        <a href="#" style="color: ${DARK_THEME.colorPrimary}; text-decoration: none; margin: 0 10px;">Privacy Scroll</a>
        <span style="color: ${DARK_THEME.colorTextSubtle};">|</span>
        <a href="#" style="color: ${DARK_THEME.colorPrimary}; text-decoration: none; margin: 0 10px;">Terms of the Pact</a>
        <span style="color: ${DARK_THEME.colorTextSubtle};">|</span>
        <a href="#" style="color: ${DARK_THEME.colorPrimary}; text-decoration: none; margin: 0 10px;">Contact the Scribes</a>
      </p>
    </div>
  </body>
  </html>
  `;
}
