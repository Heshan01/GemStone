import React, { useEffect, useState } from 'react';
import { collection, doc, getDoc, setDoc, updateDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { GemAd, GemCategory } from '../types';
import { Gem, Upload, X, ShieldAlert, PlusCircle, CheckCircle } from 'lucide-react';

interface PostAdPageProps {
  navigate: (route: string) => void;
  editAdId?: string;
}

const DISTRICTS = [
  'Ratnapura',
  'Beruwala',
  'Elahera',
  'Colombo',
  'Kandy',
  'Galle',
  'Matara',
  'Jaffna'
];

const TREATMENTS = [
  'Unheated (100% Natural)',
  'Heated Only (Traditional)',
  'Beryllium Treated',
  'Glass Filled',
  'Irradiated'
];

const SHAPES = [
  'Oval',
  'Cushion',
  'Round',
  'Emerald Cut',
  'Pear',
  'Marquise',
  'Princess',
  'Cabochon'
];

export default function PostAdPage({ navigate, editAdId }: PostAdPageProps) {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<GemCategory[]>([]);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');
  const [shape, setShape] = useState('');
  const [treatment, setTreatment] = useState(TREATMENTS[0]);
  const [origin, setOrigin] = useState('');
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [description, setDescription] = useState('');
  const [contactPreference, setContactPreference] = useState<'phone' | 'chat' | 'both'>('both');
  const [location, setLocation] = useState(DISTRICTS[0]);
  
  // Image links or files
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    // Redirect if not signed in
    if (!user) {
      navigate('login');
      return;
    }

    const loadDataAndAd = async () => {
      try {
        // Fetch categories
        const catSnap = await getDocs(collection(db, 'categories'));
        const cats: GemCategory[] = [];
        catSnap.forEach((doc) => cats.push(doc.data() as GemCategory));
        setCategories(cats);
        if (cats.length > 0 && !category) {
          setCategory(cats[0].name);
        }

        // Fetch ad details if in edit mode
        if (editAdId) {
          const adSnap = await getDoc(doc(db, 'ads', editAdId));
          if (adSnap.exists()) {
            const ad = adSnap.data() as GemAd;
            
            // Authorization Guard
            if (ad.sellerId !== user.uid && userProfile?.role !== 'admin') {
              setError('You are not authorized to edit this ad.');
              return;
            }

            setTitle(ad.title);
            setCategory(ad.category);
            setWeight(ad.weight.toString());
            setColor(ad.color);
            setShape(ad.shape);
            setTreatment(ad.treatment);
            setOrigin(ad.origin || '');
            setPrice(ad.price.toString());
            setIsNegotiable(ad.isNegotiable);
            setDescription(ad.description);
            setContactPreference(ad.contactPreference);
            setLocation(ad.location);
            setImageUrls(ad.images);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadDataAndAd();
  }, [editAdId, user, navigate, authLoading, userProfile]);

  // Compress and resize images client-side to prevent Firestore 1MB document limits on fallback base64
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_DIM = 800; // Keep good resolution but lightweight size
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.6 quality (60%)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          resolve(compressedBase64);
        };
        img.onerror = (err) => reject(err);
        img.src = event.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Handle image files selection
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // 1. Generate compressed base64 preview instantly
        const compressedBase64 = await compressImage(file);
        setImageUrls((prev) => [...prev, compressedBase64]);

        // 2. Asynchronously upload to Firebase Storage in the background
        const storagePath = `ad_images/${user?.uid}_${Date.now()}_${file.name}`;
        const imageRef = ref(storage, storagePath);
        
        // Run in background without blocking the loop
        uploadBytesResumable(imageRef, file)
          .then((task) => getDownloadURL(task.ref))
          .then((downloadUrl) => {
            // Replace the base64 URL with the direct Firebase storage URL once uploaded successfully
            setImageUrls((prev) => prev.map((url) => url === compressedBase64 ? downloadUrl : url));
          })
          .catch((err) => {
            console.warn('Background Firebase Storage upload failed/unconfigured. Retaining compressed base64.', err);
          });

      } catch (err) {
        console.error('Error processing image:', err);
        setError('Failed to process one or more images. Please make sure the format is valid.');
      }
    }
    setIsUploading(false);
  };

  const removeImage = (indexToRemove: number) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!title || !category || !weight || !price || !description) {
      setError('Please fill out all required fields marked with *.');
      return;
    }

    if (imageUrls.length === 0) {
      setError('Please provide at least one photo of the gemstone.');
      return;
    }

    setLoading(true);
    setError(null);

    const numericPrice = parseFloat(price);
    const numericWeight = parseFloat(weight);

    const finalAdId = editAdId || `ad_${user.uid}_${Date.now()}`;
    const targetPath = `ads/${finalAdId}`;

    const adData: Partial<GemAd> = {
      id: finalAdId,
      title: title.trim(),
      category: category,
      sellerId: editAdId ? undefined : user.uid, // Keep original seller on edits
      images: imageUrls,
      weight: numericWeight,
      color: color.trim() || 'Multicolor',
      shape: shape || 'Oval',
      treatment: treatment,
      origin: origin.trim() || 'Ratnapura, Sri Lanka',
      price: numericPrice,
      isNegotiable: isNegotiable,
      description: description.trim(),
      contactPreference: contactPreference,
      location: location,
      status: editAdId ? undefined : 'Pending Approval', // Resets to pending approval on new ad creation for moderation queue
      isFeatured: false,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editAdId) {
        // Edit Mode
        const docRef = doc(db, 'ads', editAdId);
        await updateDoc(docRef, adData);
      } else {
        // Create Mode
        adData.createdAt = new Date().toISOString();
        adData.status = 'Pending Approval';
        adData.isFeatured = false;
        await setDoc(doc(db, 'ads', finalAdId), adData as GemAd);
      }
      setSuccess(true);
    } catch (err: any) {
      console.error('Ad write operation rejected:', err);
      setError('Listing submission failed. Please verify that all inputs are sanitized and you are not blocked.');
      handleFirestoreError(err, editAdId ? OperationType.UPDATE : OperationType.CREATE, targetPath);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-sm font-medium animate-pulse">Verifying credentials...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto animate-bounce" />
        <h2 className="text-3xl font-sans font-bold">Ad Submitted Successfully!</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {editAdId
            ? 'Your gemstone listing has been updated successfully.'
            : 'Your gemstone listing is now in our moderation queue. Our administrators will review the specs and photos before pushing it live to the public directory.'}
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <button
            onClick={() => navigate('my-ads')}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            My Ads Dashboard
          </button>
          <button
            onClick={() => navigate('home')}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-sans font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <Gem className="h-8 w-8 text-blue-500" />
          {editAdId ? 'Edit Gemstone Ad' : 'Post a Gemstone Ad'}
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Provide accurate carat weights, treatments, and clear photos to maximize sales.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-50 dark:bg-zinc-900/40 p-6 sm:p-8 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-md">
        
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs p-4 rounded-lg flex gap-2">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Ad Title */}
        <div>
          <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
            Ad Listing Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. 2.4 Carat Unheated Royal Blue Sapphire Oval Cut"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            minLength={5}
            maxLength={100}
            className="w-full text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Categories, Weights, Treatments, Cuts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Gem Category Dropdown */}
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
              Gem Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Carat weight */}
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
              Carat Weight (Cts) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 1.85"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
              Color Tone
            </label>
            <input
              type="text"
              placeholder="e.g. Cornflower Blue"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Cut/Shape */}
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
              Cut Shape
            </label>
            <select
              value={shape}
              onChange={(e) => setShape(e.target.value)}
              className="w-full text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none"
            >
              <option value="">Select Cut</option>
              {SHAPES.map((s, i) => (
                <option key={i} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Treatment */}
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
              Treatment Status
            </label>
            <select
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              className="w-full text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none"
            >
              {TREATMENTS.map((t, i) => (
                <option key={i} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
              Trading Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none"
            >
              {DISTRICTS.map((d, i) => (
                <option key={i} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Origin */}
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
              Geographical Origin
            </label>
            <input
              type="text"
              placeholder="e.g. Ratnapura, Sri Lanka"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Contact Preference */}
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
              Contact Preference
            </label>
            <select
              value={contactPreference}
              onChange={(e) => setContactPreference(e.target.value as any)}
              className="w-full text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none"
            >
              <option value="both">In-app Chat & Phone Call</option>
              <option value="chat">In-app Chat Only</option>
              <option value="phone">Phone Call Only</option>
            </select>
          </div>
        </div>

        {/* Pricing Box */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-5 border border-gray-100 dark:border-zinc-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
                Asking Price (LKR) *
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 350000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full text-sm bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 sm:mt-6">
              <input
                type="checkbox"
                id="isNegotiable"
                checked={isNegotiable}
                onChange={(e) => setIsNegotiable(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="isNegotiable" className="text-xs font-semibold uppercase text-zinc-500 dark:text-gray-400 cursor-pointer">
                Price is Negotiable
              </label>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-gray-400 mb-1.5">
            Detailed Description *
          </label>
          <textarea
            required
            placeholder="Provide a thorough, honest report on clarity, silk, flaws, inclusions, and certification parameters. Buyers rely heavily on descriptions."
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={5000}
            className="w-full text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          ></textarea>
        </div>

        {/* Image upload widget */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-gray-400">
            Gemstone Photos *
          </label>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950">
                <img src={url} alt={`Upload preview ${idx}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full hover:bg-black"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            ))}

            {imageUrls.length < 10 && (
              <label className="relative aspect-video flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-zinc-700 hover:border-blue-500 hover:bg-blue-500/5 rounded-xl cursor-pointer transition-all">
                <Upload className="h-6 w-6 text-gray-400" />
                <span className="text-[10px] text-gray-400 font-semibold mt-1">Upload Photo</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <p className="text-[10px] text-gray-400">
            Select up to 10 high-resolution photos.
          </p>
        </div>

        {/* Submission Button */}
        <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 flex gap-4">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading || isUploading}
            className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-500/10 flex justify-center items-center gap-1"
          >
            <PlusCircle className="h-4.5 w-4.5" />
            {loading ? 'Submitting...' : editAdId ? 'Update Listing' : 'Submit Listing'}
          </button>
        </div>

      </form>
    </div>
  );
}
