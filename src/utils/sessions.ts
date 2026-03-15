export interface Session {
  name: string;
  start: string; // "HH:mm" UTC
  end: string;   // "HH:mm" UTC
  color: string;
}

export const SESSIONS: Session[] = [
  { name: 'London', start: '08:00', end: '17:00', color: '#38bdf8' }, // Soft Blue
  { name: 'New York', start: '13:00', end: '22:00', color: '#22c55e' }, // Soft Green
];

// Returns true if current time is within HH:mm window
export const isInSession = (time: number, startStr: string, endStr: string): boolean => {
  const date = new Date(time * 1000);
  const h = date.getUTCHours();
  const m = date.getUTCMinutes();
  const currentMins = h * 60 + m;

  const [sh, sm] = startStr.split(':').map(Number);
  const [eh, em] = endStr.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;

  if (startMins <= endMins) {
    return currentMins >= startMins && currentMins < endMins;
  }
  
  // Overnight
  return currentMins >= startMins || currentMins < endMins;
};

export const getDayName = (time: number): string => {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(new Date(time * 1000));
};

export const isNewDay = (prevTime: number, currentTime: number): boolean => {
  const prevDate = new Date(prevTime * 1000).getUTCDate();
  const currentDate = new Date(currentTime * 1000).getUTCDate();
  return prevDate !== currentDate;
};
