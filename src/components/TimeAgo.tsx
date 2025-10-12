import React, { useEffect, useState } from 'react';

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

export default function TimeAgo({ date }: { date: string }) {
  const dt = new Date(date);
  // stable absolute representation for SSR/hydration
  const absolute = dt.toUTCString();
  const [label, setLabel] = useState<string>(absolute);

  useEffect(() => {
    const update = () => setLabel(formatTimeAgo(date));
    // switch to relative label on client
    update();
    const iv = setInterval(update, 60_000);
    return () => clearInterval(iv);
  }, [date]);

  return <span>{label}</span>;
}
