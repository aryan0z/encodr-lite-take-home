"use client";

import { useEffect, useState } from "react";
import type { EncodeRun } from "@/lib/types";
import { isTerminalStage } from "@/lib/types";
import { fetchRun } from "@/lib/client/hooks";

export interface RunPollingState {
  /** The latest run state we've received, or null before the first response. */
  run: EncodeRun | null;

  /** True while we're still asking the server for updates. */
  polling: boolean;

  /** A request failed (network, 404, …). Not the same thing as the RUN failing. */
  fetchError: string | null;

  /** Every message we've seen, oldest first. */
  log: string[];
}

const initialState: RunPollingState = {
  run: null,
  polling: false,
  fetchError: null,
  log: [],
};

export function useRunPolling(
  runId: string | null,
  onFinished?: () => void,
): RunPollingState {
  const [state, setState] = useState<RunPollingState>(initialState);

  useEffect(() => {
    if (!runId) {
      setState(initialState);
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval>;

    setState({
      run: null,
      polling: true,
      fetchError: null,
      log: [],
    });

    const poll = async () => {
      try {
        const run = await fetchRun(runId);

        if (cancelled) return;

        setState((previous) => {
          const lastMessage = previous.log[previous.log.length - 1];

          return {
            run,
            polling: !isTerminalStage(run.stage),
            fetchError: null,
            log:
              lastMessage === run.message
                ? previous.log
                : [...previous.log, run.message],
          };
        });

        if (isTerminalStage(run.stage)) {
          clearInterval(intervalId);

          if (!cancelled) {
            onFinished?.();
          }
        }
      } catch (error) {
        if (cancelled) return;

        setState((previous) => ({
          ...previous,
          polling: false,
          fetchError:
            error instanceof Error
              ? error.message
              : "Failed to fetch run status.",
        }));

        clearInterval(intervalId);
      }
    };

    // Fetch immediately instead of waiting one second.
    void poll();

    // Then keep checking roughly once per second.
    intervalId = setInterval(() => {
      if (!cancelled) {
        void poll();
      }
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [runId, onFinished]);

  return state;
}