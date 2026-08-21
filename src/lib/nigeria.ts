export const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Federal Capital Territory",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
] as const;

export type NigerianState = (typeof NIGERIAN_STATES)[number];

export const NIGERIA = "Nigeria";

export function nigerianStateItems(current?: string) {
  const items = NIGERIAN_STATES.map((state) => ({ value: state, label: state }));
  if (current && !NIGERIAN_STATES.includes(current as NigerianState)) {
    return [{ value: current, label: current }, ...items];
  }
  return items;
}

export function optionServesState(
  option: { states?: string[] | null },
  state?: string | null
) {
  const states = option.states || [];
  if (states.length === 0) return true;
  if (!state) return false;
  return states.includes(state);
}

export function shippingOptionsForState<T extends { states?: string[] | null }>(
  options: T[],
  state?: string | null
) {
  if (!state) return [];
  return options
    .filter((option) => optionServesState(option, state))
    .sort((a, b) => (a.states?.length || 0) - (b.states?.length || 0));
}

export function preferredShippingOption<
  T extends { id: string; states?: string[] | null },
>(options: T[], state?: string | null) {
  return shippingOptionsForState(options, state)[0] || null;
}

export function preferredShippingOptionId<
  T extends { id: string; states?: string[] | null },
>(options: T[], state?: string | null, currentId?: string | null) {
  const available = shippingOptionsForState(options, state);
  if (currentId && available.some((option) => option.id === currentId)) {
    return currentId;
  }
  return available[0]?.id || "";
}
