import { format } from "date-fns";

function toGoogleDate(d: Date): string {
  return format(d, "yyyyMMdd'T'HHmmss");
}

export function googleCalendarUrl(event: {
  title: string;
  description?: string | null;
  start_at: string;
  end_at?: string | null;
  location?: string | null;
  is_online?: boolean | null;
  meeting_url?: string | null;
}): string {
  const start = new Date(event.start_at);
  const end = event.end_at ? new Date(event.end_at) : new Date(start.getTime() + 60 * 60 * 1000);
  const loc = event.location ?? (event.is_online ? "En ligne" : "");
  const details = [event.description ?? "", event.meeting_url ? `Lien: ${event.meeting_url}` : ""].filter(Boolean).join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toGoogleDate(start)}/${toGoogleDate(end)}`,
    details,
    location: loc,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function outlookCalendarUrl(event: {
  title: string;
  description?: string | null;
  start_at: string;
  end_at?: string | null;
  location?: string | null;
  is_online?: boolean | null;
  meeting_url?: string | null;
}): string {
  const start = new Date(event.start_at);
  const end = event.end_at ? new Date(event.end_at) : new Date(start.getTime() + 60 * 60 * 1000);
  const loc = event.location ?? (event.is_online ? "En ligne" : "");
  const body = [event.description ?? "", event.meeting_url ? `Lien: ${event.meeting_url}` : ""].filter(Boolean).join("\n");

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body,
    location: loc,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
