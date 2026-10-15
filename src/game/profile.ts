export type Profile = {
  name: string;
  number: string;
  tag: string;
  km: number;
  rating: number;
};

export type DriveSample = {
  km: number;
  walls: number;
  off: number;
  wrong: number;
};

const KEY = "roots-profile-v1";

export const DEFAULT_PROFILE: Profile = {
  name: "FAHRER",
  number: "27",
  tag: "RTS",
  km: 0,
  rating: 50,
};

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw) as Partial<Profile>;
    return sanitize({ ...DEFAULT_PROFILE, ...parsed });
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile: Profile): Profile {
  const next = sanitize(profile);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  return next;
}

export function sanitize(profile: Profile): Profile {
  const name = profile.name.replace(/\s+/g, " ").trim().slice(0, 16) || DEFAULT_PROFILE.name;
  const number = profile.number.replace(/\D/g, "").slice(0, 2) || "0";
  const tag = profile.tag
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 3)
    .padEnd(3, "X");
  const km = Number.isFinite(profile.km) ? Math.max(0, profile.km) : 0;
  const rating = Number.isFinite(profile.rating) ? Math.max(0, Math.min(100, Math.round(profile.rating))) : 50;
  return { name, number, tag, km, rating };
}

export function applyDrive(profile: Profile, sample: DriveSample): Profile {
  const km = profile.km + Math.max(0, sample.km);
  if (sample.km < 0.02) return { ...profile, km };
  const penalty = sample.walls * 8 + sample.off * 6 + sample.wrong * 4;
  const judged = Math.max(0, Math.min(100, 92 - penalty));
  const weight = Math.min(0.45, sample.km / 4);
  const rating = Math.round(profile.rating * (1 - weight) + judged * weight);
  return { ...profile, km, rating: Math.max(0, Math.min(100, rating)) };
}

export function gradeOf(profile: Profile): { grade: string; line: string } {
  if (profile.km < 1) return { grade: "—", line: "Zu wenig Strecke. Ein Kilometer, dann urteilt die Linie." };
  if (profile.rating >= 90) return { grade: "S", line: "Sauber. Hosts können das später als Minimum setzen." };
  if (profile.rating >= 75) return { grade: "A", line: "Konstant. Wenig Drama in der Linie." };
  if (profile.rating >= 60) return { grade: "B", line: "Solide, mit ein paar Ecken." };
  if (profile.rating >= 40) return { grade: "C", line: "Wild. Die Mauern kennen dich." };
  return { grade: "D", line: "Unkalkulierbar. Hosts würden filtern." };
}
