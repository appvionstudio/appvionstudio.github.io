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

Copy the Firebase Web App config into both files:

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
