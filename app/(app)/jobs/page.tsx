"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createJobSchema,
  type CreateJobInput,
} from "@/lib/schemas";

import {
  useCreateJob,
  useJobs,
} from "@/lib/client/hooks";

import { StatusBadge } from "@/components/status-badge";

export default function JobsPage() {
  const jobs = useJobs();
  const createJob = useCreateJob();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateJobInput>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      sourceUrl: "",
      title: "",
    },
  });

  const onSubmit = (values: CreateJobInput) => {
    createJob.mutate(values, {
      onSuccess: () => {
        reset();
      },
      onError: (error) => {
        if (error instanceof Error && "fieldErrors" in error) {
          const fieldErrors = (
            error as Error & {
              fieldErrors?: Record<string, string[]>;
            }
          ).fieldErrors;

          if (fieldErrors?.sourceUrl?.[0]) {
            setError("sourceUrl", {
              message: fieldErrors.sourceUrl[0],
            });
          }

          if (fieldErrors?.title?.[0]) {
            setError("title", {
              message: fieldErrors.title[0],
            });
          }
        }
      },
    });
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-4 text-xl font-semibold">New encode job</h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-md border border-neutral-200 p-4"
        >
          <div>
            <label
              htmlFor="sourceUrl"
              className="mb-1 block text-sm font-medium"
            >
              Source URL
            </label>

            <input
              id="sourceUrl"
              type="text"
              {...register("sourceUrl")}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              placeholder="https://example.com/video.mp4"
            />

            {errors.sourceUrl && (
              <p className="mt-1 text-sm text-red-600">
                {errors.sourceUrl.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="title"
              className="mb-1 block text-sm font-medium"
            >
              Title
            </label>

            <input
              id="title"
              type="text"
              {...register("title")}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              placeholder="My video"
            />

            {errors.title && (
              <p className="mt-1 text-sm text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          {createJob.isError && (
  <p className="text-sm text-red-600">
    Couldn’t create job. Please try again.
  </p>
)}
          <button
            type="submit"
            disabled={isSubmitting || createJob.isPending}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {createJob.isPending ? "Creating…" : "Create job"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Jobs</h2>

        {jobs.isLoading && (
          <p className="text-sm text-neutral-500">Loading jobs…</p>
        )}

        {jobs.isError && (
          <div className="text-sm text-red-600">
            Couldn’t load jobs — is GET /api/jobs implemented?{" "}
            <button
              onClick={() => jobs.refetch()}
              className="underline"
            >
              Retry
            </button>
          </div>
        )}

        {jobs.data?.length === 0 && (
          <p className="rounded-md border border-neutral-200 p-4 text-sm text-neutral-500">
            No jobs yet. Create one above to get started.
          </p>
        )}

        {jobs.data && jobs.data.length > 0 && (
          <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200">
            {jobs.data.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{job.title}</p>
                    <p className="truncate text-xs text-neutral-500">
                      {job.sourceUrl}
                    </p>
                  </div>

                  <StatusBadge value={job.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}