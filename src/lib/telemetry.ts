// Sends one anonymous record per finished playthrough to Supabase, so the
// PRD's success metrics (finish rate, time, first-try accuracy...) can be
// measured. No names, no device IDs. If Supabase isn't configured or the
// player is offline, nothing happens and the game carries on.

export interface Playthrough {
  case_id: string;
  outcome: "solved" | "escaped";
  duration_s: number;
  wrong_accusations: number;
  released_count: number;
  key_clues_pct: number;
  used_confront: boolean;
  rank: string;
  wants_more: boolean | null;
  app_version: string;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function sendPlaythrough(p: Playthrough): Promise<boolean> {
  if (!url || !key) return false;
  try {
    const res = await fetch(`${url}/rest/v1/playthroughs`, {
      method: "POST",
      headers: {
        apikey: key,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(p),
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}
