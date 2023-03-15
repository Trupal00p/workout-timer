import { useEffect, useState } from "react";
import { Config } from "../types/config";

export function useConfig(): Config | undefined {
  const [config, setConfig] = useState<Config>();
  useEffect(() => {
    try {
      const config = JSON.parse(window.atob(window.location.hash.substring(1)));
      setConfig(config);
    } catch (e) {
      console.log(e);
    }
  }, [setConfig]);

  return config;
}
