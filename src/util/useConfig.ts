import { useEffect, useState } from "react";
import { Config } from "../types/config";
import JSONCrush from "jsoncrush";

export const encode = (config: Config): string => {
  return encodeURIComponent(JSONCrush.crush(JSON.stringify(config)));
};

export function useConfig(): [Config | undefined, (x: Config) => string] {
  const [config, setConfig] = useState<Config>();
  useEffect(() => {
    try {
      const config = JSON.parse(
        JSONCrush.uncrush(decodeURIComponent(window.location.hash.substring(1)))
      );
      setConfig(config);
    } catch (e) {
      console.log(e);
    }
  }, [setConfig]);

  return [config, encode];
}
