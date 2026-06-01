// src/lib/notify.ts — Mock WhatsApp / SMS sender.
//
// Chapter 8 ships with a mock so the workflows can be tested
// without a Twilio or WhatsApp Business account. The real provider
// is a one-line replacement (see "Variations" in the chapter).
//
// Each call logs to stdout AND simulates a small network latency
// — useful for spotting workflows that hammer the API in a loop.

export async function sendWhatsApp(
  to: string,
  message: string,
): Promise<{ to: string; message: string; sentAt: string }> {
  console.log(`[WhatsApp → ${to}] ${message}`);
  await new Promise((resolve) => setTimeout(resolve, 50));
  return {
    to,
    message,
    sentAt: new Date().toISOString(),
  };
}
