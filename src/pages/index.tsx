import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDoubleLeftIcon,
  PauseCircleIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import Button from "../components/Button";

import { AnimatePresence, motion } from "framer-motion";
import { lazy } from "../util/lazy";
import { useTimer } from "../util/useCountdown";

enum EntryKind {
  Timer = "timer",
  Set = "set",
  Prepare = "prepare",
  Rest = "rest",
}

type ConfigEntry = {
  kind: EntryKind;
  duration_seconds?: number;
  label: string;
  auto_next?: boolean;
  count?: number;
  components?: Array<ConfigEntry>;
  index?: number;
  prepare_time?: number;
  end_whistle?: boolean;
  beep_below?: number;
  rest_between_time?: number;
  warnings?: number[];
  breadcrumbs?: string[];
};

const basetime = 10;

const exampleConfig = {
  voice: "somevoiceselection",
  presets: [
    {
      title: "First One",
      definition: [
        {
          kind: EntryKind.Timer,
          duration_seconds: basetime + 25,
          count: 4,
          label: "Plank",
          auto_next: true,
          warnings: [30, 5],
          beep_below: 3,
          prepare_time: 10,
          rest_between_time: 5,
        },
        {
          kind: EntryKind.Set,
          count: 2,
          label: "Core",
          auto_next: true,
          prepare_time: 10,
          components: [
            {
              kind: EntryKind.Timer,
              duration_seconds: basetime + 2,
              label: "Crunches",
              auto_next: true,
              count: 2,
              rest_between_time: 10,
            },
            {
              kind: EntryKind.Timer,
              duration_seconds: basetime + 3,
              label: "Sit ups",
              auto_next: true,
            },
          ],
        },
        {
          kind: EntryKind.Timer,
          duration_seconds: basetime + 4,
          label: "Push ups",
          auto_next: true,
          prepare_time: 20,
          rest_between_time: 30,
          count: 4,
        },
      ],
    },
  ],
};

function* repeat<Type>(item: Type, count: number): Iterable<Type> {
  let i = 1;
  while (i <= count) {
    yield item;
    i++;
  }
}

const reduceEntry =
  (breadcrumbs: string[]) =>
  (acc: ConfigEntry[], entry: ConfigEntry): ConfigEntry[] => {
    if (entry.kind === EntryKind.Timer) {
      // add prep time if present
      if (entry.prepare_time) {
        acc.push({
          kind: EntryKind.Prepare,
          label: `Prepare for ${entry.label}`,
          duration_seconds: entry.prepare_time,
          end_whistle: true,
          beep_below: 3,
          auto_next: true,
          breadcrumbs,
        });
      }
      // add timer entries
      for (const e of repeat(entry, entry.count || 1)) {
        acc.push({ ...e, breadcrumbs });
        acc.push({
          kind: EntryKind.Rest,
          label: `${entry.rest_between_time} second rest`,
          duration_seconds: entry.rest_between_time,
          end_whistle: false,
          auto_next: true,
          beep_below: 3,
          breadcrumbs,
        });
      }
      // remove last rest entry
      acc.pop();
    } else if (entry.kind === EntryKind.Set && entry.components) {
      // acc.push(entry);
      // recurse into sets
      for (const e of repeat(entry, entry.count || 1)) {
        acc = acc.concat(
          entry.components.reduce(
            reduceEntry([...(breadcrumbs || []), entry.label]),
            []
          )
        );
      }
    }
    return acc;
  };

function compileConfig(
  configs: Array<ConfigEntry>,
  initialCrumb: string
): ConfigEntry[] {
  return configs
    .reduce(reduceEntry([initialCrumb]), [])
    .map((e, index) => ({ index, ...e }));
}

// const voiceOptions = window.speechSynthesis.getVoices().map((v) => {
//   return {
//     value: v.lang,
//     text: v.name,
//   };
// });

// console.log(voiceOptions);

// const compiledConfig = compileConfig(
//   exampleConfig.presets[0].definition,
//   exampleConfig.presets[0].title
// );

// console.log(compiledConfig);

const say = (text: string, pitch = 1, rate = 1) => {
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterThis = new SpeechSynthesisUtterance(text);
  synth.speak(utterThis);

  // const defaultVoice = voices.find((v) => v.default);
  // console.log(defaultVoice)
  // if (defaultVoice) {
  //   new SpeechSynthesisVoice(defaultVoice.lang);
  //   // utterThis.voice = ;
  //   utterThis.pitch = pitch;
  //   utterThis.rate = rate;
  // }
};

const ActiveTimer = ({
  config,
  isActive,
  next,
}: {
  config: ConfigEntry;
  isActive: boolean;
  next: () => void;
}) => {
  const { timer, setRunning, remaining_seconds, isRunning } = useTimer({
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
    if (isActive && config.label) {
      say(config.label);
    }
    () => {
      setRunning(false);
    };
  }, [isActive]);

  const toggle = () => isActive && setRunning((r) => !r);

  return (
    <div
      className={`relative p-5 text-center drop-shadow-lg rounded-lg bg-white ${
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
  );
};

const variants = {
  next: { scale: 0.9, opacity: 0.5 },
  active: { scale: 1, opacity: 1 },
};

const saveJsonAsFile = (filename: string, dataObjToWrite: object) => {
  const blob = new Blob([JSON.stringify(dataObjToWrite, undefined, 2)], {
    type: "text/json",
  });
  const link = document.createElement("a");

  link.download = filename;
  link.href = window.URL.createObjectURL(blob);
  link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");

  const evt = new MouseEvent("click", {
    view: window,
    bubbles: true,
    cancelable: true,
  });

  link.dispatchEvent(evt);
  link.remove();
};

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activePreset, setActivePreset] = useState(0);
  const [compiledConfig, setConfig] = useState<ConfigEntry[]>([]);

  useEffect(() => {
    try {
      const config = JSON.parse(window.atob(window.location.hash.substring(1)));
      setConfig(
        compileConfig(
          config.presets[activePreset].definition,
          config.presets[activePreset].title
        )
      );
    } catch (e) {
      console.log(e);
    }
  }, [setConfig]);

  const next = () =>
    setActiveIndex((v) => Math.min(compiledConfig.length, v + 1));
  const previous = () => setActiveIndex((v) => Math.max(0, v - 1));
  const toStart = () => setActiveIndex(0);

  const save = () => {
    window.location.hash = window.btoa(JSON.stringify(exampleConfig));
    // saveJsonAsFile("setting.json", exampleConfig);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="border-solid border-2 border-indigo-600">
        <AnimatePresence mode="popLayout">
          {compiledConfig[activeIndex]?.breadcrumbs?.map((crumb) => {
            return (
              <motion.span
                layout
                className="p-5"
                key="crumb"
                initial={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.3 }}
              >
                {crumb}
              </motion.span>
            );
          })}
        </AnimatePresence>{" "}
      </div>
      <div className="grow bg-lime-100 overflow-hidden relative">
        <AnimatePresence mode="popLayout">
          {lazy(compiledConfig)
            .filter((config) => config.index >= activeIndex)
            .map((config) => {
              const isActive = activeIndex === config.index;
              return (
                <motion.div
                  layout
                  className="p-5"
                  key={`config-${config.index}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  variants={variants}
                  animate={isActive ? "active" : "next"}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", bounce: 0.3 }}
                >
                  <ActiveTimer
                    config={config}
                    isActive={isActive}
                    next={next}
                  />
                </motion.div>
              );
            })
            .collect()}
        </AnimatePresence>
      </div>
      <div className="border-solid border-2 border-indigo-600 text-center">
        <Button
          onClick={toStart}
          content="Start"
          Icon={ChevronDoubleLeftIcon}
        />
        <Button onClick={previous} content="previous" Icon={ArrowLeftIcon} />
        <Button onClick={next} content="next" Icon={ArrowRightIcon} />
        <Button onClick={save} content="Save Config" Icon={ArrowDownTrayIcon} />
      </div>
    </div>
  );
}
