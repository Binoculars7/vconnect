import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
  FirestoreError
} from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCiJFSq3_sy4wDN2QncaNyqO1MlSmtDn2Q",
  authDomain: "volunteer-a61d3.firebaseapp.com",
  projectId: "volunteer-a61d3",
  storageBucket: "volunteer-a61d3.firebasestorage.app",
  messagingSenderId: "783753586865",
  appId: "1:783753586865:web:84a3f071e33a4934da9a90",
  measurementId: "G-F2W8TS7GB9"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Recursive Timestamp converter
const convertTimestamp = (data: any): any => {
  if (data instanceof Timestamp) {
    return data.toDate().toISOString()
  }
  if (Array.isArray(data)) {
    return data.map(convertTimestamp)
  }
  if (data && typeof data === 'object') {
    const converted: any = {}
    Object.keys(data).forEach(key => {
      converted[key] = convertTimestamp(data[key])
    })
    return converted
  }
  return data
}

/* =========================
   EVENT FUNCTIONS
========================= */
export const createEvent = async (eventData: any) => {
  try {
    console.log('Creating event:', eventData)
    const docRef = await addDoc(collection(db, 'events'), {
      ...eventData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    console.log('Event created with ID:', docRef.id)
    return docRef
  } catch (error) {
    console.error('Error creating event:', error)
    throw error
  }
}

export const getEvents = async () => {
  try {
    console.log('Fetching all events...')
    const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamp(doc.data())
    }))
  } catch (error) {
    console.error('Error fetching events:', error)
    throw error
  }
}

export const getEventsByOwner = async (ownerId: string) => {
  try {
    console.log('Fetching events for owner:', ownerId)
    const q = query(
      collection(db, 'events'),
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamp(doc.data())
    }))
  } catch (error) {
    console.error('Error fetching events by owner:', error)

    if (error instanceof Error && 'code' in error && (error as FirestoreError).code === 'failed-precondition') {
      console.warn('Missing index, retrying without orderBy...')
      const q = query(collection(db, 'events'), where('ownerId', '==', ownerId))
      const snapshot = await getDocs(q)
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamp(doc.data())
      }))
      events.sort((a, b) =>
        new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime()
      )
      return events
    }

    throw error
  }
}

export async function getUserApplications(userId: string) {
  try {
    const applicationsRef = collection(db, "applications");
    const q = query(applicationsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const applications: any[] = [];
    querySnapshot.forEach((doc) => {
      applications.push({ id: doc.id, ...doc.data() });
    });

    return applications;
  } catch (error) {
    console.error("Error fetching user applications:", error);
    return [];
  }
}

/**
 * Get a single event by its Firestore document ID
 */
export const getEventById = async (eventId: string) => {
  try {
    console.log('Fetching event by ID:', eventId)
    const eventRef = doc(db, 'events', eventId)
    const snapshot = await getDoc(eventRef)

    if (!snapshot.exists()) {
      console.warn(`Event with ID ${eventId} not found.`)
      return null
    }

    return {
      id: snapshot.id,
      ...convertTimestamp(snapshot.data())
    }
  } catch (error) {
    console.error('Error fetching event by ID:', error)
    throw error
  }
}

export const updateEvent = async (eventId: string, updates: any) => {
  try {
    console.log(`Updating event ${eventId}:`, updates)
    const eventRef = doc(db, 'events', eventId)
    await updateDoc(eventRef, {
      ...updates,
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error updating event:', error)
    throw error
  }
}

export const deleteEvent = async (eventId: string) => {
  try {
    console.log('Deleting event:', eventId)
    await deleteDoc(doc(db, 'events', eventId))
  } catch (error) {
    console.error('Error deleting event:', error)
    throw error
  }
}

/* =========================
   APPLICATION FUNCTIONS
========================= */
export const createApplication = async (applicationData: any) => {
  try {
    console.log('Creating application:', applicationData)
    const docRef = await addDoc(collection(db, 'applications'), {
      ...applicationData,
      status: 'pending',
      createdAt: Timestamp.now()
    })
    console.log('Application created with ID:', docRef.id)
    return docRef
  } catch (error) {
    console.error('Error creating application:', error)
    throw error
  }
}

export const getApplicationsByEvent = async (eventId: string) => {
  try {
    console.log('Fetching applications for event:', eventId)
    const q = query(collection(db, 'applications'), where('eventId', '==', eventId))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamp(doc.data())
    }))
  } catch (error) {
    console.error('Error fetching applications by event:', error)
    throw error
  }
}

export const getApplicationsByUser = async (userId: string) => {
  try {
    console.log('Fetching applications for user:', userId)
    try {
      const q = query(
        collection(db, 'applications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamp(doc.data())
      }))
    } catch (indexError) {
      if (indexError instanceof Error && 'code' in indexError && (indexError as FirestoreError).code === 'failed-precondition') {
        console.warn('Missing index, retrying without orderBy...')
        const q = query(collection(db, 'applications'), where('userId', '==', userId))
        const snapshot = await getDocs(q)
        const applications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...convertTimestamp(doc.data())
        }))
        applications.sort((a, b) =>
          new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime()
        )
        return applications
      }
      throw indexError
    }
  } catch (error) {
    console.error('Error fetching applications by user:', error)
    throw error
  }
}

export const getUserProfile = async (userId: string) => {
  try {
    console.log("Fetching user profile for:", userId);

    // Validate input
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      console.warn("getUserProfile: Valid userId is required");
      return null;
    }

    try {
      // First attempt: with orderBy
      const q = query(
        collection(db, "users"),
        where("id", "==", userId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log(`No user document found for userId: ${userId}`);
        return null;
      }

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamp(doc.data())
      }))[0]; // Return first match
    } catch (indexError) {
      // Retry if Firestore index/precondition error
      if (
        indexError instanceof Error &&
        "code" in indexError &&
        (indexError as FirestoreError).code === "failed-precondition"
      ) {
        console.warn("Missing index, retrying without orderBy...");

        const q = query(
          collection(db, "users"),
          where("id", "==", userId)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          return null;
        }

        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...convertTimestamp(doc.data())
        }));

        // Manual sort if createdAt exists
        users.sort((a, b) =>
          new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime()
        );

        return users[0];
      }

      console.error("Firestore query error:", indexError);
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};



export const updateApplicationStatus = async (
  applicationId: string,
  status: 'approved' | 'declined'
) => {
  try {
    console.log(`Updating application ${applicationId} to:`, status)
    const ref = doc(db, 'applications', applicationId)
    await updateDoc(ref, {
      status,
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error updating application status:', error)
    throw error
  }
}

/* =========================
   DEBUG FUNCTIONS
========================= */
export const debugCollections = async () => {
  try {
    console.log('=== DEBUG: Checking collections ===')

    const eventsSnapshot = await getDocs(collection(db, 'events'))
    console.log('Events count:', eventsSnapshot.size)
    eventsSnapshot.forEach(doc => console.log('Event:', doc.id, doc.data()))

    const applicationsSnapshot = await getDocs(collection(db, 'applications'))
    console.log('Applications count:', applicationsSnapshot.size)
    applicationsSnapshot.forEach(doc => console.log('Application:', doc.id, doc.data()))

    console.log('=== END DEBUG ===')
  } catch (error) {
    console.error('Debug error:', error)
  }
}
