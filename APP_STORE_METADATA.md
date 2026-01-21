# App Store Metadata Checklist

## Step-by-Step: Submitting to App Store Connect

### 1. Go to App Store Connect
- Visit: https://appstoreconnect.apple.com
- Sign in with your Apple Developer account
- Click "My Apps"
- Click the "+" button → "New App"

---

## 2. Basic App Information

**Platform**: iOS

**App Name**: Buzzd

**Primary Language**: English (U.S.)

**Bundle ID**: com.joinbuzzd.Buzzd

**SKU**: buzzd-jmu-001 (or any unique identifier)

**User Access**: Full Access (reviewers can test the app)

---

## 3. App Information Section

### Name
```
Buzzd
```

### Subtitle (30 characters max)
```
JMU Nightlife & Events
```

### Primary Category
**Social Networking**

### Secondary Category (optional)
**Lifestyle** or **Entertainment**

### Age Rating
**17+** (Required due to alcohol/nightlife context and age verification requirement)

When filling out content rights questions:
- Alcohol, Tobacco, or Drug Use: **Infrequent/Mild References**
- Other: Check "None" for most categories

---

## 4. App Description (4000 characters max)

```
Buzzd is the ultimate social platform for JMU students to discover and experience campus nightlife. Find the hottest venues, connect with friends, and never miss out on the buzz.

🗺️ DISCOVER THE SCENE
• Explore nearby bars, clubs, and nightlife venues
• See real-time event listings and cover charges
• Interactive map showing live venue activity
• Get updates on what's trending tonight
• View nightlife scores and venue popularity

👥 CONNECT WITH FRIENDS
• Find and add JMU friends on campus
• See where your friends are heading
• Share your night out with the community
• Friend activity feed and check-ins
• Private messaging and group coordination

🎟️ EVENTS & TICKETING
• Browse upcoming events and parties
• Purchase tickets securely in-app with Apple Pay
• Get Apple Wallet passes for easy venue entry
• QR code scanning for quick check-in
• Event reminders and notifications
• Save favorite events and venues

🔒 SAFETY & VERIFICATION
• Secure JMU email verification required (@dukes.jmu.edu or @jmu.edu)
• Password-protected accounts
• Age verification (17+ requirement)
• Privacy-focused design
• Safe and trusted community

📍 SMART FEATURES
• Location-based venue discovery
• Real-time event updates
• Push notifications for events and friends
• Profile customization
• Event photo sharing

WHY BUZZD?
Buzzd makes it easy to stay connected with JMU's vibrant nightlife scene. Whether you're looking for tonight's plans, want to meet up with friends, or discover new venues, Buzzd keeps you in the loop.

REQUIREMENTS
• Must be a JMU student with a valid @dukes.jmu.edu or @jmu.edu email
• Must be 17 years or older
• Location services required for venue discovery
• Internet connection required

Join the Buzzd community and experience JMU nightlife like never before!

CONTACT & SUPPORT
Questions or feedback? Reach out to us at support@joinbuzzd.com
```

---

## 5. What's New in This Version (Version 1.0)

```
Welcome to Buzzd! 🎉

Discover JMU's nightlife scene:
• Interactive venue map
• Real-time events and cover charges
• Connect with friends
• Secure in-app ticketing
• Apple Wallet integration
• QR code check-ins

Get started today with your JMU email!
```

---

## 6. Keywords (100 characters max, comma-separated)

```
jmu,nightlife,bars,events,tickets,social,college,parties,venues,friends,james madison university
```

(Total: 98 characters)

---

## 7. Support & Privacy URLs

### Support URL
You need to create a simple support page. Options:
1. Create a page on your website: `https://joinbuzzd.com/support`
2. Use a free GitHub pages site
3. Use a Google Sites page
4. Simple email: Put a landing page that says "Email support@joinbuzzd.com"

**Temporary placeholder**: `https://joinbuzzd.com` (update when ready)

### Privacy Policy URL
**Required!** You must have a privacy policy. Options:
1. Host on your website: `https://joinbuzzd.com/privacy`
2. Use privacy policy generator: https://www.privacypolicies.com/
3. GitHub pages

Based on your app, your privacy policy should mention:
- Email collection (for authentication)
- Name collection
- Location data collection (for venue discovery)
- Photo/video collection (for events)
- Financial data (for ticket purchases via Stripe)
- How data is stored (Firebase)
- Data sharing with third parties (Firebase, Mapbox, Stripe, Google Places)
- User rights and data deletion

---

## 8. Promotional Text (170 characters, appears above description)

```
See what's happening tonight at JMU! Connect with friends, discover venues, and get tickets to the hottest events on campus. 🎉
```

---

## 9. App Review Information

### Contact Information
**First Name**: [Your first name]
**Last Name**: [Your last name]
**Phone**: [Your phone number with country code]
**Email**: [Your email]

### Demo Account (IMPORTANT!)
Apple reviewers need to test your app. Create a test account:

**Username**: appreviewer@dukes.jmu.edu (or similar test account)
**Password**: TestBuzzd2025!

⚠️ **Important**:
- This account must work and be verified
- You may need to manually verify it in Firebase
- Set the account's `approved: true` in Firestore
- Add a note explaining this is a test JMU account

### Notes
```
Thank you for reviewing Buzzd!

IMPORTANT NOTES FOR TESTING:
1. This app requires a JMU email address (@dukes.jmu.edu or @jmu.edu) to sign up
2. We have provided a test account above that is pre-verified
3. Location services are required for the map and venue discovery features
4. Some features (tickets, events) may require staging data - we have populated test events

If you need any assistance during review, please contact us at the email/phone provided.
```

---

## 10. Build & Version Info

### Version Number
`1.0`

### Build Number
Check in Xcode: Select Buzzd target → General → Identity
- Should match your current build number
- Usually `1` for first submission

### Copyright
```
© 2025 Buzzd, Inc.
```
or
```
© 2025 [Your Name or Company Name]
```

---

## 11. App Store Availability

### Price
**Free** (with in-app purchases for tickets)

### Availability
**United States** (start here, can add more countries later)

You could also consider:
- Make it available only in Virginia
- Or just in the US

---

## 12. Before You Submit Checklist

- [ ] All metadata filled out in App Store Connect
- [ ] 3-10 screenshots for each required device size uploaded
- [ ] App icon (1024x1024) uploaded
- [ ] Privacy policy URL is live and accessible
- [ ] Support URL is live and accessible
- [ ] Demo account created and verified
- [ ] App built in Release mode and archived
- [ ] Build uploaded to App Store Connect via Xcode
- [ ] Selected build for this version
- [ ] Reviewed all information for accuracy
- [ ] Selected appropriate age rating (17+)
- [ ] Added export compliance information (usually "No" for encryption)

---

## 13. How to Upload Your Build

1. **In Xcode**:
   - Select "Any iOS Device" as destination
   - Product → Archive
   - Wait for archive to complete
   - Xcode Organizer will open

2. **In Organizer**:
   - Select your archive
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Follow the prompts
   - Wait for upload (can take 10-30 minutes)

3. **In App Store Connect**:
   - Go to your app
   - Under "TestFlight" or "App Store", you'll see your build
   - Select the build for your 1.0 version
   - Click "Submit for Review"

---

## 14. After Submission

- Review typically takes 24-48 hours
- You'll get email updates about status changes
- App Store Connect will show status: "Waiting for Review" → "In Review" → "Approved/Rejected"
- If rejected, Apple will explain why - you can fix and resubmit

---

## Tips for Approval

✅ **DO**:
- Test everything thoroughly before submitting
- Provide working demo account
- Make sure email verification works smoothly
- Have a clear, accurate description
- Include helpful notes for reviewers

❌ **DON'T**:
- Submit with obvious bugs or crashes
- Use placeholder content in screenshots
- Forget to test on real devices
- Submit without privacy policy
- Use beta or test language in production

---

## Need Help?

Common issues:
- **Missing privacy policy**: Must have one before submission
- **Screenshots don't match**: Make sure device sizes are correct
- **Build not appearing**: Can take up to an hour after upload
- **Can't submit**: Check all required fields are filled

---

Good luck with your submission! 🚀
