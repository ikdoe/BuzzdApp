# Create Test Account - Step by Step

## What Email Should You Use?

### Best Option: Gmail + Trick
If your JMU email is: `kendall.jenkins@dukes.jmu.edu`

Create test account with: `kendall.jenkins+test@dukes.jmu.edu`

**All emails will come to your normal inbox!**

---

## Step-by-Step Account Creation

### 1. In the Buzzd App:

**Sign Up Screen:**
- First Name: `Test`
- Last Name: `User`
- Email: `youremail+test@dukes.jmu.edu` (replace with your real email)
- Username: `testuser123`
- Password: `TestPass123!`
- Accept terms and privacy

### 2. After Account Created:

The app will show the **Email Verification Screen**

### 3. Check Your Email:

Look for email from Firebase (check spam if needed)
Subject: "Verify your email for Buzzd"

### 4. Click the Verification Link:

Opens in browser → Shows "Email verified" page

### 5. Return to App:

Tap "I Verified — Continue" button

### 6. You're In!

Should now have access to the app

---

## If Email Doesn't Arrive - Manual Method

### Go to Firebase Console:

1. **Open:** https://console.firebase.google.com/project/buzzd-app-170b4/authentication/users

2. **Find your test user** in the list (search by email)

3. **Click the 3 dots** (⋮) next to the user

4. **Select "Edit user"**

5. **Check "Email verified"** checkbox

6. **Click "Save"**

7. **Go to Firestore Database:**
   https://console.firebase.google.com/project/buzzd-app-170b4/firestore/databases/-default-/data/~2Fusers

8. **Find the user document** (by user ID)

9. **Click "Edit document"** (pencil icon)

10. **Find or add field:**
    - Field: `approved`
    - Type: `boolean`
    - Value: `true`

11. **Click "Update"**

12. **Go back to app and try signing in!**

---

## Test Account Suggestions

Create these test accounts to test different scenarios:

### 1. **Standard User**
- Email: `youremail+user1@dukes.jmu.edu`
- Username: `testuser1`
- Purpose: Regular user testing

### 2. **Friend/Social Testing**
- Email: `youremail+friend@dukes.jmu.edu`
- Username: `testfriend`
- Purpose: Test friend requests, following

### 3. **Event Creator**
- Email: `youremail+creator@dukes.jmu.edu`
- Username: `eventcreator`
- Purpose: Test event creation

### 4. **Venue Host** (if different from your main)
- Email: `youremail+host@dukes.jmu.edu`
- Username: `venuehost`
- Purpose: Test host features

---

## Quick Reference: Gmail + Trick

**How it works:**
- Gmail ignores everything between `+` and `@`
- `user+anything@gmail.com` → All goes to `user@gmail.com`
- Firebase sees them as different emails
- Perfect for testing!

**Examples:**
```
realuser@dukes.jmu.edu          ← Your real account
realuser+test1@dukes.jmu.edu    ← Test account 1
realuser+test2@dukes.jmu.edu    ← Test account 2
realuser+staging@dukes.jmu.edu  ← Staging account
realuser+demo@dukes.jmu.edu     ← Demo account
```

All emails arrive in the same inbox!

---

## Troubleshooting

### "Email already in use"
- That email is already registered
- Try a different + alias
- Or delete the old account in Firebase Console

### "Email not verified" error persists
- Wait 10 seconds after clicking link
- Try clicking "I Verified" again
- Check Firebase Console to manually verify
- Sign out and sign in again

### Can't receive emails
- Check spam/junk folder
- Verify JMU email is working
- Try "Resend Verification Email" button
- Use manual verification method above

### App crashes on signup
- Make sure you filled all required fields
- Check password meets requirements (8+ chars, uppercase, lowercase, number, special)
- Check username is 3-20 characters
- Try signing out completely and try again

---

## After Testing

### Clean Up Test Accounts

When done testing, delete test accounts:

1. **Firebase Console → Authentication → Users**
2. Find test accounts
3. Click 3 dots → **Delete account**
4. Confirm deletion

Or keep them for future testing!

---

## Need More Help?

If you need a completely separate test environment:
- I can add a "Test Mode" flag
- Or set up a second Firebase project for staging
- Or create automated test accounts

Let me know what works best for you!
