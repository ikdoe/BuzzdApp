# Fix Email Verification - Quick Guide

## The Problem

Error: `Domain not allowlisted by project - auth/unauthorized-continue-uri`

Firebase is blocking the verification link because `joinbuzzd.app` is not in the authorized domains list.

## The Fix (Do This Now)

### Step 1: Add Domain to Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/project/buzzd-app-170b4/authentication/settings)
2. Click on **Authentication** → **Settings** → **Authorized domains**
3. Click **"Add domain"**
4. Enter: `joinbuzzd.app`
5. Click **Add**

That's it! This will fix the error.

### Step 2: Test Again

1. Open your app
2. Try creating a new account
3. Email should send successfully now from `noreply@joinbuzzd.com`
4. Click the verification link
5. Should open `https://joinbuzzd.app/verification` (once you upload the HTML page)

## Important Notes

### About SendGrid Sender Verification

The sender email `noreply@joinbuzzd.com` must be verified in SendGrid. There are two ways:

#### Option 1: Single Sender Verification (Quick)
1. Go to SendGrid Dashboard → Settings → [Sender Authentication](https://app.sendgrid.com/settings/sender_auth)
2. Click "Verify a Single Sender"
3. Enter `noreply@joinbuzzd.com` and your details
4. SendGrid will send a verification email to `noreply@joinbuzzd.com`
5. You must have access to that email to verify it

**Problem**: You probably don't have access to `noreply@joinbuzzd.com` mailbox.

#### Option 2: Domain Authentication (Recommended)
1. Go to SendGrid Dashboard → Settings → [Sender Authentication](https://app.sendgrid.com/settings/sender_auth)
2. Click "Authenticate Your Domain"
3. Enter `joinbuzzd.com`
4. SendGrid will give you DNS records to add
5. Add those DNS records to your domain registrar (where you bought joinbuzzd.com)
6. Wait for verification (usually 24-48 hours, but can be faster)
7. Once verified, you can send from any `@joinbuzzd.com` address

**This is the proper production solution.**

### Temporary Workaround

If you can't verify `noreply@joinbuzzd.com` right now, you can temporarily use a personal email:

```bash
firebase functions:secrets:set SENDGRID_FROM
# Enter: your_verified_email@example.com
firebase deploy --only functions:sendCustomVerificationEmail
```

Just make sure that email is verified in SendGrid first.

## Summary

**Right Now:**
1. ✅ Add `joinbuzzd.app` to Firebase authorized domains (REQUIRED - do this first)
2. ✅ Verify sender in SendGrid (see options above)
3. ✅ Upload `verification.html` to your website

**Then Test:**
- Create account → Email sends fast from your configured sender
- Click link → Opens your custom success page
- Return to app → Tap "I Verified" → Instant access

The code is ready, you just need those 3 things configured!
