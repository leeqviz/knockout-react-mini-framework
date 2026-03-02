import { LazyLoadingFallback } from "@/shared/react/components/lazy-loading-fallback";
import { lazy, Suspense } from "react";
import type { DatepickerEntryPointProps } from "./entry-point";

const LazyDatepickerEntryPoint = lazy(() =>
  import("./entry-point").then((res) => ({
    default: res.DatepickerEntryPoint,
  })),
);

export function DatepickerEntryPointLazy(props: DatepickerEntryPointProps) {
  return (
    <Suspense fallback={LazyLoadingFallback()}>
      <LazyDatepickerEntryPoint {...props} />
    </Suspense>
  );
}
