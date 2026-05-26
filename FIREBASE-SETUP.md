# AppVion Firebase Setup

The code is ready for Firebase Auth + Firestore.

## Firebase Console

1. Create a Firebase project.
2. Add a Web App.
3. Enable Authentication -> Email/Password.
4. Add this admin user:

```text
appvionstudio@gmail.com
```

5. Enable Firestore Database.
6. Add the rules from `firebase-firestore.rules`.

## Website Config

Copy the Firebase Web App config into the inline Firebase config script in these files:

- `index.html`
- `appvion-control.html`

Replace:

```js
window.APPVION_FIREBASE_CONFIG = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_FIREBASE_PROJECT.firebaseapp.com",
    projectId: "YOUR_FIREBASE_PROJECT_ID",
    storageBucket: "YOUR_FIREBASE_PROJECT.appspot.com",
    messagingSenderId: "YOUR_FIREBASE_SENDER_ID",
    appId: "YOUR_FIREBASE_APP_ID"
};
```

After this:

1. Open `appvion-control.html`.
2. Login with the Firebase email/password user.
3. Edit content.
4. Click **Publish Live**.
5. The public website reads the Firestore content from `siteContent/home`.

## Project Brief Form

The public contact form now saves new leads to Firestore:

```text
projectBriefs/{autoId}
```

Deploy the updated `firebase-firestore.rules` before testing the live form. The rules allow public visitors to create leads, while only `appvionstudio@gmail.com` can manage website content, project briefs, and contact activity.

If you use Firebase CLI:

```bash
firebase login
firebase deploy --only firestore:rules --project appvion-studio
```

After deployment, open `appvion-control.html`, login, and use the **Briefs** tab to read submissions.

The website also sends a free FormSubmit email alert to:

```text
ayyazali.sajjadali@gmail.com
```

If FormSubmit sends an activation email the first time, approve it once from that Gmail inbox. After that, new project briefs and confirmed Calendly popup bookings can notify the admin even when the dashboard is closed.
