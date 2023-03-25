import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PauseCircleIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/solid";
import { MotionConfig } from "framer-motion";
import { useEffect } from "react";
import { say } from "../pages/index";
import { CompiledTimerComponent } from "../types/config";
import { useTimer } from "../util/useCountdown";
import Button from "./Button";

export function TimerEntry({
  config,
  isActive,
  next,
  previous,
}: {
  config: CompiledTimerComponent;
  isActive: boolean;
  next: () => void;
  previous: () => void;
}): JSX.Element {
  const { timer, setRunning, remaining_seconds, isRunning, reset } = useTimer({
    duration_seconds: config.duration_seconds || 0,
    autostart: false,
    onComplete: () => {
      if (config.end_whistle) {
        var audio = new Audio("sounds/whistle.mp3");
        audio.play();
      }
      if (!!config.auto_next) {
        next();
      }
    },
  });

  // add beeps as end approaches
  useEffect(() => {
    if (config.beep_below && remaining_seconds < config.beep_below) {
      var audio = new Audio("sounds/beep.mp3");
      audio.play();
    }
  }, [remaining_seconds, config.beep_below]);

  // add voice warnings at time remaining
  useEffect(() => {
    const time = config.warnings?.find((t) => t === remaining_seconds + 1);
    if (time) {
      say(`${time} more seconds`);
    }
  }, [remaining_seconds, config.warnings]);

  useEffect(() => {
    setRunning(isActive);
    if (isActive) {
      if (config.label) {
        say(config.label);
      }
    } else {
      reset();
    }
    () => {
      setRunning(false);
    };
  }, [isActive, reset, config.label]);

  const toggle = () => isActive && setRunning((r) => !r);

  return (
    <>
      <div
        className={`relative m-5 p-5 text-center drop-shadow-lg rounded-lg bg-white ${
          isActive
            ? "hover:bg-slate-50 active:bg-slate-100  active:drop-shadow-none cursor-pointer"
            : ""
        }`}
        onClick={toggle}
      >
        <div className="text-5xl">
          <span>{config.label}</span>
        </div>
        {isActive ? (
          <div className="text-7xl">
            <span>{timer}</span>
          </div>
        ) : null}
        {!isActive ? null : isRunning ? (
          <PauseCircleIcon className="h-10 w-10 absolute right-2 bottom-2" />
        ) : (
          <PlayCircleIcon className="h-10 w-10 absolute right-2 bottom-2" />
        )}
      </div>
    </>
  );
}
