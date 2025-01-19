import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, uploadString } from "firebase/storage";
import { HistoryEntry, DesignSession } from "../types";

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// Save a new design session
export async function saveDesignSession(session: DesignSession) {
  try {
    await setDoc(doc(db, 'sessions', session.id), {
      ...session,
      timestamp: session.timestamp.toISOString()
    });
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
}

// Get all design sessions for a user
export async function getUserSessions(userId: string) {
  try {
    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', userId),
      where('deleted', '==', false)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as DesignSession;
      return {
        ...data,
        id: doc.id,
        timestamp: new Date(data.timestamp)
      };
    });
  } catch (error) {
    console.error('Error getting user sessions:', error);
    throw error;
  }
}

// Update a design session
export async function updateDesignSession(sessionId: string, updates: Partial<DesignSession>) {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionRef, {
      ...updates,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
}

// Upload an image to Firebase Storage
export async function uploadImage(imageData: string, userId: string, sessionId: string) {
  try {
    const imagePath = `users/${userId}/sessions/${sessionId}/${Date.now()}.png`;
    const imageRef = ref(storage, imagePath);
    
    await uploadString(imageRef, imageData, 'data_url');
    const downloadUrl = await getDownloadURL(imageRef);
    
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

// Firestore functions
export const addDocument = (collectionName: string, data: any) =>
  addDoc(collection(db, collectionName), data);

export const getDocuments = async (collectionName: string) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateDocument = (collectionName: string, id: string, data: any) =>
  updateDoc(doc(db, collectionName, id), data);

export const deleteDocument = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};
