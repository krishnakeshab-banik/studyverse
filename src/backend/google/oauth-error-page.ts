export function googleOAuthErrorHtml(title: string, message: string): string {
  const safeTitle = title.replace(/</g, "&lt;");
  const safeMessage = message.replace(/</g, "&lt;");
  return `<!DOCTYPE html>
<html>
  <head><title>${safeTitle}</title></head>
  <body style="background:#080808;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
    <div style="text-align:center;background:#0c0c0c;border:1px solid rgba(255,255,255,0.08);padding:40px;border-radius:20px;max-width:420px;">
      <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
      <h1 style="font-size:20px;margin-bottom:12px;">${safeTitle}</h1>
      <p style="color:#a0a0a0;font-size:13px;line-height:1.6;margin-bottom:20px;">${safeMessage}</p>
      <p style="color:#666;font-size:12px;">You can close this window.</p>
    </div>
    <script>
      if (window.opener) {
        window.opener.postMessage({ type: "GOOGLE_CALENDAR_ERROR", error: ${JSON.stringify(message)} }, window.location.origin);
      }
    </script>
  </body>
</html>`;
}
