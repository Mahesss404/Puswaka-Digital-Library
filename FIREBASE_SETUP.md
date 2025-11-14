# Firebase Authentication Setup Guide

## 1. Install Firebase SDK

Run this command in your project directory:

```bash
npm install firebase
```

## 2. Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. If you don't have a web app, click "Add app" and select the web icon `</>`
7. Copy your Firebase configuration object

## 3. Update Firebase Config

Open `src/lib/firebase.js` and replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",                    // Replace with your API key
  authDomain: "YOUR_AUTH_DOMAIN",            // Replace with your auth domain
  projectId: "YOUR_PROJECT_ID",             // Replace with your project ID
  storageBucket: "YOUR_STORAGE_BUCKET",     // Replace with your storage bucket
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your sender ID
  appId: "YOUR_APP_ID"                      // Replace with your app ID
};
```

## 4. Enable Authentication Methods in Firebase Console

### Enable Phone Authentication:
1. Go to Firebase Console > Authentication
2. Click "Get started" if you haven't enabled it
3. Go to "Sign-in method" tab
4. Enable "Phone" provider
5. Add your phone number for testing (optional, for development)

### Enable Email/Password Authentication:
1. In the same "Sign-in method" tab
2. Enable "Email/Password" provider
3. Enable "Email link (passwordless sign-in)" if needed (optional)

## 5. Configure reCAPTCHA (for Phone Auth)

Firebase automatically handles reCAPTCHA for phone authentication. Make sure:
- Your domain is authorized in Firebase Console
- For localhost development, it should work automatically
- For production, add your domain in Firebase Console > Authentication > Settings > Authorized domains

## 6. Test the Implementation

1. Start your development server: `npm run dev`
2. Navigate to `/login`
3. Try both authentication methods:
   - **Phone OTP**: Enter phone number, receive OTP, verify
   - **Email/Password**: Enter email and password (will auto-create account if doesn't exist)

## Notes

- Phone authentication requires a valid phone number with country code (e.g., +628123456789)
- Email/Password authentication will automatically create an account if the user doesn't exist
- All authentication state is stored in localStorage
- The app uses Firebase Auth for authentication but still uses localStorage for other app data

## Troubleshooting

### Phone Auth Not Working:
- Check if phone authentication is enabled in Firebase Console
- Verify reCAPTCHA is loading (check browser console)
- Make sure phone number format is correct (with country code)

### Email/Password Not Working:
- Verify Email/Password is enabled in Firebase Console
- Check Firebase Console > Authentication > Users to see if users are being created
- Check browser console for error messages

### reCAPTCHA Issues:
- Clear browser cache and cookies
- Make sure you're using HTTPS in production (or localhost for development)
- Check Firebase Console > Authentication > Settings > Authorized domains

