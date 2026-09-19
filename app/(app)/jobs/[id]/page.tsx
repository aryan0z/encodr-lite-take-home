"use client";

import { use, useCallback, useState } from "react";
import Link from "next/link";

import { useJob, useStartRun } from "@/lib/client/hooks";
import { useRunPolling } from "@/lib/client/use-run-polling";

import { StatusBadge } from "@/components/status-badge";
import { ProgressBar } from "@/components/progress-bar";

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const jobQuery = useJob(id);
  const startRun = useStartRun(id);

  const [runId, setRunId] = useState<string | null>(null);

  const handleFinished = useCallback(() => {
    void jobQuery.refetch();
  }, [jobQuery.refetch]);

  const polling = useRunPolling(runId, handleFinished);

  if (jobQuery.isLoading) {
    return (
      <p className="text-sm text-neutral-500">
        Loading job…
      </p>
    );
  }

  if (jobQuery.isError || !jobQuery.data) {
    return (
      <div className="text-sm text-red-600">
        Job not found.{" "}
        <Link href="/jobs" className="underline">
          Back to jobs
        </Link>
      </div>
    );
  }

  const job = jobQuery.data;
  const run = polling.run;

  const handleStart = () => {
    startRun.mutate(undefined, {
      onSuccess: (data) => {
        setRunId(data.runId);
      },
    });
  };

  return (
    <div className="space-y-6">
      <Link
        href="/jobs"
        className="text-sm text-neutral-500 hover:underline"
      >
        ← All jobs
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">
            {job.title}
          </h1>

          <p className="truncate text-sm text-neutral-500">
            {job.sourceUrl}
          </p>
        </div>

        <StatusBadge value={job.status} />
      </div>

      {/* Start / running / result panel */}
      <section className="space-y-4 rounded-md border border-neutral-200 p-5">
        {!run && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">
              Encode
            </h2>

            <p className="text-sm text-neutral-500">
              Start an encode run for this source.
            </p>

            {startRun.isError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Couldn’t start the encode. Please try again.
              </div>
            )}

            <button
              type="button"
              onClick={handleStart}
              disabled={startRun.isPending}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {startRun.isPending
                ? "Starting…"
                : "Start encode"}
            </button>
          </div>
        )}

        {run && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Encode progress
                </h2>

                <p className="text-sm text-neutral-500">
                  {run.message}
                </p>
              </div>

              <StatusBadge value={run.stage} />
            </div>

            <ProgressBar value={run.progressPct} />

            <div>
              <h3 className="mb-2 text-sm font-medium">
                Log
              </h3>

              <ul className="space-y-1 rounded-md bg-neutral-50 p-3 text-sm text-neutral-600">
                {polling.log.map((message, index) => (
                  <li key={`${message}-${index}`}>
                    {message}
                  </li>
                ))}
              </ul>
            </div>

            {polling.fetchError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Couldn’t fetch the run status:{" "}
                {polling.fetchError}
              </div>
            )}

            {run.stage === "FAILED" && (
              <div className="space-y-3 rounded-md border border-red-200 bg-red-50 p-4">
                <div>
                  <h3 className="font-medium text-red-800">
                    Encoding failed
                  </h3>

                  <p className="text-sm text-red-700">
                    {run.error ?? "The encode failed."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStart}
                  disabled={startRun.isPending}
                  className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {startRun.isPending
                    ? "Retrying…"
                    : "Retry"}
                </button>
              </div>
            )}

            {run.stage === "COMPLETED" && run.result && (
              <div className="space-y-4">
                <div className="rounded-md border border-neutral-200 p-4">
                  <p className="text-sm text-neutral-500">
                    Duration
                  </p>

                  <p className="text-lg font-semibold">
                    {run.result.durationSec} seconds
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-medium">
                    Renditions
                  </h3>

                  <div className="overflow-hidden rounded-md border border-neutral-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-3 py-2 font-medium">
                            Label
                          </th>
                          <th className="px-3 py-2 font-medium">
                            Resolution
                          </th>
                          <th className="px-3 py-2 font-medium">
                            Size
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {run.result.renditions.map(
                          (rendition) => (
                            <tr
                              key={rendition.label}
                              className="border-t border-neutral-200"
                            >
                              <td className="px-3 py-2">
                                {rendition.label}
                              </td>

                              <td className="px-3 py-2">
                                {rendition.width} ×{" "}
                                {rendition.height}
                              </td>

                              <td className="px-3 py-2">
                                {rendition.sizeMb} MB
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}