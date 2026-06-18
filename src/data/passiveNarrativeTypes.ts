export interface PassiveNarrativeEntry {
  id: string;
  title: string;
  text: string;
  /** Origin affinity tags — higher weight when player origin/flags match */
  originTags: string[];
  /** Age band inclusive */
  ageMin: number;
  ageMax: number;
  /** Optional tiny stat nudge (already age-clamped at apply time) */
  statDeltas?: Record<string, number>;
  /** Flags to set when this passive narrative is consumed */
  flags?: string[];
}
