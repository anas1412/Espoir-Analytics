export const isTimeInWindow = (time: number, startStr: string, endStr: string): boolean => {
  const date = new Date(time * 1000);
  const h = date.getUTCHours();
  const m = date.getUTCMinutes();
  const currentMins = h * 60 + m;

  const [sh, sm] = startStr.split(':').map(Number);
  const [eh, em] = endStr.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;

  if (startMins <= endMins) {
    return currentMins >= startMins && currentMins <= endMins;
  }
  
  // Handles overnight windows (e.g. 22:00 to 07:00)
  return currentMins >= startMins || currentMins <= endMins;
};

export const timeframeToSeconds = (tf: string): number => {
  const match = tf.match(/^(\d+)([mhd])$/);
  if (!match) return 900; // Default to 15m
  const val = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 'm': return val * 60;
    case 'h': return val * 3600;
    case 'd': return val * 86400;
    default: return 900;
  }
};
