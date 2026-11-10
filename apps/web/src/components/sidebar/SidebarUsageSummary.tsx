import { useState } from "react";
import { useAtomValue } from "@effect/atom-react";
import {
  collectExternalUsageLinks,
  collectLimitAccounts,
  collectLimitNotices,
  collectLimitPools,
  cursorUsageWindowDetails,
  displayLimitWindows,
  type LimitPresentations,
} from "@t3tools/shared/usageLimits";

import { environmentPresentations } from "../../state/presentation";
import { ProviderInstanceIcon } from "../chat/ProviderInstanceIcon";
import { providerClients } from "../settings/providerDriverMeta";

/** Reads the existing snapshots only while the usage tooltip is mounted. */
export function SidebarUsageSummary() {
  const presentations = useAtomValue(environmentPresentations.presentationsAtom);
  const connected = new Map(
    [...presentations].filter(([, presentation]) => presentation.connection.phase === "connected"),
  );
  return <SidebarUsageSummaryContent presentations={connected} />;
}

export function SidebarUsageSummaryContent({
  presentations,
}: {
  readonly presentations: LimitPresentations;
}) {
  const [now] = useState(Date.now);
  const pools = collectLimitPools(collectLimitAccounts(presentations), now);
  const notices = collectLimitNotices(presentations);
  const external = collectExternalUsageLinks(presentations);
  return (
    <div className="w-60 max-w-[calc(100vw-3rem)] py-1 text-xs">
      <div className="flex items-center justify-between gap-3 pb-2">
        <span className="font-medium">Usage</span>
        <span className="text-2xs text-muted-foreground">Remaining</span>
      </div>
      <div className="pointer-events-auto max-h-[60vh] space-y-3 overflow-y-auto overscroll-contain">
        {pools.map((pool) => {
          const label = providerClients.get(pool.driver)?.label ?? String(pool.driver);
          return (
            <div key={pool.driver} className="space-y-1.5">
              <div className="flex items-center gap-1.5 font-medium">
                <ProviderInstanceIcon
                  driverKind={pool.driver}
                  displayName={label}
                  className="size-3.5"
                  iconClassName="size-3.5"
                />
                <span>{label}</span>
                {pool.accounts.length > 1 ? (
                  <span className="ml-auto text-2xs font-normal text-muted-foreground">
                    {pool.accounts.length} accounts · pooled
                  </span>
                ) : null}
              </div>
              {displayLimitWindows(pool).map((window) => (
                <div key={`${window.kind}:${window.id}`} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-2xs text-muted-foreground">
                    {pool.driver === "cursor"
                      ? (cursorUsageWindowDetails(window.id)?.label ?? window.label)
                      : window.label}
                  </span>
                  <div
                    aria-hidden
                    className="h-1 w-16 shrink-0 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className={
                        window.remainingPercent <= 10
                          ? "h-full rounded-full bg-destructive"
                          : window.remainingPercent <= 25
                            ? "h-full rounded-full bg-warning"
                            : "h-full rounded-full bg-foreground/50"
                      }
                      style={{ width: `${window.remainingPercent}%` }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right tabular-nums">
                    {window.remainingPercent}%
                  </span>
                </div>
              ))}
            </div>
          );
        })}
        {notices.map((notice) => (
          <p key={notice} className="text-2xs text-muted-foreground">
            {notice}
          </p>
        ))}
        {external.map((link) => (
          <p key={link.url} className="text-2xs text-muted-foreground">
            {link.label}: view limits on the usage page.
          </p>
        ))}
        {pools.length === 0 && notices.length === 0 && external.length === 0 ? (
          <p className="text-muted-foreground">No subscription limits reported.</p>
        ) : null}
      </div>
      <div className="mt-2 border-t border-border/60 pt-1.5 text-2xs text-muted-foreground">
        Click for usage details
      </div>
    </div>
  );
}
