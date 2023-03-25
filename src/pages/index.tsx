import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  FolderIcon,
  PencilIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

import { useConfig } from "@/util/useConfig";
import { AnimatePresence, motion } from "framer-motion";
import { TimerEntry } from "../components/TimerEntry";
import {
  Config,
  Component,
  EntryKind,
  CompiledComponent,
} from "../types/config";
import { lazy } from "../util/lazy";
import { repeat } from "../util/repeat";
import { randStr } from "@/util/randStr";
import Button, { LinkButton } from "@/components/Button";

const reduceEntry =
  (breadcrumbs: string[]) =>
  (acc: CompiledComponent[], entry: Component): CompiledComponent[] => {
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
          id: randStr(EntryKind.Prepare),
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
            id: randStr(EntryKind.Rest),
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

function compileConfig(config: Config | undefined): CompiledComponent[] {
  return (
    config?.components
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
  const [activeIndex, setActiveIndex] = useState(-1);
  const [config] = useConfig();
  const [editUrl, setEditUrl] = useState("");
  const compiledConfig: CompiledComponent[] = compileConfig(config);

  useEffect(() => {
    setEditUrl(`/edit${window.location.hash}`);
  }, []);

  useEffect(() => {
    let audio: HTMLAudioElement;
    if (activeIndex >= compiledConfig.length) {
      audio = new Audio("sounds/success-fanfare-trumpets.mp3");
      audio.play();
    }
    return () => {
      audio && audio.pause();
    };
  }, [activeIndex, compiledConfig]);

  const next = () =>
    setActiveIndex((v) => Math.min(compiledConfig.length, v + 1));
  const previous = () => setActiveIndex((v) => Math.max(-1, v - 1));

  return (
    <div className="flex flex-col h-screen">
      <audio src="sounds/success-fanfare-trumpets.mp3" preload="auto" />
      <div className="border-solid border-2 border-indigo-600 text-center">
        <Button onClick={previous}>
          <ArrowLeftIcon className="h-6 w-6 md:mr-3" />
          <span className="hidden md:inline">Previous</span>
        </Button>
        <LinkButton href="/open">
          <FolderIcon className="h-6 w-6 md:mr-3" />
          <span className="hidden md:inline">Open</span>
        </LinkButton>
        <LinkButton href={editUrl}>
          <PencilIcon className="h-6 w-6 md:mr-3" />
          <span className="hidden md:inline">Modify</span>
        </LinkButton>
        <Button onClick={next}>
          <ArrowRightIcon className="h-6 w-6 md:mr-3" />
          <span className="hidden md:inline">Next</span>
        </Button>
      </div>
      <div className="grow bg-slate-100 overflow-hidden relative">
        <div className="max-w-4xl m-auto">
          <AnimatePresence mode="popLayout">
            {activeIndex === -1 ? (
              <motion.div
                layout
                className="text-center pt-3"
                key="startbutton"
                initial={{ scale: 0.8, opacity: 0 }}
                variants={variants}
                animate="active"
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.3 }}
              >
                <Button onClick={next}>
                  <ClockIcon className="w-6 h-6 mr-3" />
                  Click To Start!
                </Button>
              </motion.div>
            ) : null}
          </AnimatePresence>
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
                    <TimerEntry
                      config={config}
                      isActive={isActive}
                      next={next}
                      previous={previous}
                    />
                  </motion.div>
                );
              })
              .collect()}
          </AnimatePresence>
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              className="border-solid border-2 border-yellow-300 text-center drop-shadow-lg rounded-lg text-5xl leading-[5rem] relative m-5 p-5 text-center drop-shadow-lg rounded-lg bg-white"
              key="complete"
              initial={{ scale: 0.8, opacity: 0 }}
              variants={variants}
              animate={activeIndex == compiledConfig.length ? "active" : "next"}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3 }}
            >
              <div className="">🥳🎉🎊</div>
              <div>Complete!</div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
