# Custom Email Verification Setup - Complete Guide

## What We Built

✅ **Custom email verification system using SendGrid** that sends emails from `noreply@joinbuzzd.com` (or whatever email you configure) instead of Firebase's default sender.

## Files Created/Modified

### New Files:
1. `functions/src/customEmailVerification.ts` - Cloud Function to send custom verification emails
2. `verification.html` - Landing page for verified users

### Modified Files:
1. `functions/src/index.ts` - Exports the new function
2. `Buzzd/Data/Services/AuthService.swift` - Uses custom verification
3. `Buzzd/Features/Auth/VerifyEmailView.swift` - Uses custom verification for resends

## Setup Steps

### Step 1: Configure SendGrid Sender Email

First, make sure your `SENDGRID_FROM` secret is set to `noreply@joinbuzzd.com`:

```bash
cd functions
firebase functions:secrets:set SENDGRID_FROM
```

When prompted, enter: `noreply@joinbuzzd.com`

**Important:** You must verify this email/domain in SendGrid first:
1. Go to SendGrid Dashboard → Settings → Sender Authentication
2. Either:
   - **Single Sender Verification**: Verify `noreply@joinbuzzd.com` as a single sender (easier, but less professional)
   - **Domain Authentication**: Verify the entire `joinbuzzd.com` domain (recommended for production)

### Step 2: Deploy the Cloud Function

Deploy the new `sendCustomVerificationEmail` function:

```bash
cd functions
npm install  # Make sure dependencies are up to date
firebase deploy --only functions:sendCustomVerificationEmail
```

This will deploy your custom email function to: `https://us-central1-buzzd-app-170b4.cloudfunctions.net/sendCustomVerificationEmail`

### Step 3: Upload Verification Page

Upload the `verification.html` file to your website at `https://joinbuzzd.app/verification`

#### If you use GitHub Pages or similar:
1. Create a folder named `verification` in your website repo
2. Rename `verification.html` to `index.html`
3. Place it in the `verification` folder
4. Push to GitHub
5. Access it at `https://joinbuzzd.app/verification`

#### If you use custom hosting:
1. Upload `verification.html` to your server
2. Configure your web server so it's accessible at `https://joinbuzzd.app/verification`

### Step 4: Test the Complete Flow

1. **Build and run the iOS app**:
   ```bash
   cd Buzzd
   xcodebuild -workspace Buzzd.xcworkspace -scheme Buzzd -configuration Debug
   ```

2. **Create a test account** with a real JMU email you can access

3. **Check your email**:
   - Should arrive within seconds (not 2 minutes!)
   - Should be from `noreply@joinbuzzd.com` (or your configured sender)
   - Should have a nice branded email template

4. **Click the verification link**:
   - Should open `https://joinbuzzd.app/verification` in your browser
   - Should show your custom success page (not a Firebase error)
   - Should display your email address

5. **Return to the app**:
   - Tap "I Verified" button
   - Should immediately grant access to the app

## How It Works

### Email Flow:
1. User creates account → Swift calls `sendCustomVerificationEmail(for: user)`
2. Swift gets user's ID token and sends it to Cloud Function
3. Cloud Function verifies the token, generates verification link
4. Cloud Function sends beautiful HTML email via SendGrid from `noreply@joinbuzzd.com`
5. Email arrives fast (usually < 10 seconds)

### Verification Flow:
1. User clicks link → Opens `https://joinbuzzd.app/verification?email={user_email}`
2. Custom page shows success message
3. User returns to app → Taps "I Verified"
4. App force-refreshes user token and session
5. AuthGate detects verified email → Grants instant access

## Troubleshooting

### Emails Not Sending
- Check that `SENDGRID_KEY` secret is set: `firebase functions:secrets:access SENDGRID_KEY`
- Check that `SENDGRID_FROM` is set to your verified sender
- Check SendGrid dashboard for errors
- Check Cloud Function logs: `firebase functions:log --only sendCustomVerificationEmail`

### "Invalid authentication token" Error
- Make sure the app is getting a valid ID token
- Check that user is signed in before sending verification

### Verification Page Not Loading
- Make sure `verification.html` is uploaded to `https://joinbuzzd.app/verification`
- Test the URL directly in your browser
- Check for HTTPS (must be secure)

### "I Verified" Button Not Working
- The fix is already in place in `VerifyEmailView.swift`
- Make sure you've rebuilt the app after the code changes
- Check that user actually clicked the verification link

### Emails Taking Too Long
- SendGrid typically delivers in < 10 seconds
- If slow, check SendGrid's "Activity" dashboard for delivery status
- Make sure your SendGrid account is not in sandbox mode

## Cost Estimate

### SendGrid Pricing:
- **Free Tier**: 100 emails/day forever
- **Essentials**: $19.95/month for 50,000 emails
- **Pro**: $89.95/month for 100,000 emails

For a student app, the free tier should be plenty to start!

## Email Customization

The email template is in `functions/src/customEmailVerification.ts` (lines 115-200).

You can customize:
- Colors (currently purple gradient: `#667eea` to `#764ba2`)
- Text content
- Logo/branding (add an image URL)
- Button styling
- Footer information

## Verification Page Customization

The landing page is in `verification.html`.

You can customize:
- Colors (currently matches your purple theme)
- Instructions
- Add your logo
- Add app download links
- Add social media links

## Next Steps

1. **Deploy functions**: `firebase deploy --only functions:sendCustomVerificationEmail`
2. **Upload verification page** to `joinbuzzd.app/verification`
3. **Test the flow** end-to-end
4. **Customize** the email and page to match your branding

## Summary

✅ Emails sent from `noreply@joinbuzzd.com` via SendGrid
✅ Fast delivery (< 10 seconds typically)
✅ Beautiful branded email template
✅ Custom verification success page
✅ Instant access after verification
✅ Fixed all UI overlapping issues

All code is ready - you just need to deploy and upload!
