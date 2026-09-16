import Link from "next/link";
import { Footer, Nav, Shell } from "@/components/nav";
import { Card, MicroNote, PageTitle } from "@/components/ui";
import { ECONOMICS } from "@/lib/config";

/**
 * The team's competitor review identified seven gaps. This page states, for
 * each one, what this application actually does about it and where that stops.
 * A gap we have not closed is written as not closed.
 */
const GAPS = [
  {
    gap: "Digital intermediaries",
    claim: "Platforms can still route produce through aggregators and collection centres, which reintroduces the margin they removed.",
    ours: "There is no reseller in the data model. A buyer order is filled by named farmer lots, and each farm's share of the money is its own row, visible to the buyer and to the farmer. Collection is a vehicle stop at the farm, not a purchase by a middle party.",
    limit:
      "Someone still has to grade, pack, host the pickup point and settle disputes. We pay those people openly as line items rather than pretending the work disappeared.",
  },
  {
    gap: "High logistics cost",
    claim: "Individual deliveries are expensive and inefficient at household basket sizes.",
    ours: `Orders travelling to the same neighbourhood share one vehicle, the run is downsized to the smallest vehicle that fits the load, and a run below ${ECONOMICS.MIN_FILL_FRACTION * 100}% fill is held rather than dispatched. Collection from a neighbourhood point is the default; door delivery is free above a ₹${ECONOMICS.FREE_LAST_LEG_ABOVE_PAISE / 100} basket and charged below it.`,
    limit:
      "Distances and travel times are estimated with a detour factor and an assumed average speed, not live traffic. The operator screen shows quoted transport against actual transport so the gap is visible instead of assumed away.",
  },
  {
    gap: "Limited consumer access",
    claim: "Many platforms serve business buyers only, so households never see farm prices.",
    ours: "Households and bulk buyers use the same catalogue and the same pooled run. Quantities are bought in the commodity's own increment, so a 700 g purchase is possible where a 100 g increment applies.",
    limit: "Household demand only works where enough households share one pickup point. Thin neighbourhoods are held, not served at a loss.",
  },
  {
    gap: "Quality disputes",
    claim: "Differences in delivered quality and quantity create disputes with no record.",
    ours: "Grade is declared on the listing and honoured on the order, the transporter records a handover at every stop, and a buyer can raise a complaint on a completed order. The operator records the agreed outcome, and a deduction from a farmer is written only when the farmer has agreed to it.",
    limit:
      "A photograph is evidence, not a verdict. Physical grading and dispute resolution still need people, and this build does not pretend otherwise.",
  },
  {
    gap: "Digital literacy and language",
    claim: "Farmers struggle with complex apps in an unfamiliar language.",
    ours: "The farmer screens run in Marathi, Hindi or English, chosen from the header and stored on the account. The home screen answers one question first: what is worth sending next week, and what will I be paid for it.",
    limit:
      "Contractual detail stays numeric and is not hidden behind a translation. Assisted operators acting with recorded farmer consent are designed but not yet built.",
  },
  {
    gap: "Price transparency",
    claim: "Farmers cannot see what they actually earn after deductions.",
    ours: "The farmer's accepted rate is an input to the buyer's price, not a residual. Nothing in the code deducts from it: when a price has to be held under the quick-commerce reference, the site fee is cut to zero first. The earnings screen reports net realisation per kilogram beside the mandi comparison for the same quantity.",
    limit:
      "The mandi comparison is the nearest dated observation, which may be several days old and from a different market. It is shown with its date and source every time.",
  },
  {
    gap: "Forecasts that do not become orders",
    claim: "Predictions are presented as if they were demand.",
    ours: "A fitted model is only displayed when it beats a four-week median baseline on a chronological holdout, and both error figures and the sample size are printed under the chart. Predicted demand is shown beside quantity actually listed, and confirmed orders are counted separately from interest.",
    limit:
      "The demand history behind the current figures is synthetic and labelled as such. It demonstrates that the method runs end to end; it does not show accuracy against real households.",
  },
];

export default function Positioning() {
  return (
    <>
      <Nav />
      <Shell>
        <PageTitle
          eyebrow="POSITIONING"
          title="Where we differ, and where we do not"
          subtitle="Ninjacart, DeHaat, AgriBazaar, WayCool and Arya.ag already connect farmers with buyers and already run logistics. Our review identified seven weaknesses worth attacking. For each one below: what we actually built, and where it stops. A capability we have not shipped is written as not shipped, and an absence on a competitor's public page is not treated as evidence that they lack it."
        />

        {GAPS.map((g) => (
          <Card key={g.gap}>
            <div className="eyebrow">{g.gap.toUpperCase()}</div>
            <h2>{g.claim}</h2>
            <p>{g.ours}</p>
            <p className="method" style={{ marginTop: 12 }}>
              <b>Where it stops.</b> {g.limit}
            </p>
          </Card>
        ))}

        <Card>
          <div className="eyebrow">THE CLAIM WE WILL DEFEND</div>
          <h2>Narrow, and testable</h2>
          <p className="method">
            Not that we are better than every competitor: we have no comparable pilot evidence, and saying otherwise
            would be a claim we cannot support. What we will defend is narrower and testable. Form a shipment across
            several real constraints at once, explain every order that did not fit, replan before dispatch and freeze
            after it, preserve the farmer&apos;s accepted amount through the whole chain, and show the buyer the same
            arithmetic the farmer sees. Demonstrating that combination in one locality is credible. Measuring farmer
            net realisation, buyer landed price, vehicle fill and waste against a real baseline is what would turn it
            into evidence.
          </p>
          <MicroNote>
            Read the money model in <code>docs/UNIT_ECONOMICS.md</code>, or open{" "}
            <Link href="/admin/economics" className="text-link">
              the operator economics screen
            </Link>{" "}
            to see break-even computed against the orders currently in the database, including the shortfall.
          </MicroNote>
        </Card>
      </Shell>
      <Footer />
    </>
  );
}
