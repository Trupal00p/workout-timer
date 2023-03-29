import { useEffect, useState } from "react";
import { Config } from "../types/config";
import JSONCrush from "jsoncrush";
import { lazy } from "./lazy";
import { generateObjectPaths } from "./generateObjectPaths";
import { applyReducer } from "fast-json-patch";

export const encode = (config: Config): string => {
  return encodeURIComponent(JSONCrush.crush(JSON.stringify(config)));
};

const componentEntryPath = /\/components\/[0-9]{1,3}$/i;

export function useConfig(): [Config | undefined, (x: Config) => string] {
  const [config, setConfig] = useState<Config>();
  useEffect(() => {
    try {
      const config = JSON.parse(
        JSONCrush.uncrush(decodeURIComponent(window.location.hash.substring(1)))
      );

      lazy(generateObjectPaths(config))
        .filter((k: string) => !!k.match(componentEntryPath))
        .map((k) => ({
          op: "replace",
          path: `${k}/scrollIntoView`,
          value: false,
        }))
        .reduce(applyReducer, config);

      setConfig(config);
    } catch (e) {
      console.log(e);
    }
  }, [setConfig]);

  return [config, encode];
}
