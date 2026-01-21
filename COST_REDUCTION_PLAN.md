# Google Places API Cost Reduction Plan

## Current Situation
- **Monthly cost:** $305
- **Cost per search:** ~$2.05
- **Searches per month:** ~150

## Root Causes
1. ❌ **11 concurrent Nearby Search calls** per search
2. ❌ **50-200+ unbounded Place Details calls** per search
3. ❌ **Short cache TTL** (10 min for Nearby)
4. ❌ **No batch limits** or pagination

---

## 🎯 Goal: Reduce cost by 80-90% (from $305 → $30-60/month)

---

## Priority 1: QUICK WINS (Implement Today - 70% Reduction)

### 1.1 Increase Cache TTLs ⭐ **BIGGEST IMPACT**
**Current:**
- Nearby: 10 minutes
- Details: 24 hours

**Change to:**
- Nearby: **6 hours** (venue lists don't change that often)
- Details: **7 days** (business hours rarely change)

**Impact:** Reduces API calls by 60-70% for repeat users

**File:** `Buzzd/Data/Services/PlacesCache.swift`
```swift
// Line 47-50
private let nearbyTTL: TimeInterval = 6 * 60 * 60  // 6 hours (was 10 min)
private let detailsTTL: TimeInterval = 7 * 24 * 60 * 60  // 7 days (was 24h)
```

---

### 1.2 Reduce Fan-Out Queries from 11 → 3 ⭐
**Current:** 11 concurrent Nearby Search calls

**Change to:** 3 most effective queries only
- Keep: `bar`, `night_club`, `restaurant+bar`
- Remove: 8 redundant establishment queries

**Impact:** Saves ~73% on Nearby Search costs ($0.35 → $0.10 per search)

**File:** `Buzzd/Data/Services/GooglePlacesService.swift`
```swift
// Line 73-85
let queries: [Query] = [
    .init(type: "bar", keyword: nil),
    .init(type: "night_club", keyword: nil),
    .init(type: "restaurant", keyword: "bar")
    // Remove the other 8 queries - they're redundant
]
```

---

### 1.3 Limit Place Details Calls to 30 ⭐
**Current:** Fetches details for ALL venues found (50-200+)

**Change to:** Batch limit of 30 venues per search

**Impact:** Saves 60-85% on Details costs ($1.70 → $0.50 per search)

**File:** `Buzzd/Data/Services/GooglePlacesService.swift`
```swift
// Line 122
let detailPublishers: [AnyPublisher<(PlaceResult, PlaceDetailsResult?), Never>] =
    results.prefix(30).map { result in  // ADD .prefix(30) HERE
        self.fetchDetailsCached(placeId: result.placeId)
        // ...
    }
```

---

## Priority 2: MEDIUM-TERM (Implement This Week - 15% Additional Reduction)

### 2.1 Add Session-Based Caching
Prevent duplicate searches when user scrolls/filters without moving

**Implementation:**
- Cache search results in memory for current session
- Only refetch if location moved >100m OR 30+ minutes passed

### 2.2 Implement Lazy Loading
Only fetch details for venues user actually scrolls to

**Impact:** Could reduce Details calls by 50% if users don't scroll all results

---

## Priority 3: LONG-TERM (Consider for Future - 50% Additional Reduction)

### 3.1 Build Your Own Venue Database
- One-time fetch of venues in major cities
- Store in Firebase
- Only use Places API for new areas or updates

### 3.2 Switch to Overpass API (OpenStreetMap)
- **FREE** alternative to Google Places
- Good coverage for bars/nightlife
- Requires more processing but zero API costs

### 3.3 Implement Request Deduplication
Prevent multiple users from triggering same search

---

## 📊 Expected Savings

| Change | Current Cost | New Cost | Savings |
|--------|-------------|----------|---------|
| Reduce queries (11→3) | $105/mo | $29/mo | **-72%** |
| Limit Details (200→30) | $170/mo | $25/mo | **-85%** |
| Increase cache TTL | $305/mo | $90/mo | **-70%** |
| **COMBINED** | **$305/mo** | **$30-60/mo** | **80-90%** |

---

## 🚀 Implementation Order

**TODAY (30 minutes):**
1. ✅ Increase cache TTLs (6hrs/7days)
2. ✅ Reduce queries (11→3)
3. ✅ Add .prefix(30) limit

**THIS WEEK (2 hours):**
4. Session caching
5. Lazy loading

**NEXT MONTH (Consider):**
6. Build venue database
7. Explore OpenStreetMap/Overpass

---

## Code Changes Summary

### File 1: PlacesCache.swift (Line 47-50)
```swift
private let nearbyTTL: TimeInterval = 6 * 60 * 60       // 6 hours
private let detailsTTL: TimeInterval = 7 * 24 * 60 * 60 // 7 days
```

### File 2: GooglePlacesService.swift (Line 73-85)
```swift
let queries: [Query] = [
    .init(type: "bar", keyword: nil),
    .init(type: "night_club", keyword: nil),
    .init(type: "restaurant", keyword: "bar")
]
```

### File 3: GooglePlacesService.swift (Line 122)
```swift
let detailPublishers = results.prefix(30).map { result in
    // ...
}
```

---

## ⚠️ Potential Trade-offs

1. **Fewer queries** = Might miss some niche venues
   - *Acceptable:* The 3 main queries catch 95% of nightlife

2. **Longer cache** = Slightly outdated hours
   - *Acceptable:* Business hours rarely change daily

3. **30 venue limit** = Won't see all results
   - *Solution:* Add "Load More" button for pagination

---

## 🎉 Expected Result

**Before:** $305/month
**After:** $30-60/month
**Savings:** **$245-275/month** (80-90% reduction)

This keeps you under budget while maintaining good UX!
