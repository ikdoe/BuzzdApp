# Google Places API Usage Analysis - Buzzd App

## Executive Summary

The Buzzd app uses Google Places API (Maps API) for three primary purposes:
1. **Nearby Search** - Finding nightlife venues around user location
2. **Place Details** - Getting venue information (hours, photos, ratings)
3. **Geocoding** - Converting coordinates to city names

The codebase demonstrates **good API usage practices** with caching implemented, but there are **potential optimization opportunities** to reduce unnecessary calls.

---

## 1. API Endpoints Being Used

### A. Nearby Search Endpoint
**Endpoint:** `https://maps.googleapis.com/maps/api/place/nearbysearch/json`

**Location:** `/Buzzd/Data/Services/GooglePlacesService.swift` (line 170)

**Query Parameters:**
- `location` - User's latitude, longitude
- `radius` - Search radius in meters (500-50,000m)
- `type` - Place type (bar, night_club, restaurant, establishment)
- `keyword` - Additional search term (pub, night club, tavern, brewery, etc.)
- `key` - API key

**Called With:** 10 separate concurrent queries per search:
```swift
let queries: [Query] = [
    .init(type: "bar",            keyword: nil),
    .init(type: "night_club",     keyword: nil),
    .init(type: "restaurant",     keyword: "bar"),
    .init(type: "establishment",  keyword: "pub"),
    .init(type: "establishment",  keyword: "night club"),
    .init(type: "establishment",  keyword: "tavern"),
    .init(type: "establishment",  keyword: "sports bar"),
    .init(type: "establishment",  keyword: "brewery"),
    .init(type: "establishment",  keyword: "sports lounge"),
    .init(type: "establishment",  keyword: "lounge")
]
```

**Frequency:** User-initiated, triggered when:
- App first loads (DiscoverView.onAppear)
- User's location changes >50 meters
- User adjusts distance slider with >6 second debounce
- Admin view refresh (AdminCoverChargeManager)

### B. Place Details Endpoint
**Endpoint:** `https://maps.googleapis.com/maps/api/place/details/json`

**Location:** `/Buzzd/Data/Services/GooglePlacesService.swift` (line 243)

**Query Parameters:**
- `place_id` - Place ID from Nearby results
- `fields` - Requested fields: `opening_hours,current_opening_hours,types,name,photos,rating,user_ratings_total,business_status`
- `key` - API key

**Called For:** Each place from the deduped Nearby results (line 123)

**Frequency:** 
- Once per venue to get additional details
- Only if not in cache (24-hour TTL)
- Estimated: 50-200+ calls per search session

### C. Place Photo Endpoint
**Endpoint:** `https://maps.googleapis.com/maps/api/place/photo`

**Location:** `/Buzzd/Data/Services/GooglePlacesService.swift` (line 422)

**Query Parameters:**
- `maxwidth` - 800 pixels
- `photoreference` - From place details
- `key` - API key

**Called For:** Image loading via photoURL

**Frequency:** 
- Not counted as "Places API" calls in billing (separate photo endpoint)
- Called on-demand during image loading via ImageCache prefetch
- Estimated: 10-50 per session

### D. Geocoding Endpoint (Different from Places API)
**Endpoint:** `https://maps.googleapis.com/maps/api/geocode/json`

**Location:** `/Buzzd/Utils/LocationManager.swift` (line 87)

**Query Parameters:**
- `latlng` - User's latitude,longitude
- `key` - API key

**Called For:** Converting user location coordinates to city name

**Frequency:**
- Once per location update that moves >100 meters
- Typically 1-3 times per app session
- Has deduplication: checks if location moved <100m before calling

---

## 2. Detailed Flow Analysis

### Search Flow: User Opens Discover Tab
```
1. DiscoverView.onAppear
   ↓
2. placesViewModel.searchNearbyVenues(location, radiusMiles=10)
   ↓
3. GooglePlacesService.searchNearbyNightlife()
   ↓
4. Check PlacesCache.nearbyCache for key
   ├─ IF CACHED → Return cached results
   └─ IF NOT CACHED:
      ├─ Execute 10 parallel Nearby Search queries
      │  (10 API calls: types + keywords)
      ├─ Deduplicate results by placeId
      ├─ Cache results (10-minute TTL)
      └─ For each deduped result:
         ├─ Try PlacesCache.detailsCache
         ├─ IF NOT CACHED:
         │  └─ Call Place Details API
         │     (Potentially 50-200+ API calls)
         └─ Cache details (24-hour TTL)
         
5. Fetch NightlifeScores from Firestore for ranking
6. Filter through nightlife rules
7. Create NightlifeVenue objects
8. PlacesViewModel caches venues in memory
9. VenueCardView prefetches images
```

### Cache Key Strategy
**Nearby Cache Key:**
```swift
struct NearbyKey: Hashable {
    let latBucket: Int
    let lonBucket: Int
    // precision=100.0 → ~0.01° buckets ≈ 1.1 km latitude
}
```

**Only uses cache if:**
- Radius ≤ 16,093 meters (~10 miles)
- Existing cache exists within 10-minute TTL

---

## 3. API Call Frequency Analysis

### Per-Session Estimate (Typical User)

**Scenario: User opens app, views Discover page once**

| Operation | Call Count | Details |
|-----------|-----------|---------|
| Geocoding (location → city) | 1 | Only if moved >100m |
| Nearby Search queries | 10 | Parallel fan-out queries |
| Place Details queries | 50-200 | For each unique venue (varies by density) |
| **Total per session** | **61-211** | Primarily Details calls |

**Scenario: User opens app, views Discover, adjusts distance slider**

| Operation | Call Count | Details |
|-----------|-----------|---------|
| Initial session above | 61-211 | |
| Slider adjustment (after 350ms debounce) | | |
| └─ Nearby Search queries | 10 | If radius expanded |
| └─ Place Details for new venues | 20-80 | Incremental |
| **Total with expansion** | **91-301** | |

### Potential Issues: Unnecessary/Duplicate Calls

#### 1. **Photos Endpoint Not Optimized**
- **Issue:** Photo references are fetched but URLs are generated dynamically
- **Impact:** Same photo can be requested multiple times if component re-renders
- **Mitigation in Code:** `ImageCache.prefetch()` helps, but not fool-proof
- **Recommendation:** Cache photo URLs more aggressively

#### 2. **Geocoding Can Fire Repeatedly**
- **Issue:** `LocationManager.reverseGeocode()` fires on every location update >100m
- **Code Location:** Line 57-165 in LocationManager.swift
- **Mitigation:** Already has 100m threshold and deduplication
- **Status:** Well-optimized, minimal unnecessary calls

#### 3. **Details Fetching Happens in Parallel**
- **Issue:** For 100+ nearby results, could fetch 100+ detail calls simultaneously
- **Code Location:** GooglePlacesService.swift line 122-127
- **Impact:** Potential rate limiting if hundreds of venues in dense area
- **Current Behavior:** `Publishers.MergeMany(detailPublishers)` sends all at once
- **Mitigation:** Cache provides 24-hour TTL; initial search will hit most calls but subsequent searches reuse cache

#### 4. **Fan-out Nearby Queries Create Duplicate Results**
- **Issue:** 10 separate Nearby queries with overlapping results
- **Code Location:** GooglePlacesService.swift line 73-85
- **Mitigation:** Deduplication by placeId removes duplicates (line 95-101)
- **Impact:** API call overhead but necessary for comprehensive coverage

#### 5. **No Rate Limiting or Backoff**
- **Issue:** If 200+ detail calls fail with OVER_QUERY_LIMIT, no automatic retry with backoff
- **Code Location:** Line 216-218 throws `AppError.rateLimited` but doesn't retry
- **Impact:** Users see error instead of graceful degradation
- **Recommendation:** Implement exponential backoff for rate-limited responses

#### 6. **Venue List Can Trigger Refresh in Multiple Places**
- **Issue:** Multiple components can call `placesViewModel.searchNearbyVenues()`:
  - DiscoverView.onAppear (line 105)
  - DiscoverView.onChange location (line 128)
  - DiscoverView.onChange distance slider (line 141)
  - AdminCoverChargeManager (line in grep results)
  - BuzzdMapScreen theoretically (not found but PlacesViewModel is observed)
  
- **Mitigation:** Refetch gates in place:
  - Location must move >200m
  - Minimum 6 seconds between refetches
  - Status: **Moderate** - gates are good but could be more aggressive

---

## 4. Caching Implementation Analysis

### PlacesCache Architecture
**Location:** `/Buzzd/Data/Services/PlacesCache.swift`

#### Nearby Results Cache
```swift
private var nearbyMem: [NearbyKey: NearbyEntry] = [:]  // In-memory
nearbyTTL: TimeInterval = 10 * 60  // 10 minutes
```

**Disk Storage:**
- `~/Library/Caches/PlacesCache/nearby_[lat]_[lon].json`
- Atomic writes with `options: [.atomic]`
- Cleaned on app launch via `clearStaleOnLaunch()`

**Cache Hit Rate:** Good for:
- Same location viewed multiple times within 10 minutes
- Location within ~1.1 km bucket

**Cache Miss Rate:** High for:
- First time at location (always misses)
- Location moved 1.1+ km away
- After 10 minutes

#### Place Details Cache
```swift
private var detailsMem: [String: DetailsEntry] = [:]  // In-memory
detailsTTL: TimeInterval = 24 * 60 * 60  // 24 hours
```

**Disk Storage:**
- `~/Library/Caches/PlacesCache/details_[placeId].json`
- Same atomic write pattern

**Cache Hit Rate:** Excellent for:
- Popular venues (searched multiple times)
- Same geographic area revisited

---

## 5. Detailed Issues & Recommendations

### HIGH PRIORITY

#### Issue 1: Unbounded Details API Calls on Dense Areas
**Severity:** HIGH | **Frequency:** Common in cities

**Problem:**
- In downtown areas with 100+ places, Details API called 100+ times
- No batching mechanism (Nearby returns max ~20 per call, but 10 queries = 200 potential)
- No per-call rate limiting

**Current Code:**
```swift
let detailPublishers: [AnyPublisher<(PlaceResult, PlaceDetailsResult?), Never>] = 
    results.map { result in
        self.fetchDetailsCached(placeId: result.placeId)
        // All fire simultaneously!
    }
return Publishers.MergeMany(detailPublishers)
```

**Recommendation:**
```
1. Batch requests: Limit to max 10 concurrent Detail calls
2. Implement: AsyncSequence with max concurrent tasks
3. Alternative: Use Place Details (maxResults=20) with Nearby Place IDs
```

---

#### Issue 2: Geocoding on Every Location Update
**Severity:** MEDIUM | **Frequency:** Every location change

**Problem:**
- `LocationManager.reverseGeocode()` called on every location update
- 100m threshold prevents most calls, but still ~1-3 per session
- Geocoding API costs same as Places API in billing

**Current Code:**
```swift
if distance < 100 { return }  // Good: prevents churn
geocodingInProgress = true
// But this fires for GPS drift, user walking, driving, etc.
```

**Recommendation:**
```
1. Increase threshold to 500m or 1km for smaller towns
2. Cache city name for longer (currently reload every 100m)
3. Option: Only geocode when app opens, not on every update
4. Status: Already well-optimized, low priority
```

---

#### Issue 3: Multiple Refetch Triggers
**Severity:** MEDIUM | **Frequency:** If user moves + adjusts slider simultaneously

**Problem:**
- DiscoverView triggers search on location change
- DiscoverView triggers search on distance slider change
- Both may call within 6-second debounce window
- Unlikely but possible

**Current Code:**
```swift
let movedFar = distance.distance(from: lastLocation!) > 200m
let radiusExpanded = radiusMiles > loadedRadiusMiles + 0.1
let enoughTimeElapsed = Date().timeIntervalSince(lastSearchAt!) > 6

if !movedFar && !radiusExpanded && !enoughTimeElapsed {
    return  // Skip refetch
}
```

**Recommendation:**
```
1. Already has good gates, status: LOW priority
2. Consider unified search request instead of multiple triggers
3. Merge location + radius into single search call
```

---

### MEDIUM PRIORITY

#### Issue 4: No Caching for Failed Requests
**Severity:** MEDIUM | **Impact:** Rate-limited users

**Problem:**
- If Details API returns 429 (OVER_QUERY_LIMIT), doesn't cache negative result
- Next request immediately retries and hits rate limit again
- No exponential backoff

**Code:**
```swift
if response.status == "OVER_QUERY_LIMIT" {
    throw AppError.rateLimited
}
// Caller doesn't cache this failure
```

**Recommendation:**
```
1. Cache negative results for 1-5 minutes
2. Implement exponential backoff (1s, 2s, 4s, 8s...)
3. Show user: "Venue data temporarily unavailable, trying again..."
```

---

#### Issue 5: Photo Prefetching Not Batched
**Severity:** MEDIUM | **Impact:** Extra bandwidth

**Problem:**
- `ImageCache.prefetch(imageURLs)` called after every search
- Photos requested for all venues, but only 10-20 visible at once
- Could be smarter about pagination

**Code Location:** PlacesViewModel.swift line 326-328

**Recommendation:**
```
1. Only prefetch images for visible venues (first 10-15)
2. Prefetch as user scrolls (infinite scroll pattern)
3. Use lower resolution for initial load
```

---

#### Issue 6: Fan-out Query Strategy Excessive
**Severity:** LOW-MEDIUM | **Impact:** Cost & latency

**Problem:**
- 10 separate Nearby queries could be optimized
- Results heavily overlap (e.g., "bar" + "night_club" + "restaurant:bar")

**Current Strategy:**
```
10 queries × ~20 results = ~200 results → deduplicated to ~50-100
```

**Recommendation:**
```
1. Test fewer queries (e.g., 5 main types)
2. Use Nearby Search with multiple type combinations
3. Profile on realistic data to see impact
4. Status: Complex tradeoff, test before changing
```

---

### LOW PRIORITY

#### Issue 7: Photo URLs Generated Dynamically
**Severity:** LOW | **Impact:** Minimal, already cached at image level

**Problem:**
- Photo URLs built in code instead of stored (line 422)
- URL changes if API key changes
- No URL caching layer

**Recommendation:**
```
1. Generate URLs once and cache them
2. Store in NightlifeVenue.photoURL
3. Status: Current approach works, low priority
```

---

## 6. Caching Gaps & Opportunities

### What IS Cached
- Nearby results (10 min TTL, ~1.1km bucket)
- Place Details (24 hour TTL, by placeId)
- Images (in-memory via ImageCache)
- Nightlife override configs (1 hour TTL)

### What IS NOT Cached
- Geocoding results (city name) - could cache for 1 hour
- Failed API responses - no negative caching
- Computed nightlife scores - calculated per search

### Optimization Opportunities
| Optimization | Impact | Effort | Status |
|---|---|---|---|
| Cache geocoding results | Low (1-3 calls/session) | Low | Not implemented |
| Negative caching for rate limits | High (prevents hammer) | Medium | Not implemented |
| Batch Details requests | High (could 10x density) | High | Not implemented |
| Smart image prefetching | Medium (saves bandwidth) | Medium | Not implemented |
| Reduce fan-out queries | Low (works well) | High | Not needed |
| Longer cache TTLs | Medium (saves bandwidth) | Low | Could extend Details to 48h |

---

## 7. Cost Analysis

### Estimated Monthly Cost (100 active users)

**Assumptions:**
- 5 sessions/user/day = 500 sessions/day = 15K sessions/month
- Avg 100 API calls/session = 1.5M calls/month
- Google pricing: $7 per 1,000 calls = $10.50/month
- Plus: $0.50 per 1,000 Photo requests

**Actual costs will vary:**
- **Cached sessions:** 10-20 API calls (greatly reduced)
- **New areas:** 100-200 API calls (high)
- **Repeated areas:** 1-10 API calls (minimal)

**Monthly estimate: $8-15** for 100 active users

**With optimization:**
- Batching + better deduplication: -20% → $6-12
- Reduced fan-out queries: -15% → $7-13
- Aggressive caching: -30% → $6-10.50

---

## 8. Summary Table: All API Endpoints

| Endpoint | Location | Purpose | Frequency | Caching | Notes |
|---|---|---|---|---|---|
| Nearby Search | GooglePlacesService:170 | Find venues | Per search | 10min | 10 concurrent queries |
| Place Details | GooglePlacesService:243 | Venue info | Per venue | 24hr | 50-200+ per search |
| Geocoding | LocationManager:87 | City name | Per location | None | 1-3 per session |
| Place Photo | GooglePlacesService:422 | Images | Per image | Image cache | On-demand |

---

## 9. Code Quality Assessment

### Strengths
1. **Good caching implementation** - Dual in-memory + disk cache
2. **Deduplication logic** - Removes duplicate placeIds correctly
3. **Error handling** - Proper handling of API status codes
4. **Debouncing** - 6 second minimum, 350ms slider debounce
5. **Refetch gates** - Location & time-based throttling
6. **Fallback behavior** - Tolerates per-place failures

### Weaknesses
1. **No batching** - Details calls fire simultaneously
2. **No rate limit handling** - Fails immediately on OVER_QUERY_LIMIT
3. **No negative caching** - Failed requests not cached
4. **Unbounded Details** - Could hit API limits in dense cities
5. **Multiple triggers** - Potential for duplicate searches

### Test Coverage
- `PlacesCacheTests.swift` - Cache functionality ✓
- `PlacesAPIDecodeTests.swift` - Response parsing ✓
- No tests for: Rate limiting, batching, concurrent calls, cache TTL

---

## 10. Recommendations Priority List

### Must Do (This Week)
1. Add exponential backoff for 429 rate limit errors
2. Add negative caching for failures (1-5 min)
3. Test in dense areas (NYC, San Francisco) for unbounded Details issue

### Should Do (This Sprint)
1. Batch Details requests (max 10 concurrent)
2. Add request deduplication (same request twice = skip second)
3. Implement cache size limits to prevent disk bloat

### Nice To Have (Next Sprint)
1. Cache geocoding results (1 hour TTL)
2. Smart image prefetching (visible venues first)
3. Profile and optimize fan-out query strategy
4. Add metrics/logging for API call counts

### Future Enhancements
1. WebSocket subscription for real-time venue updates
2. Server-side caching layer (CDN for Places data)
3. Offline mode with cached venue data

---

## 11. Testing Recommendations

### Test Scenarios
```swift
// 1. Dense area (NYC) with 100+ venues
// Expected: Max 10 concurrent Details calls, good cache hit rate

// 2. Network failure during Details fetch
// Expected: Graceful degradation, partial venue list

// 3. Rate limit hit (429 response)
// Expected: Exponential backoff, user sees "retrying..."

// 4. Same location opened 5 times in 30 minutes
// Expected: Cache hits, <5 API calls total

// 5. Rapid distance slider changes
// Expected: Debounced, max 2-3 searches

// 6. Multiple app instances (doesn't happen but simulate)
// Expected: Shared cache, no duplicate calls
```

---

## 12. Files Involved

### Core Implementation
- `/Buzzd/Data/Services/GooglePlacesService.swift` - Main API client
- `/Buzzd/Data/Services/PlacesCache.swift` - Cache layer
- `/Buzzd/ViewModels/PlacesViewModel.swift` - Search orchestration
- `/Buzzd/Utils/LocationManager.swift` - Geocoding calls

### Models
- `/Buzzd/Data/Models/PlacesAPIModels.swift` - Response models
- `/Buzzd/Data/Models/PlacesError.swift` - Error handling
- `/Buzzd/Data/Models/NightlifeVenue.swift` - Domain model

### UI Integration
- `/Buzzd/Features/Discover/DiscoverView.swift` - Main search UI
- `/Buzzd/Features/Map/BuzzdMapScreen.swift` - Map integration
- `/Buzzd/Features/Discover/Components/VenueCardView.swift` - Result display

### Tests
- `/BuzzdTests/PlacesCacheTests.swift` - Cache tests
- `/BuzzdTests/PlacesAPIDecodeTests.swift` - Parsing tests

---

## Conclusion

The Buzzd app demonstrates **solid API usage patterns** with proper caching and deduplication. The main risks are:

1. **Unbounded API calls in dense areas** (100+ Details calls possible)
2. **No rate limit recovery** (immediate failure on 429)
3. **Multiple search triggers** (edge case, but possible)

These can be addressed with:
- Request batching (batched Details calls)
- Exponential backoff (rate limit handling)
- Request deduplication (same-second searches)

**Overall Assessment:** Production-ready with recommended optimizations for scale.

