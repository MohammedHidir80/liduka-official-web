// lib/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
  signOut,
  deleteUser,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";

// Same wallet doc as mobile: wallets/{uid}
async function createWalletForUser(uid, role) {
  if (!uid || typeof uid !== "string") throw new Error("Invalid UID");
  if (role !== "buyer" && role !== "vendor") throw new Error("Invalid role value");

  await setDoc(doc(db, "wallets", uid), {
    userId: uid,
    balance: 0,
    type: role,
    createdAt: serverTimestamp(),
  });
}

// Sign up + users doc + wallet (same fields as mobile)
export async function signUp({
  email,
  password,
  fullName,
  phone = "",
  role = "buyer",
  geoInfo = {},
  userLocation = null,
  beforeProfile = null,
}) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const user = cred.user;

  // Runs after the auth user exists but before anything is saved or emailed
  if (beforeProfile) {
    try {
      await beforeProfile(user);
    } catch (err) {
      await deleteUser(user).catch(() => {});
      throw err;
    }
  }

  await sendEmailVerification(user);

  // Copy only the fields we expect, so nothing unexpected can reach Firestore
  const locationFields = {};
  if (userLocation) {
    for (const key of ["latitude", "longitude", "city", "region", "regionLabel", "country"]) {
      if (userLocation[key] !== undefined && userLocation[key] !== "") {
        locationFields[key] = userLocation[key];
      }
    }
    locationFields.locationDetectedAt = serverTimestamp();
  }

  await setDoc(doc(db, "users", user.uid), {
    fullName: fullName.trim(),
    email: email.trim(),
    role,
    phone,
    photoURL: "",
    walletId: user.uid,
    country: geoInfo?.country || "Unknown",
    currency: geoInfo?.currency || "GHS",
    symbol: geoInfo?.symbol || "₵",
    ...locationFields, // spread after country so the GPS-based country wins
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp(),
  });

  try {
    await createWalletForUser(user.uid, role);
  } catch (walletError) {
    console.error("Wallet creation failed:", walletError.message);
  }

  return user;
}
// Sign in with the same checks as mobile, but signs out on wrong role
export async function signIn(email, password, expectedRole = "buyer") {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  const user = cred.user;

  await reload(user);

  if (!user.emailVerified) {
    const err = new Error("Please check your email and verify your account.");
    err.code = "app/email-not-verified";
    throw err;
  }

  const snap = await getDoc(doc(db, "users", user.uid));

  if (!snap.exists() || snap.data().role !== expectedRole) {
    await signOut(auth); // mobile doesn't do this; web should
    const err = new Error(`This is not a ${expectedRole} account.`);
    err.code = "app/wrong-role";
    throw err;
  }

  await updateDoc(doc(db, "users", user.uid), { lastActive: serverTimestamp() });

  return { user, profile: snap.data() };
}

export function logOut() {
  return signOut(auth);
}

export async function resendVerification() {
  if (!auth.currentUser) throw new Error("No signed-in user.");
  await sendEmailVerification(auth.currentUser);
}

export function sendResetEmail(email) {
  return sendPasswordResetEmail(auth, email.trim());
}

// Same toast titles/messages as mobile, plus the modern error codes
export function getAuthError(error) {
  switch (error?.code) {
    case "auth/user-not-found":
      return { title: "User Not Found", message: "No account exists with that email." };
    case "auth/wrong-password":
      return { title: "Incorrect Password", message: "Please check your password." };
    case "auth/invalid-credential":
      return { title: "Login Failed", message: "Incorrect email or password." };
    case "auth/invalid-email":
      return { title: "Invalid Email", message: "Please enter a valid email address." };
    case "auth/email-already-in-use":
      return { title: "Email Already In Use", message: "Try signing in instead." };
    case "auth/weak-password":
      return { title: "Weak Password", message: "Use at least 6 characters." };
    case "auth/too-many-requests":
      return { title: "Too Many Attempts", message: "Please wait a moment and try again." };
    case "auth/network-request-failed":
      return { title: "Network Error", message: "Check your connection and try again." };
    case "app/email-not-verified":
      return { title: "Email not verified", message: "Please check your email and verify your account." };
    case "app/wrong-role":
      return { title: "Access Denied", message: error.message };
    default:
      return { title: "Authentication Failed", message: error?.message || "Something went wrong." };
    case "app/invite-invalid":
      return { title: "Invalid Invite Code", message: "This invite code does not exist." };
    case "app/invite-used":
      return { title: "Code Already Used", message: "This invite code has already been used." };
  }
}