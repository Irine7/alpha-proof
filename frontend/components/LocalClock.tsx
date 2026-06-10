"use client";

import { useEffect, useState } from "react";

export function LocalClock() {
  const [time, setTime] = useState("--:--:--");

  useEffect(() => {
    const format = (value: number) => value.toString().padStart(2, "0");
    const update = () => {
      const now = new Date();
      setTime(`${format(now.getHours())}:${format(now.getMinutes())}:${format(now.getSeconds())}`);
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return <>{time}</>;
}
