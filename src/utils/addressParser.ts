/**
 * Address Parser Utilities
 * Extracts city names from full addresses
 */

/**
 * Extract city from a full address string
 *
 * Examples:
 * - "123 Main St, San Francisco, CA 94102" → "San Francisco"
 * - "456 Market St, SF" → "SF"
 * - "Downtown Seattle" → "Downtown Seattle"
 * - "N/A" → "N/A"
 *
 * @param address Full address string
 * @returns City name or the original address if parsing fails
 */
export function extractCity(address: string): string {
  if (!address || address === 'N/A' || address === 'Origin' || address === 'Destination') {
    return address;
  }

  // Split by comma
  const parts = address.split(',').map(part => part.trim());

  // If there are multiple parts, the city is usually the second part
  // Format: "123 Street, City, State ZIP" or "Street, City"
  if (parts.length >= 2) {
    return parts[1];
  }

  // If there are exactly 3 parts, city might be the second
  // Format: "Street, City, State"
  if (parts.length === 3) {
    return parts[1];
  }

  // If no commas, try to extract city from coordinates format
  // Format: "Lat: 37.7749, Lng: -122.4194" → keep as is
  if (address.includes('Lat:') || address.includes('Lng:')) {
    return 'Location';
  }

  // Otherwise return the first part (likely just a city name)
  return parts[0];
}

/**
 * Extract city from pickup address field
 * Handles backend address format
 */
export function extractCityFromPickup(pickup_address?: string | null): string {
  if (!pickup_address) return 'Pickup';
  return extractCity(pickup_address);
}

/**
 * Extract city from delivery address field
 * Handles backend address format
 */
export function extractCityFromDelivery(delivery_address?: string | null): string {
  if (!delivery_address) return 'Delivery';
  return extractCity(delivery_address);
}
