/**
 * Vendor Adapter Framework — barrel export
 * PRD-37 US-P11 AC-③
 */
export type { VendorAdapter, TrendingFetchItem, FetchOptions, Vendor } from './types';
export { VALID_VENDORS, isValidVendor, assertVendor } from './types';
export { XinbangAdapter, CmmAdapter, OfficialDouyinAdapter, getAdapter, defaultAdapter } from './mock-vendor';
