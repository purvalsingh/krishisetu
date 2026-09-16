"use client";

import { useState } from "react";

/**
 * Invitation to the neighbours on the same run.
 *
 * The link is the honest version of a referral: it shows how far the run is
 * from the fill threshold, so the recipient is being asked for something
 * specific rather than marketed to.
 */
export function ShareRun({
  clusterId,
  clusterName,
  fraction,
  shortfallKg,
  willGo,
  minimumPercent,
}: {
  clusterId: string;
  clusterName: string;
  fraction: number;
  shortfallKg: string;
  willGo: boolean;
  minimumPercent: number;
}) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}/join/${clusterId}`;
    const text = willGo
      ? `Our ${clusterName} vegetable run is going this week — farm prices, collected in our own society.`
      : `Our ${clusterName} vegetable run is ${shortfallKg} short of going ahead. One more basket helps.`;

    // The platform share sheet where it exists; the clipboard everywhere else.
    if (navigator.share) {
      try {
        await navigator.share({ title: "KrishiSetu", text, url });
        return;
      } catch {
        // The person dismissed the sheet; fall through to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  return (
    <section className="card">
      <div className="eyebrow">NEIGHBOURHOOD</div>
      <h2>{willGo ? "This run is going" : "Invite the neighbours"}</h2>

      <div className="fill-line">
        <span>{clusterName.replace(" pickup point", "")}</span>
        <b>{(fraction * 100).toFixed(0)}%</b>
      </div>
      <div className="progress">
        <i className={willGo ? "" : "amber-fill"} style={{ width: `${Math.min(100, fraction * 100)}%` }} />
      </div>

      <p className={willGo ? "positive-text" : "warning-text"}>
        {willGo
          ? `Above the ${minimumPercent}% minimum fill, so the vehicle moves.`
          : `${shortfallKg} short of the ${minimumPercent}% minimum. Below it the run is held and every order rolls to the next window.`}
      </p>

      <button onClick={share} className="btn btn-secondary" style={{ width: "100%", marginTop: 14 }}>
        {copied ? "Link copied" : "Share this run"}
      </button>

      <p className="micro-note">
        The link shows how far the run is from going ahead. More neighbours on one run is what keeps transport per
        kilogram low enough to pay the farmer properly and still beat the quick-commerce price.
      </p>
    </section>
  );
}
