const admin = require('firebase-admin');
const serviceAccount = require('./buzzd-app-170b4-firebase-adminsdk-abftu-a8ce81d9e8.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkOrgVerifications() {
  try {
    const snapshot = await db.collection('org_verifications')
      .orderBy('created_at', 'desc')
      .limit(5)
      .get();
    
    if (snapshot.empty) {
      console.log('No org verification requests found');
      return;
    }

    console.log('Recent org verification requests:');
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('\n---');
      console.log('ID:', doc.id);
      console.log('Organization:', data.organization_name);
      console.log('User ID:', data.user_id);
      console.log('Proof URL:', data.proof_url);
      console.log('Status:', data.status);
      console.log('Created:', data.created_at?.toDate());
    });
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkOrgVerifications();
