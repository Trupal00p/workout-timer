import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PencilIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

import { useConfig } from "@/util/useConfig";
import { AnimatePresence, motion } from "framer-motion";
import { TimerEntry } from "../components/TimerEntry";
import { Config, ConfigEntry, EntryKind } from "../types/config";
import { lazy } from "../util/lazy";
import { repeat } from "../util/repeat";

import { randStr } from "@/util/randStr";

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
          end_whistle: false,
          beep_below: 3,
          auto_next: true,
          breadcrumbs,
          id: randStr("prep_"),
        });
      }
      // add timer entries
      for (const e of repeat(entry, entry.count || 1)) {
        acc.push({ ...e, breadcrumbs });
        acc.push({
          kind: EntryKind.Rest,
          id: randStr("rest_"),
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

function compileConfig(config: Config | undefined): ConfigEntry[] {
  return (
    config?.definition
      .reduce(reduceEntry([config.title]), [])
      .map((e, index) => ({ index, ...e })) || []
  );
}

export const say = (text: string, pitch = 1, rate = 1) => {
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

const variants = {
  next: { scale: 0.9, opacity: 0.5 },
  active: { scale: 1, opacity: 1 },
};

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const config: Config | undefined = useConfig();
  const [editUrl, setEditUrl] = useState("");
  useEffect(() => {
    setEditUrl(`/edit${window.location.hash}`);
  }, []);

  const compiledConfig: ConfigEntry[] = compileConfig(config);
  const next = () =>
    setActiveIndex((v) => Math.min(compiledConfig.length, v + 1));
  const previous = () => setActiveIndex((v) => Math.max(0, v - 1));
  const toStart = () => setActiveIndex(0);

  return (
    <div className="flex flex-col h-screen">
      <div className="border-solid border-2 border-indigo-600">
        <AnimatePresence mode="popLayout">
          {compiledConfig &&
            compiledConfig[activeIndex]?.breadcrumbs?.map((crumb) => {
              return (
                <motion.span
                  layout
                  key={crumb}
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
                  key={`config-${config.index}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  variants={variants}
                  animate={isActive ? "active" : "next"}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", bounce: 0.3 }}
                >
                  <TimerEntry config={config} isActive={isActive} next={next} />
                </motion.div>
              );
            })
            .collect()}
        </AnimatePresence>
      </div>
      <div className="border-solid border-2 border-indigo-600 text-center">
        {/* <Button
          onClick={toStart}
          content="Start"
          Icon={ChevronDoubleLeftIcon}
        /> */}

        {/* <Button onClick={previous} content="previous" Icon={ArrowLeftIcon} /> */}
        <button
          onClick={previous}
          className={`drop-shadow-lg m-2 inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700  active:drop-shadow-none focus:outline-none`}
        >
          <ArrowLeftIcon className="h-6 w-6 mr-3" /> Previous
        </button>
        <a
          href={editUrl}
          className={`drop-shadow-lg m-2 inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700  active:drop-shadow-none focus:outline-none`}
        >
          <PencilIcon className="h-6 w-6 mr-3" /> Edit
        </a>
        <button
          onClick={next}
          className={`drop-shadow-lg m-2 inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700  active:drop-shadow-none focus:outline-none`}
        >
          <ArrowRightIcon className="h-6 w-6 mr-3" />
          Next
        </button>
      </div>
    </div>
  );
}
