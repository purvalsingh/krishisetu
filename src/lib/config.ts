/**
 * Every number here is a stated assumption from docs/UNIT_ECONOMICS.md.
 * Changing a value here changes the quoted bill, the run threshold and the
 * economics screens together, so the site can never show two different models.
 */
export const ECONOMICS = {
  /** A run is only economical above this share of vehicle capacity. */
  MIN_FILL_FRACTION: 0.7,

  /** Quoted at order time and held for the buyer even if the actual run costs more. */
  QUOTED_LINE_HAUL_PAISE_PER_KG: 320,
  QUOTED_CLUSTER_LEG_PAISE_PER_KG: 150,

  /** Grading, crates and packing labour. */
  PACKING_PAISE_PER_KG: 260,
  /** Spoilage and shortfall buffer, as a share of farmer proceeds. */
  SPOILAGE_BUFFER_RATE: 0.04,

  /** The only platform revenue line. Disclosed to the buyer, never deducted from the farmer. */
  SITE_FEE_PAISE_PER_KG: 300,

  /**
   * Handling and the pickup-point commission are charged per order, not per
   * kilogram, so a very small basket cannot carry them. Below this order value
   * the order is not accepted; the buyer is asked to add to it or wait.
   */
  MIN_ORDER_VALUE_PAISE: 15_000,

  /**
   * Door delivery is free above this basket value and charged below it.
   * The site fee on a basket this size comfortably exceeds the cost of walking
   * it the last three hundred metres, so the waiver is funded by the fee and
   * never by the farmer's accepted amount. It also pushes baskets larger, which
   * is what makes the whole run cheaper per kilogram.
   */
  FREE_LAST_LEG_ABOVE_PAISE: 50_000,

  /** Payment gateway and messaging cost per completed order, used in the admin view. */
  VARIABLE_PLATFORM_COST_PAISE_PER_ORDER: 560,
  /** Assumed monthly fixed cost, used only to display break-even. */
  MONTHLY_FIXED_COST_PAISE: 6_000_000,

  /** Farm pickups further than this from the cluster are not considered. */
  SERVICE_RADIUS_KM: 120,
  /** Average road speed used for travel-time estimates. */
  AVERAGE_SPEED_KMPH: 34,
  /** Handling time added at every stop. */
  STOP_MINUTES: 12,
  /** Beyond this many farm stops a shared run turns into an expensive tour. */
  MAX_PICKUP_STOPS: 5,
} as const;

/** Reason codes surfaced verbatim to farmers, buyers and the operator. */
export const REJECTION = {
  NO_COMPATIBLE_LOT: "No farmer lot matches this commodity and grade in the service area",
  INSUFFICIENT_STOCK: "Available quantity across compatible lots is short of the requested amount",
  CAPACITY: "Adding this order exceeds the vehicle capacity on at least one leg",
  FRESHNESS: "Travel and handling time exceeds the freshness limit for this commodity",
  WINDOW: "The run cannot reach the delivery window in time",
  DISTANCE: "Pickup lies outside the pilot service radius",
  STOPS: "Filling this order would need another farm stop beyond the limit for one run",
} as const;
