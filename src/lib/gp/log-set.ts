/** Fields the kiosk form sends for one exercise. One set only. */
export interface LogSessionExerciseInput {
  exerciseId: string;
  weight?: number;
  reps?: number;
  time_seconds?: number;
  time?: number;
  distance?: number;
}

export function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
