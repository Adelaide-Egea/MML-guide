// Ways to hand a caregiver link to someone once it is ready.
//
// Phones (iPhone above all) only open the share sheet or write to the clipboard
// straight after a tap. Making the link takes a moment (server + photos), so by
// the time it is ready that tap has expired. We therefore show the link with
// buttons the parent taps again, plus plain WhatsApp / text links that always work.

/** The message that goes with the link. Plain, short, UK English. */
export function caregiverMessage(caregiverName: string, url: string): string {
  const name = caregiverName.trim();
  const hello = name ? `Hi ${name}, here` : 'Here';
  return `${hello} is everything you need while I am out: ${url}`;
}

/** Opens WhatsApp with the message ready; the parent picks the contact. */
export function whatsappHref(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/** Opens the phone's text app. `sms:?&body=` works on both iPhone and Android. */
export function smsHref(message: string): string {
  return `sms:?&body=${encodeURIComponent(message)}`;
}

/** Opens the mail app with the message as the body. */
export function mailHref(subject: string, message: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}

/** True when the parent simply closed the share sheet — not an error. */
export function isShareCancel(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}
