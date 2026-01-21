# Email Verification Deployment Checklist

## ✅ Code Changes (DONE)

- ✅ Added `recordEmailVerification()` function to UsersService
- ✅ Updated VerifyEmailView to record verification timestamp
- ✅ Custom action code settings redirect to joinbuzzd.app/verification
- ✅ Verification page created at BuzzdWebsite/public/verification.html

## 🔧 Firebase Configuration (YOU NEED TO DO)

### 1. Add Authorized Domain

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **buzzd-app-170b4**
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Enter: `joinbuzzd.app`
6. Click **Add**

**Why**: This allows Firebase to redirect verification emails to your custom domain.

### 2. Disable Email Enumeration Protection (Optional - for faster delivery)

1. In Firebase Console → **Authentication** → **Settings**
2. Scroll to **Email Enumeration Protection**
3. If it's enabled, **disable it**
4. Save changes

**Why**: Email enumeration protection adds artificial delays. Since you're JMU-only with email verification, this extra security isn't needed.

### 3. Check Email Templates (Optional - for custom sender)

1. Go to **Authentication** → **Templates**
2. Click **Email address verification**
3. Review the template
4. For custom sender (`noreply@joinbuzzd.com`), you'll need to:
   - Set up email service (SendGrid/Mailgun)
   - Install Firebase Extensions → Trigger Email
   - Configure DNS records for your domain

**Note**: The default sender `noreply@buzzd-app-170b4.firebaseapp.com` works fine. Custom sender is nice-to-have, not critical.

## 🚀 Deploy Verification Page

### Option 1: Firebase Hosting (Recommended)

Your website is already on Firebase Hosting, so just deploy:

```bash
cd /Users/kendalljenkins/Downloads/BuzzdWebsite
firebase deploy --only hosting
```

This will deploy the verification page to `https://joinbuzzd.app/verification`

### Option 2: Manual Deployment

If you're using a different hosting provider:
1. Upload `/public/verification.html` to your web server
2. Ensure it's accessible at `https://joinbuzzd.app/verification`
3. Test by visiting the URL in your browser

## 📱 Deploy App Changes

### Build and Deploy iOS App

```bash
cd /Users/kendalljenkins/Downloads/Buzzd

# Build the app
xcodebuild -workspace Buzzd.xcworkspace -scheme Buzzd -configuration Release

# Or open in Xcode and:
# 1. Product → Archive
# 2. Distribute App
# 3. Upload to App Store Connect
```

## ✅ Testing Checklist

### Test 1: New Account Creation

1. ✅ Create a new test account with a real JMU email
2. ✅ Check that you're redirected to VerifyEmailView
3. ✅ Check Firestore - user doc should exist with:
   - `approved: true`
   - `email: your@dukes.jmu.edu`
   - `createdAt: [timestamp]`
   - No `emailVerifiedAt` yet

### Test 2: Email Delivery

1. ✅ Check your email inbox (and spam folder)
2. ✅ Verify email arrives within 1-2 minutes (should be faster after disabling enumeration protection)
3. ✅ Check the "from" address (should be Firebase default for now)

### Test 3: Verification Link

1. ✅ Click the verification link in the email
2. ✅ Should redirect to `https://joinbuzzd.app/verification`
3. ✅ Should show success message: "You've been verified!"
4. ✅ Should NOT show error message about expired/used link

### Test 4: App Access

1. ✅ Return to the app
2. ✅ Tap "I Verified — Continue"
3. ✅ Should see: "Email verified successfully! Loading your account…"
4. ✅ Should immediately get access to the app
5. ✅ Check Firestore - user doc should now have:
   - `emailVerifiedAt: [timestamp]`
   - `updatedAt: [timestamp]`

### Test 5: Security Check

1. ✅ Create another account
2. ✅ Do NOT verify the email
3. ✅ Try to access app features
4. ✅ Should be blocked at VerifyEmailView
5. ✅ Check Firestore operations - should be denied by security rules

### Test 6: Resend Email

1. ✅ On VerifyEmailView, tap "Resend Verification Email"
2. ✅ Should show: "Verification email sent!"
3. ✅ Check inbox - new email should arrive
4. ✅ Verify the new link works

### Test 7: Error Cases

1. ✅ Click an already-used verification link
   - Should show: "Link expired" or similar error
   - Should NOT grant access

2. ✅ Wait 24 hours and click old link
   - Should show: "Link expired"
   - Should allow resending from app

## 🐛 Troubleshooting

### Issue: "Authorized domain" error

**Solution**: Make sure you added `joinbuzzd.app` to Firebase Console → Authentication → Authorized domains

### Issue: Email not arriving

**Possible causes**:
- Email enumeration protection is on (disable it)
- Email is in spam folder (check there)
- Firebase is throttling (wait a few minutes)

**Solution**:
1. Disable email enumeration protection
2. Use a real JMU email for testing
3. Check spam folder

### Issue: Verification page shows error even on first click

**Possible causes**:
- Firebase auth action not handled properly
- URL parameters missing
- Page not deployed

**Solution**:
1. Make sure verification page is deployed to `https://joinbuzzd.app/verification`
2. Check browser console for errors
3. Verify the page loads correctly

### Issue: "I Verified" button doesn't grant access

**Possible causes**:
- Email not actually verified yet
- Token not refreshed
- Session not updated

**Solution**:
1. Make sure you actually clicked the link in the email first
2. Wait 5-10 seconds after clicking the link
3. Then tap "I Verified" button in app
4. If still doesn't work, try signing out and back in

### Issue: Security rules blocking access

**Possible causes**:
- Email not verified in Firebase Auth
- Firestore rules misconfigured

**Solution**:
1. Check Firebase Console → Authentication → Users
2. Verify the "Email verified" column shows checkmark
3. If not, resend verification email

## 📊 Monitoring

After deployment, monitor:

1. **Firebase Console → Authentication → Users**
   - Check "Email verified" status for new users
   - Monitor time between signup and verification

2. **Firestore → users collection**
   - Check for `emailVerifiedAt` timestamps
   - Monitor how long users take to verify

3. **App logs**
   - Look for "✅ Recorded email verification" messages
   - Check for any error messages

## 🎉 Success Criteria

You'll know everything is working when:

- ✅ Verification emails arrive in under 1 minute
- ✅ Clicking the link shows success page (not error)
- ✅ "I Verified" button grants immediate access
- ✅ Unverified users are properly blocked
- ✅ No security bypasses possible
- ✅ Users can resend verification emails if needed

## 🔐 Security Summary

**What's Protected:**
- ✅ Email verification enforced at Firebase level
- ✅ Unverified users blocked from all features
- ✅ Cannot bypass verification (client or API)
- ✅ Verification links are unique and expire
- ✅ Security rules enforce email_verified claim

**What Users Can Do:**
- Unverified: Create account, see verification screen, read public venues
- Verified: Full app access including check-ins, events, messaging, etc.

**What's Recorded:**
- Account creation timestamp (`createdAt`)
- Email verification timestamp (`emailVerifiedAt`)
- All updates (`updatedAt`)

---

## Next Steps

1. **Configure Firebase** (add authorized domain)
2. **Deploy website** (`firebase deploy --only hosting`)
3. **Deploy iOS app** (build and upload to App Store)
4. **Test thoroughly** (follow testing checklist above)
5. **Monitor** (watch for issues in first 24 hours)

Good luck! 🚀
