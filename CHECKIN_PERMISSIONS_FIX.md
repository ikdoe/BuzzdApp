# Check-In Permissions Bug Fix

## Problem

Users were getting "missing or insufficient permissions" errors when trying to:
- Create their account profile
- Check into venues
- Plan to go to venues
- Any other feature requiring `isApprovedUser()`

## Root Causes

There were TWO separate bugs causing this issue:

### Bug #1: Profile Creation Failing

**The Problem**: User profiles couldn't be created at all!

**Firestore Rules** (line 287) require profiles to be created with:
```javascript
request.resource.data.approved == false
```

But **Swift Code** (line 41) was trying to create with:
```swift
"approved": true,
```

**Result**: Firestore rejected ALL profile creation attempts with "Permission denied"

### Bug #2: Email Verification Not Approving Users

After fixing Bug #1, users could create profiles but still couldn't check in because:

1. **Firestore Security Rules** require `isApprovedUser()` for check-ins, which checks:
   - ✅ Valid JMU email domain
   - ✅ Email is verified (`email_verified == true`)
   - ❌ **User profile has `approved == true`** ← THIS WAS MISSING

2. **The Bug**: In `UsersService.recordEmailVerification()` (line 107), when a user verified their email, the function only set `emailVerifiedAt` but **did NOT set `approved = true`**.

## Fixes Applied

### Fix #1: Changed User Creation to `approved: false`

**File**: `Buzzd/Data/Services/UsersService.swift` (line 41)

**Before**:
```swift
var userData: [String: Any] = [
    "email": email,
    "name": (name ?? "").trimmingCharacters(in: .whitespacesAndNewlines),
    "status": "active",
    "approved": true,  // ❌ Firestore rules reject this!
    "createdAt": FieldValue.serverTimestamp(),
    "updatedAt": FieldValue.serverTimestamp()
]
```

**After**:
```swift
var userData: [String: Any] = [
    "email": email,
    "name": (name ?? "").trimmingCharacters(in: .whitespacesAndNewlines),
    "status": "active",
    "approved": false,  // ✅ Now matches Firestore rules
    "createdAt": FieldValue.serverTimestamp(),
    "updatedAt": FieldValue.serverTimestamp()
]
```

### Fix #2: Updated `UsersService.recordEmailVerification()`

**File**: `Buzzd/Data/Services/UsersService.swift` (lines 106-115)

**Before**:
```swift
static func recordEmailVerification(uid: String) async throws {
    let ref = db.collection("users").document(uid)
    try await ref.setData([
        "emailVerifiedAt": FieldValue.serverTimestamp(),
        "updatedAt": FieldValue.serverTimestamp()
    ], merge: true)
    print("✅ Recorded email verification for uid: \(uid)")
}
```

**After**:
```swift
static func recordEmailVerification(uid: String) async throws {
    let ref = db.collection("users").document(uid)
    try await ref.setData([
        "emailVerifiedAt": FieldValue.serverTimestamp(),
        "approved": true,  // ✅ ADDED THIS
        "updatedAt": FieldValue.serverTimestamp()
    ], merge: true)
    print("✅ Recorded email verification and approved user: \(uid)")
}
```

### Fix #3: Created One-Time Migration Function

**File**: `functions/src/approveVerifiedUsers.ts`

This Cloud Function approves all existing users who verified their email but weren't marked as approved due to the bug.

**Deployed to**: `https://us-central1-buzzd-app-170b4.cloudfunctions.net/approveVerifiedUsers`

**Migration Results**:
- Already approved: 23 users
- Needed approval: 0 users
- Total users: 30

## What This Fixes

✅ **Check-ins**: Users can now check into venues after verifying their email
✅ **Plan to Go**: Users can plan to visit venues
✅ **Venue Ratings**: Users can rate venues
✅ **Events**: Users can create and interact with events
✅ **All other `isApprovedUser()` protected features**

## Testing

To test the fix:

1. Create a new account with a JMU email
2. Verify the email by clicking the link sent to your inbox
3. Return to the app and tap "I Verified"
4. Try checking into a venue - should work now!

## For Existing Users

If you have test accounts that are stuck:

1. **Option A**: The migration function has already run and approved all verified users
2. **Option B**: Delete the test account and create a new one
3. **Option C**: Manually verify the email again in the app

## Email Verification Issue

Note: There's a separate issue where verification emails may not arrive in JMU inboxes:

- Emails ARE being sent successfully from SendGrid
- Check your **spam/junk folder**
- JMU's email server may be blocking emails from `noreply@joinbuzzd.com`
- Consider whitelisting the sender or checking with JMU IT

## Firestore Rules Reference

The relevant security rule (lines 536-565 in `firestore.rules`):

```javascript
match /checkIns/{checkInId} {
  allow create: if isApprovedUser()  // ← Requires approved=true
    && request.resource.data.userId == request.auth.uid
    // ... other validations
}

function isApprovedUser() {
  return hasValidEmail()  // Checks email_verified == true
    && exists(/databases/$(database)/documents/users/$(request.auth.uid))
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.approved == true;
}
```

## The Correct Flow

Now the user creation flow works correctly:

1. **Account Creation**: User created with `approved: false` ✅
2. **Email Verification**: Email sent to user's inbox ✅
3. **User Clicks Link**: Opens verification page ✅
4. **User Returns to App**: Taps "I Verified" ✅
5. **Profile Updated**: `approved` set to `true` ✅
6. **Full Access**: User can now check in, plan to go, etc. ✅

## Files Modified

1. `Buzzd/Data/Services/UsersService.swift` - Changed user creation from `approved: true` to `approved: false` (line 41)
2. `Buzzd/Data/Services/UsersService.swift` - Added `approved: true` to email verification (line 111)
3. `functions/src/approveVerifiedUsers.ts` - Created migration function
4. `functions/src/index.ts` - Exported the migration function

---

**Status**: ✅ Fixed and deployed
**Date**: 2025-10-23
**Critical**: Have your friend delete their test account and create a new one with the fix in place!
