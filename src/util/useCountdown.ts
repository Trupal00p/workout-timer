import { useEffect, useState } from "react";

const defaultOnExpire = () => console.log("Countdown");

export const useCountdown = ({
  starting_count,
  update_ms = 1000,
  autostart = true,
  onExpire = defaultOnExpire,
}: {
  starting_count: number;
  update_ms?: number;
  autostart?: boolean;
  onExpire?: () => void;
}) => {
  const [count, setCount] = useState(starting_count);
  const [isRunning, setRunning] = useState(autostart);

  useEffect(() => {
    if (count <= 0) {
      setRunning(false);
      onExpire && onExpire();
    }
  }, [count, setRunning]);

  useEffect(() => {
    if (isRunning) {
      const intervalId = setInterval(() => {
        setCount((count) => Math.max(0, count - 1));
      }, update_ms);
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [isRunning]);

  const reset = () => {
    setRunning(false);
    setCount(starting_count);
  };

  return { count, reset, isRunning, setRunning };
};

type Clock = {
  hours: number;
  minutes: number;
  seconds: number;
  tenths: number;
};

const secondsPerHour = 60 * 60;
const secondsPerMinute = 60;

export const secondsToClock = (total_seconds: number): Clock => {
  const hours_overflow = total_seconds % secondsPerHour;
  const minutes_overflow = hours_overflow % secondsPerMinute;
  const seconds_overflow = minutes_overflow % 1;

  const hours = Math.floor(total_seconds / secondsPerHour);
  const minutes = Math.floor(hours_overflow / secondsPerMinute);
  const seconds = Math.floor(minutes_overflow);
  const tenths = Math.floor(seconds_overflow * 10);
  return { hours, minutes, seconds, tenths };
};

export const displayClock = (clock: Clock): string => {
  let timer = "";
  if (clock.hours > 0) {
    timer += `${clock.hours.toString().padStart(2, "0")}:`;
  }
  if (clock.minutes > 0) {
    timer += `${clock.minutes.toString().padStart(2, "0")}:`;
  }
  timer += `${clock.seconds
    .toString()
    .padStart(2, "0")}.${clock.tenths.toString()}`;
  return timer;
};

export const useTimer = ({
  duration_seconds,
  resolution = 5,
  autostart = true,
  onComplete = defaultOnExpire,
}: {
  duration_seconds: number;
  resolution?: number;
  autostart?: boolean;
  onComplete: () => void;
}) => {
  const res_multiplier = 1000 / resolution;
  const { count, reset, isRunning, setRunning } = useCountdown({
    starting_count: duration_seconds * res_multiplier,
    update_ms: resolution,
    autostart,
    onExpire: onComplete,
  });
  const total_seconds = count / res_multiplier;

  const clock = secondsToClock(total_seconds);

  const timer = displayClock(clock);

  return {
    timer,
    remaining_seconds: Math.floor(total_seconds),
    clock,
    reset,
    isRunning,
    setRunning,
  };
};
