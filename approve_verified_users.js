/**
 * One-time script to approve all users who have verified their email
 * but don't have approved=true set (due to the bug we just fixed)
 *
 * Run with: node approve_verified_users.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

async function approveVerifiedUsers() {
  const db = admin.firestore();
  const usersRef = db.collection('users');

  console.log('🔍 Searching for verified users who are not approved...');

  try {
    // Find all users who have emailVerifiedAt but approved != true
    const snapshot = await usersRef.get();

    let approvedCount = 0;
    let skippedCount = 0;

    const batch = db.batch();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const uid = doc.id;

      // Check if user has verified email but is not approved
      if (data.emailVerifiedAt && !data.approved) {
        console.log(`✅ Approving user: ${uid} (${data.email})`);
        batch.update(doc.ref, {
          approved: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        approvedCount++;
      } else if (data.approved) {
        skippedCount++;
      }
    }

    if (approvedCount > 0) {
      await batch.commit();
      console.log(`\n✅ Successfully approved ${approvedCount} verified users`);
    } else {
      console.log('\n✅ No users needed approval');
    }

    console.log(`📊 Summary:`);
    console.log(`  - Approved: ${approvedCount}`);
    console.log(`  - Already approved: ${skippedCount}`);
    console.log(`  - Total users: ${snapshot.size}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

approveVerifiedUsers()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
