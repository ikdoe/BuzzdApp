# Email Delivery Setup Guide - Fix 5-6 Minute Delays

## Quick Start (15 minutes to fix email delays)

### Step 1: Sign Up for Resend (FREE - 3,000 emails/month)

1. Go to https://resend.com
2. Sign up with your email
3. Verify your email address
4. Add your domain `joinbuzzd.com`:
   - Go to Domains → Add Domain
   - Add DNS records (they'll show you exactly what to add)
   - Verify domain (takes 5-10 min for DNS to propagate)

### Step 2: Get Your Resend API Key

1. In Resend dashboard, go to API Keys
2. Click "Create API Key"
3. Name it "Buzzd Production"
4. Copy the key (starts with `re_`)

### Step 3: Add Resend Key to Firebase

```bash
cd /Users/kendalljenkins/Downloads/web\ strip\ set\ up/Buzzd

# Add the Resend API key as a Firebase secret
firebase functions:secrets:set RESEND_API_KEY
# Paste your Resend API key when prompted (starts with re_)
```

### Step 4: Deploy Updated Functions

```bash
firebase deploy --only functions:sendCustomVerificationEmail
```

**That's it!** Emails will now be sent via Resend (usually <1 second delivery).

---

## Step 5: Test Email Delivery

1. Create a new test account in your app
2. Check how long the email takes to arrive
3. Check Firebase logs:

```bash
firebase functions:log --only sendCustomVerificationEmail
```

You should see:
```
✅ Resend delivered in 234ms (total: 456ms) → user@dukes.jmu.edu
```

---

## Optional: Add Postmark as Backup (Recommended)

Postmark is the most reliable email provider. Add it as a failover in case Resend has issues.

### 1. Sign Up for Postmark

1. Go to https://postmarkapp.com
2. Sign up (100 free emails to test)
3. Create a "Server" (their term for API key)
4. Add sender signature for `noreply@joinbuzzd.com`
5. Copy your Server API Token

### 2. Add Postmark to Firebase

```bash
firebase functions:secrets:set POSTMARK_TOKEN
# Paste your Postmark token when prompted
```

### 3. Deploy

```bash
firebase deploy --only functions:sendCustomVerificationEmail
```

Now you have **dual-provider redundancy**:
- Primary: Resend (free, fast)
- Backup: Postmark (paid after 100 emails, most reliable)
- Last resort: SendGrid (your current provider)

---

## Resend Domain Setup (Detailed)

When you add `joinbuzzd.com` to Resend, you'll need to add these DNS records:

### Required DNS Records:

1. **TXT record for domain verification**
   ```
   Name: @
   Type: TXT
   Value: [Resend will provide this]
   ```

2. **CNAME for DKIM**
   ```
   Name: resend._domainkey
   Type: CNAME
   Value: [Resend will provide this]
   ```

3. **Update existing SPF record** (you already have one)

   Current:
   ```
   v=spf1 include:_spf.google.com include:sendgrid.net ~all
   ```

   Update to:
   ```
   v=spf1 include:_spf.google.com include:sendgrid.net include:_spf.resend.com ~all
   ```

Add these records in your DNS provider (wherever you manage joinbuzzd.com DNS).

---

## How the Failover Works

The new code automatically tries providers in this order:

1. **Resend** (if `RESEND_API_KEY` is set)
   - Fastest delivery (<1 sec)
   - Free for 3,000 emails/month

2. **Postmark** (if `POSTMARK_TOKEN` is set)
   - Best reliability (99.9% inbox rate)
   - $15/mo for 10,000 emails

3. **SendGrid** (if `SENDGRID_KEY` is set)
   - Your current provider
   - Slower (5-6 min delays)

If Resend fails, it automatically tries Postmark. If both fail, it tries SendGrid.

---

## Monitoring Email Performance

### Check Logs After Sending

```bash
firebase functions:log --only sendCustomVerificationEmail
```

You'll see timing for each provider:

```
Attempting to send via resend (attempt 1/3)
✅ Resend delivered in 234ms (total: 456ms) → user@dukes.jmu.edu [id: abc123]
✅ Email delivered successfully via resend in 456ms total
```

### Metrics to Watch

- **Function execution time**: Should be <500ms
- **Email acceptance time**: Should be <300ms
- **Total delivery to inbox**: Should be <5 seconds

### If Resend Fails

You'll see:
```
Attempting to send via resend (attempt 1/3)
Provider resend failed: [error message]
Attempting to send via postmark (attempt 2/3)
✅ Email delivered successfully via postmark in 234ms total
```

This is normal and means the failover system is working!

---

## Cost Comparison

| Provider | Free Tier | Paid Price | Speed | Reliability |
|----------|-----------|------------|-------|-------------|
| **Resend** | 3,000/mo | $20/mo (50k) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Postmark** | 100 emails | $15/mo (10k) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **SendGrid** | 100/day | $20/mo (50k) | ⭐⭐ | ⭐⭐⭐ |

**Recommended Setup**: Resend (free) + Postmark backup ($15/mo)
**Total Cost**: $0-15/mo depending on volume
**Speed**: <1 second average
**Reliability**: 99.9% with failover

---

## Troubleshooting

### "Resend domain not verified"

1. Check DNS records in your domain provider
2. Wait 10-15 min for DNS propagation
3. Click "Verify" in Resend dashboard
4. If still failing, check DNS with: `dig joinbuzzd.com TXT`

### "RESEND_API_KEY not found"

Make sure you set it as a Firebase secret (not environment variable):
```bash
firebase functions:secrets:set RESEND_API_KEY
```

Then deploy:
```bash
firebase deploy --only functions:sendCustomVerificationEmail
```

### Emails still taking 5+ minutes

1. Check which provider is being used (check logs)
2. If using SendGrid, Resend may not be configured
3. Verify `RESEND_API_KEY` secret exists:
   ```bash
   firebase functions:secrets:access RESEND_API_KEY
   ```

### "All email providers failed"

This means ALL providers failed. Check:
1. API keys are correct
2. Domain is verified in provider dashboard
3. From address is authorized
4. Check provider dashboards for errors

---

## Force Specific Provider (For Testing)

To test a specific provider, set `MAIL_PROVIDER` environment variable:

```bash
# Test with SendGrid only
firebase functions:config:set mail.provider="sendgrid"

# Test with Postmark only
firebase functions:config:set mail.provider="postmark"

# Use default priority (Resend -> Postmark -> SendGrid)
firebase functions:config:unset mail.provider
```

Then redeploy:
```bash
firebase deploy --only functions:sendCustomVerificationEmail
```

---

## Expected Results

### Before (Current State)
- ❌ 5-6 minute email delays
- ❌ Users complaining about verification
- ❌ High abandonment rate

### After (With Resend)
- ✅ <1 second email delivery
- ✅ Instant verification experience
- ✅ Happy users
- ✅ Free (3,000 emails/month)

---

## Support

- **Resend Support**: https://resend.com/support
- **Postmark Support**: https://postmarkapp.com/support
- **Check Logs**: `firebase functions:log --only sendCustomVerificationEmail`

---

## Next Steps

1. ✅ Sign up for Resend (5 min)
2. ✅ Add domain to Resend (10 min)
3. ✅ Add API key to Firebase (1 min)
4. ✅ Deploy function (2 min)
5. ✅ Test with new account (1 min)
6. 🎉 Enjoy <1 second email delivery!

Total time: **~20 minutes to fix the problem permanently**
