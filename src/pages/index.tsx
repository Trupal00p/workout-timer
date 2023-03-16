import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PencilIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

import { useConfig } from "@/util/useConfig";
import { AnimatePresence, motion } from "framer-motion";
import { TimerEntry } from "../components/TimerEntry";
import {
  Config,
  ConfigEntry,
  EntryKind,
  CompiledConfigEntry,
} from "../types/config";
import { lazy } from "../util/lazy";
import { repeat } from "../util/repeat";
import { randStr } from "@/util/randStr";

const reduceEntry =
  (breadcrumbs: string[]) =>
  (acc: CompiledConfigEntry[], entry: ConfigEntry): CompiledConfigEntry[] => {
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
      for (const [count, e] of repeat(entry, entry.count || 1)) {
        acc.push({
          ...e,
          breadcrumbs,
          warnings: e.warnings
            ?.replace(/ /g, "")
            .split(",")
            .map((t) => parseInt(t, 10))
            .filter((t) => !!t && !isNaN(t)),
        });
        if (entry.count && entry.rest_between_time && count < entry.count) {
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
      }
    } else if (entry.kind === EntryKind.Set && entry.components) {
      // acc.push(entry);
      // recurse into sets
      for (const e of repeat(entry, entry.count || 1)) {
        acc = acc.concat(
          entry.components.reduce(
            reduceEntry([...breadcrumbs, entry.label]),
            []
          )
        );
      }
    }
    return acc;
  };

function compileConfig(config: Config | undefined): CompiledConfigEntry[] {
  return (
    config?.definition
      .reduce(reduceEntry([config.title || "[No Title]"]), [])
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
  const [config] = useConfig();
  const [editUrl, setEditUrl] = useState("");
  const compiledConfig: CompiledConfigEntry[] = compileConfig(config);

  useEffect(() => {
    setEditUrl(`/edit${window.location.hash}`);
  }, []);

  useEffect(() => {
    if (activeIndex >= compileConfig.length) {
      var audio = new Audio("sounds/success-fanfare-trumpets.mp3");
      audio.play();
    }
  }, [activeIndex, compileConfig]);

  const next = () =>
    setActiveIndex((v) => Math.min(compiledConfig.length, v + 1));
  const previous = () => setActiveIndex((v) => Math.max(0, v - 1));

  return (
    <div className="flex flex-col h-screen">
      <div className="border-solid border-2 border-indigo-600 text-center font-bold text-xl p-2">
        <div>
          <AnimatePresence mode="popLayout">
            {compiledConfig &&
              compiledConfig[activeIndex]?.breadcrumbs?.map((crumb: string) => {
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
          </AnimatePresence>
        </div>
      </div>
      <div className="grow bg-slate-100 overflow-hidden relative">
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
          {activeIndex >= compileConfig.length ? (
            <motion.div
              className="border-solid border-2 border-yellow-300 text-center p-5 m-5 drop-shadow-lg rounded-lg bg-white text-5xl mt-20 leading-[5rem]"
              key="complete"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div className="">🥳🎉🎊</div>
              <div>Complete!</div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <div className="border-solid border-2 border-indigo-600 text-center">
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
