import { RotateCwIcon, TicketIcon } from "lucide-react";
import { useAtomValue } from "@effect/atom-react";
import {
  collectExternalUsageLinks,
  collectLimitAccounts,
  collectLimitNotices,
  collectLimitPools,
  cursorUsageWindowDetails,
  displayLimitWindows,
  formatResetsIn,
  type LimitPresentations,
} from "@t3tools/shared/usageLimits";

import { useNowMinute } from "../../hooks/useNowMinute";
import { environmentPresentations } from "../../state/presentation";
import { ProviderInstanceIcon } from "../chat/ProviderInstanceIcon";
import { providerClients } from "../settings/providerDriverMeta";

/** Reads the existing snapshots only while the usage tooltip is mounted. */
export function SidebarUsageSummary() {
  const presentations = useAtomValue(environmentPresentations.presentationsWithProvidersAtom);
  const connected = new Map(
    [...presentations].filter(([, presentation]) => presentation.connection.phase === "connected"),
  );
  return <SidebarUsageSummaryContent presentations={connected} />;
}

function SidebarUsageSummaryContent({
  presentations,
}: {
  readonly presentations: LimitPresentations;
}) {
  const minute = useNowMinute();
  const now = Date.parse(`${minute}:00Z`);
  const pools = collectLimitPools(collectLimitAccounts(presentations), now);
  const notices = collectLimitNotices(presentations);
  const external = collectExternalUsageLinks(presentations);
  return (
    <div className="w-60 max-w-[calc(100vw-3rem)] py-1 text-xs">
      <div className="pointer-events-auto max-h-[60vh] space-y-3 overflow-y-auto overscroll-contain">
        {pools.map((pool) => {
          const label = providerClients.get(pool.driver)?.label ?? String(pool.driver);
          const credits = pool.accounts.reduce(
            (sum, account) => sum + (account.limits.resetCredits?.availableCount ?? 0),
            0,
          );
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
                {credits > 0 ? (
                  <span
                    className="ml-auto inline-flex items-center gap-1 text-2xs text-muted-foreground tabular-nums"
                    aria-label={`${credits} reset ${credits === 1 ? "credit" : "credits"} banked`}
                  >
                    <TicketIcon className="size-3" aria-hidden />
                    {credits}
                  </span>
                ) : null}
                {pool.accounts.length > 1 ? (
                  <span className="ml-auto text-2xs font-normal text-muted-foreground">
                    {pool.accounts.length} accounts · pooled
                  </span>
                ) : null}
              </div>
              {displayLimitWindows(pool).map((window) => {
                const nextReset = window.resets[0];
                const resetsIn = nextReset ? formatResetsIn(nextReset.member.window, now) : null;
                return (
                  <div key={`${window.kind}:${window.id}`} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1 text-2xs text-muted-foreground">
                      <div className="truncate">
                        {pool.driver === "cursor"
                          ? (cursorUsageWindowDetails(window.id)?.label ?? window.label)
                          : window.label}
                      </div>
                      {resetsIn ? (
                        <span
                          className="flex items-center gap-1 text-3xs tabular-nums"
                          aria-label={`${window.members.length > 1 ? "Next account " : ""}${resetsIn}`}
                        >
                          <RotateCwIcon className="size-2.5" aria-hidden />
                          {window.members.length > 1 ? "Next " : ""}
                          {resetsIn.replace(/^resets in /i, "").replace(/^resets /i, "")}
                        </span>
                      ) : null}
                    </div>
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
                      {window.remainingPercent}%<span className="sr-only"> remaining</span>
                    </span>
                  </div>
                );
              })}
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
            {link.label}: open Usage for limits.
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
