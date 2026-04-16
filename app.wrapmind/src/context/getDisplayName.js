// Returns the nickname if set, otherwise falls back to the shop name.
// Use this everywhere a location name is displayed to the user.
export function getDisplayName(loc) {
  if (!loc) return '';
  return loc.nickname?.trim() || loc.name;
}
