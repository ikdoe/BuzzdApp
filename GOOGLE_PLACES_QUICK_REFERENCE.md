# Google Places API - Quick Reference

## API Endpoints Used

### 1. Nearby Search
- **URL:** `https://maps.googleapis.com/maps/api/place/nearbysearch/json`
- **File:** `GooglePlacesService.swift:170`
- **Calls Per Search:** 10 (concurrent fan-out queries)
- **Cache:** 10 minutes
- **Trigger:** Location change >50m or distance slider change

### 2. Place Details
- **URL:** `https://maps.googleapis.com/maps/api/place/details/json`
- **File:** `GooglePlacesService.swift:243`
- **Calls Per Search:** 50-200+ (depends on area density)
- **Cache:** 24 hours
- **Trigger:** For each unique venue from nearby results

### 3. Geocoding
- **URL:** `https://maps.googleapis.com/maps/api/geocode/json`
- **File:** `LocationManager.swift:87`
- **Calls Per Session:** 1-3
- **Cache:** None (but deduplicates >100m moves)
- **Purpose:** Location → City name

### 4. Place Photos
- **URL:** `https://maps.googleapis.com/maps/api/place/photo`
- **File:** `GooglePlacesService.swift:422`
- **Calls:** On-demand during image load
- **Cache:** Image-level caching via ImageCache

---

## Call Frequency Summary

**Per Session Estimate:**
- Geocoding: 1-3 calls
- Nearby Search: 10 calls per search
- Place Details: 50-200+ calls per search
- **Total: ~60-210 calls per session**

---

## Issues Found

### High Priority
1. **Unbounded Details calls in dense areas** - No batching, fires all simultaneously
2. **No rate limit recovery** - Fails immediately on 429, no backoff
3. **Multiple search triggers** - Could cause duplicate searches

### Medium Priority
4. **No negative caching** - Failed requests not cached
5. **Photo prefetching unoptimized** - Prefetches all, only needs visible
6. **Fan-out query overhead** - 10 queries with overlapping results

---

## Recommendations

### Immediate (This Week)
1. Add exponential backoff for rate limits
2. Add negative caching (1-5 min TTL for failures)
3. Test in dense areas (NYC, SF)

### Short Term (This Sprint)
1. Batch Details requests (max 10 concurrent)
2. Add request deduplication
3. Implement cache size limits

### Medium Term (Next Sprint)
1. Cache geocoding results
2. Smart image prefetching (visible only)
3. Profile fan-out query efficiency

---

## Cache Details

### Nearby Cache
- **TTL:** 10 minutes
- **Location:** In-memory + disk (~Library/Caches/PlacesCache/)
- **Key:** Bucketed by location (1.1 km precision)
- **Hit Rate:** Good for same location, poor for new areas

### Details Cache
- **TTL:** 24 hours
- **Location:** In-memory + disk
- **Key:** placeId
- **Hit Rate:** Excellent for popular venues

---

## Files to Monitor

**Core Implementation:**
- GooglePlacesService.swift
- PlacesCache.swift
- LocationManager.swift
- PlacesViewModel.swift

**UI Entry Points:**
- DiscoverView.swift (searchNearbyVenues called here)
- BuzzdMapScreen.swift (PlacesViewModel observed)
- VenueDetailView.swift (venue interactions)

---

## Cost Analysis

**Est. Monthly Cost (100 active users):** $8-15/month
- 1.5M API calls @ $7/1,000 = $10.50
- With optimization could reduce 20-30%

**Per-user monthly:** ~$0.08-0.15

---

## Testing Checklist

- [ ] Nearby Search with 10 concurrent queries
- [ ] Details fetch with 100+ venues (dense area)
- [ ] Cache hit/miss rates
- [ ] Rate limit handling (429 response)
- [ ] Geocoding deduplication (>100m)
- [ ] Distance slider debouncing
- [ ] Location refetch gates

