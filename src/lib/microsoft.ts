const GRAPH_API_URL = "https://graph.microsoft.com/v1.0";

interface MicrosoftConfig {
  accessToken: string;
}

async function graphRequest(config: MicrosoftConfig, endpoint: string, options?: RequestInit) {
  const response = await fetch(`${GRAPH_API_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Microsoft Graph API error: ${response.status}`);
  }
  return response.json();
}

// ============================================
// OUTLOOK CALENDAR
// ============================================

export interface OutlookEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName: string };
  body?: { content: string };
}

export async function fetchOutlookEvents(
  config: MicrosoftConfig,
  startDate: string,
  endDate: string
): Promise<OutlookEvent[]> {
  const data = await graphRequest(
    config,
    `/me/calendarView?startDateTime=${startDate}&endDateTime=${endDate}&$top=50&$orderby=start/dateTime`
  );
  return data.value;
}

export async function createOutlookEvent(
  config: MicrosoftConfig,
  event: {
    subject: string;
    start: string;
    end: string;
    location?: string;
    body?: string;
  }
): Promise<OutlookEvent> {
  return graphRequest(config, "/me/events", {
    method: "POST",
    body: JSON.stringify({
      subject: event.subject,
      start: { dateTime: event.start, timeZone: "Europe/Paris" },
      end: { dateTime: event.end, timeZone: "Europe/Paris" },
      location: event.location ? { displayName: event.location } : undefined,
      body: event.body ? { contentType: "text", content: event.body } : undefined,
    }),
  });
}

// ============================================
// TEAMS MESSAGES
// ============================================

export interface TeamsChannel {
  id: string;
  displayName: string;
  description?: string;
}

export interface TeamsMessage {
  id: string;
  body: { content: string };
  from?: { user?: { displayName: string } };
  createdDateTime: string;
}

export async function fetchTeamsChannels(
  config: MicrosoftConfig,
  teamId: string
): Promise<TeamsChannel[]> {
  const data = await graphRequest(config, `/teams/${teamId}/channels`);
  return data.value;
}

export async function fetchTeamsMessages(
  config: MicrosoftConfig,
  teamId: string,
  channelId: string
): Promise<TeamsMessage[]> {
  const data = await graphRequest(
    config,
    `/teams/${teamId}/channels/${channelId}/messages?$top=25`
  );
  return data.value;
}

export async function sendTeamsMessage(
  config: MicrosoftConfig,
  teamId: string,
  channelId: string,
  content: string
): Promise<void> {
  await graphRequest(config, `/teams/${teamId}/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body: { content } }),
  });
}

// ============================================
// TEAMS / JOINED TEAMS
// ============================================

export interface Team {
  id: string;
  displayName: string;
  description?: string;
}

export async function fetchJoinedTeams(config: MicrosoftConfig): Promise<Team[]> {
  const data = await graphRequest(config, "/me/joinedTeams");
  return data.value;
}
