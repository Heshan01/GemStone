import { collection, getDocs, setDoc, doc, getDocFromServer } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

const DEFAULT_CATEGORIES = [
  { id: 'blue-sapphire', name: 'Blue Sapphire' },
  { id: 'ruby', name: 'Ruby' },
  { id: 'cats-eye', name: 'Cat\'s Eye' },
  { id: 'spinel', name: 'Spinel' },
  { id: 'garnet', name: 'Garnet' },
  { id: 'moonstone', name: 'Moonstone' },
  { id: 'padparadscha', name: 'Padparadscha' },
  { id: 'alexandrite', name: 'Alexandrite' },
  { id: 'yellow-sapphire', name: 'Yellow Sapphire' },
  { id: 'pink-sapphire', name: 'Pink Sapphire' },
  { id: 'tourmaline', name: 'Tourmaline' },
  { id: 'zircon', name: 'Zircon' }
];

export async function initDatabase() {
  try {
    // 1. Validate connection (as strictly mandated in firestore-integration skill)
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (e) {
      if (e instanceof Error && e.message.includes('client is offline')) {
        console.warn('Firebase connection is offline or unconfigured.');
      }
    }

    // 2. Seed default categories if they don't exist
    const categoriesRef = collection(db, 'categories');
    const catSnap = await getDocs(categoriesRef);
    if (catSnap.empty) {
      console.log('Seeding default gem categories...');
      for (const cat of DEFAULT_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), cat);
      }
    }

    // 3. Seed initial site announcement if none exists
    const announcementsRef = collection(db, 'announcements');
    const annSnap = await getDocs(announcementsRef);
    if (annSnap.empty) {
      console.log('Seeding initial announcement...');
      await setDoc(doc(db, 'announcements', 'welcome'), {
        id: 'welcome',
        title: 'Welcome to RatnaGem Marketplace!',
        content: 'Connecting the legendary Ratnapura gem trading community online. Browse certified gemstones, negotiate directly via chat, and enjoy secure trading. Verified profiles are labeled with badges.',
        isActive: true,
        createdAt: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Database initialization error:', error);
    // Silent catch during initial guest load to prevent page crashes
  }
}
