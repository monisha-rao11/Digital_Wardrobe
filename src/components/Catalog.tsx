import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Shirt, X, Filter, Search, Tag, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { collection, getDocs, query, where, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, deleteObject, getMetadata } from 'firebase/storage';
import { db, auth } from '../firebase';
import { useLocation, useNavigate } from 'react-router-dom';
import './Catalog.css';

const CATEGORIES = {
  'Tops': ['T-Shirt', 'Shirt', 'Blouse', 'Tank Top', 'Sweater', 'Hoodie', 'Sportswear'],
  'Bottoms': ['Jeans', 'Trousers', 'Shorts', 'Skirts', 'Leggings', 'Joggers'],
  'Dresses': ['Casual Dress', 'Formal Dress', 'Maxi Dress', 'Mini Dress', 'Evening Gown'],
  'Outerwear': ['Jacket', 'Coat', 'Blazer', 'Cardigan', 'Vest', 'Windbreaker'],
  'Footwear': ['Sneakers', 'Boots', 'Sandals', 'Heels', 'Flats', 'Athletic Shoes'],
  'Accessories': ['Bags', 'Belts', 'Hats', 'Scarves', 'Jewelry', 'Watches']
};

// Enhanced caching with timestamp tracking and batch prefetching
const globalImageCache = new Map();
const failedImageCache = new Map();
const pendingFetches = new Map(); // Prevent duplicate fetches

// Batch image fetching utility
class ImageBatchFetcher {
  constructor(storage, userId, profileId) {
    this.storage = storage;
    this.userId = userId;
    this.profileId = profileId;
    this.batchQueue = [];
    this.processing = false;
  }

  async addToBatch(item) {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({ item, resolve, reject });
      this.processBatch();
    });
  }

  async processBatch() {
    if (this.processing || this.batchQueue.length === 0) return;

    this.processing = true;
    const currentBatch = this.batchQueue.splice(0, 5); // Process 5 at a time

    await Promise.allSettled(
      currentBatch.map(async ({ item, resolve, reject }) => {
        try {
          const url = await this.fetchImageUrl(item);
          resolve(url);
        } catch (error) {
          reject(error);
        }
      })
    );

    this.processing = false;

    // Process remaining items
    if (this.batchQueue.length > 0) {
      setTimeout(() => this.processBatch(), 100);
    }
  }

  async fetchImageUrl(item) {
    const cacheKey = item.id;

    // Return cached URL
    if (globalImageCache.has(cacheKey)) {
      return globalImageCache.get(cacheKey);
    }

    // Check if already being fetched
    if (pendingFetches.has(cacheKey)) {
      return pendingFetches.get(cacheKey);
    }

    // Check if failed recently
    const failedTime = failedImageCache.get(cacheKey);
    if (failedTime && Date.now() - failedTime < 300000) {
      throw new Error('Recently failed');
    }

    const fetchPromise = this.performFetch(item);
    pendingFetches.set(cacheKey, fetchPromise);

    try {
      const result = await fetchPromise;
      pendingFetches.delete(cacheKey);
      return result;
    } catch (error) {
      pendingFetches.delete(cacheKey);
      throw error;
    }
  }

  async performFetch(item) {
    const cacheKey = item.id;

    try {
      let imageUrl = null;
      let metadata = null;

      // Strategy 1: Direct storage path (most reliable)
      if (item.storage_path) {
        try {
          const storageRef = ref(this.storage, item.storage_path);
          imageUrl = await getDownloadURL(storageRef);

          // Try to get metadata for additional information
          try {
            metadata = await getMetadata(storageRef);
          } catch (metadataError) {
            console.warn(`Metadata fetch failed for ${item.id}:`, metadataError.message);
          }
        } catch (storageError) {
          console.warn(`Storage path failed for ${item.id}:`, storageError.message);
        }
      }

      // Strategy 2: Construct paths based on common patterns
      if (!imageUrl && item.image_id && this.userId && this.profileId) {
        const possiblePaths = [
          `wardrobe/${this.userId}/${this.profileId}/${item.category}/${item.sub_category}/${item.image_id}`,
          `wardrobe/${this.userId}/${this.profileId}/images/${item.image_id}`,
          `wardrobe/${this.userId}/images/${item.image_id}`,
          `images/${this.userId}/${this.profileId}/${item.image_id}`,
          `clothing_items/${this.userId}/${this.profileId}/${item.image_id}`,
          `users/${this.userId}/wardrobe/${this.profileId}/${item.image_id}`
        ];

        for (const path of possiblePaths) {
          try {
            const storageRef = ref(this.storage, path);
            imageUrl = await getDownloadURL(storageRef);

            // Try to get metadata
            try {
              metadata = await getMetadata(storageRef);
            } catch (metadataError) {
              console.warn(`Metadata fetch failed for path ${path}:`, metadataError.message);
            }

            // Update item's storage path for future use
            try {
              const updateData = {
                storage_path: path,
                image_url: imageUrl
              };

              // Add metadata if available
              if (metadata) {
                updateData.file_metadata = {
                  name: metadata.name,
                  size: metadata.size,
                  contentType: metadata.contentType,
                  timeCreated: metadata.timeCreated,
                  updated: metadata.updated,
                  customMetadata: metadata.customMetadata || {}
                };
              }

              await updateDoc(doc(db, 'clothing_items', item.id), updateData);
            } catch (updateError) {
              console.warn(`Failed to update storage path for ${item.id}`);
            }

            break;
          } catch (pathError) {
            continue;
          }
        }
      }

      if (imageUrl) {
        globalImageCache.set(cacheKey, imageUrl);
        return imageUrl;
      } else {
        failedImageCache.set(cacheKey, Date.now());
        throw new Error('No valid image URL found');
      }

    } catch (error) {
      failedImageCache.set(cacheKey, Date.now());
      throw error;
    }
  }
}

const ItemCard = ({ item, onClick, imageBatchFetcher }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasTriedRefresh = useRef(false);

  useEffect(() => {
    const loadImageUrl = async () => {
      setIsLoading(true);
      setImageError(false);

      // Check cache first
      const cachedUrl = globalImageCache.get(item.id);
      if (cachedUrl) {
        setImageUrl(cachedUrl);
        setIsLoading(false);
        return;
      }

      // Check if failed recently
      const failedTime = failedImageCache.get(item.id);
      if (failedTime && Date.now() - failedTime < 300000) {
        setImageError(true);
        setIsLoading(false);
        return;
      }

      try {
        const url = await imageBatchFetcher.addToBatch(item);
        if (url) {
          setImageUrl(url);
        } else {
          setImageError(true);
        }
      } catch (error) {
        setImageError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadImageUrl();
  }, [item.id, imageBatchFetcher]);

  const handleImageError = async () => {
    if (!hasTriedRefresh.current) {
      hasTriedRefresh.current = true;
      try {
        // Clear cache and retry
        globalImageCache.delete(item.id);
        const freshUrl = await imageBatchFetcher.addToBatch(item);
        if (freshUrl && freshUrl !== imageUrl) {
          setImageUrl(freshUrl);
          return;
        }
      } catch (refreshError) {
        console.error(`Failed to refresh URL for ${item.id}:`, refreshError);
      }
    }

    setImageError(true);
  };

  const handleImageLoad = () => {
    failedImageCache.delete(item.id);
    setIsLoading(false);
  };

  return (
    <div className="itemCard" onClick={() => onClick(item)}>
      {imageUrl && !imageError ? (
        <div className="itemCardWithImage">
          <img
            src={imageUrl}
            alt={`${item.category || 'Category'} - ${item.sub_category || 'Item'}`}
            className="itemCardImage"
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              opacity: isLoading ? '0.7' : '1',
              transition: 'opacity 0.3s ease'
            }}
          />

          {isLoading && (
            <div className="imageLoadingIndicator">
              <div className="loadingSpinner small"></div>
            </div>
          )}

          <div className="itemCardOverlay">
            <p className="itemCardTitle">{item.sub_category || 'Item'}</p>
            <p className="itemCardSubtitle">{item.brand || 'No brand'}</p>
            <div className="itemCardColors">
              {Array.isArray(item.colors) && item.colors.slice(0, 3).map((color, index) => (
                <div
                  key={index}
                  className="colorDot"
                  style={{ backgroundColor: color.toLowerCase() }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="itemCardNoImage">
          <Shirt className="w-16 h-16 text-gray-400 mb-2" />
          <p className="itemCardText">{item.sub_category || 'Item'}</p>
          <p className="itemCardBrand">{item.brand || 'No brand'}</p>
          {imageError && (
            <p className="imageErrorText">Image not available</p>
          )}
          {isLoading && !imageError && (
            <div className="loadingSpinner small"></div>
          )}
        </div>
      )}
    </div>
  );
};

// Separate component for item details modal
const ItemDetailsModal = ({ item, onClose, onEdit, onDelete, imageBatchFetcher }) => {
  const [detailImageUrl, setDetailImageUrl] = useState(null);
  const [detailImageError, setDetailImageError] = useState(false);
  const [itemMetadata, setItemMetadata] = useState(null);

  useEffect(() => {
    const loadDetailImage = async () => {
      try {
        const url = await imageBatchFetcher.addToBatch(item);
        setDetailImageUrl(url);
        setDetailImageError(!url);

        // Load metadata if available
        if (item.file_metadata) {
          setItemMetadata(item.file_metadata);
        }
      } catch (error) {
        setDetailImageError(true);
      }
    };
    loadDetailImage();
  }, [item.id, imageBatchFetcher]);

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h3 className="modalTitle">{item.sub_category || 'Item'}</h3>
          <button onClick={onClose} className="closeButton">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="itemDetails">
          <div className="imageContainer">
            {detailImageUrl && !detailImageError ? (
              <img
                src={detailImageUrl}
                alt={`${item.brand || 'Brand'} ${item.sub_category || 'Item'}`}
                className="itemImage"
                onError={() => setDetailImageError(true)}
              />
            ) : (
              <div className="placeholderImage">
                <Shirt className="w-16 h-16 text-gray-400" />
              </div>
            )}
            <div className="colorSwatches">
              {Array.isArray(item.colors) && item.colors.map((color, index) => (
                <div
                  key={index}
                  className="colorSwatch"
                  style={{ backgroundColor: color.toLowerCase() }}
                  title={color}
                >
                  {['white', 'yellow', 'beige'].includes(color.toLowerCase()) && (
                    <div className="lightColorBorder"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="itemInfo">
            <div className="infoSection">
              <h4 className="infoLabel">Brand</h4>
              <p className="infoValue">{item.brand || 'Not specified'}</p>
            </div>
            <div className="infoSection">
              <h4 className="infoLabel">Category</h4>
              <p className="infoValue">
                {item.category || 'Not specified'} • {item.sub_category || 'Not specified'}
              </p>
            </div>
            <div className="infoSection">
              <h4 className="infoLabel">Size</h4>
              <p className="infoValue">{item.size || 'Not specified'}</p>
            </div>
            <div className="infoSection">
              <h4 className="infoLabel">Care Instructions</h4>
              <p className="infoValue">{item.washing_conditions || 'Not specified'}</p>
            </div>

            {/* Display file metadata if available */}
            {itemMetadata && (
              <>
                <div className="infoSection">
                  <h4 className="infoLabel">File Information</h4>
                  <p className="infoValue">
                    Size: {formatFileSize(itemMetadata.size)}
                    {itemMetadata.contentType && (
                      <><br />Type: {itemMetadata.contentType}</>
                    )}
                  </p>
                </div>
                <div className="infoSection">
                  <h4 className="infoLabel">Upload Date</h4>
                  <p className="infoValue">{formatDate(itemMetadata.timeCreated)}</p>
                </div>
                {itemMetadata.customMetadata && Object.keys(itemMetadata.customMetadata).length > 0 && (
                  <div className="infoSection">
                    <h4 className="infoLabel">Additional Information</h4>
                    <div className="infoValue">
                      {Object.entries(itemMetadata.customMetadata).map(([key, value]) => (
                        <p key={key}>{key}: {value}</p>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="modalActions">
          <button
            className="secondaryButton"
            onClick={() => onEdit(item)}
          >
            Edit
          </button>
          <button
            className="dangerButton"
            onClick={() => {
              onClose();
              onDelete(item);
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Catalog() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState({ status: 'idle', message: '' });
  const [expandedCategories, setExpandedCategories] = useState({});
  const [imageBatchFetcher, setImageBatchFetcher] = useState(null);

  const storage = getStorage();
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize batch fetcher when user and profile are available
  useEffect(() => {
    if (userId && profileId) {
      const fetcher = new ImageBatchFetcher(storage, userId, profileId);
      setImageBatchFetcher(fetcher);
    }
  }, [userId, profileId, storage]);

  // Get user and profile data
  useEffect(() => {
    const fetchUserAndProfileData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("You must be logged in to view wardrobe items.");
        setLoading(false);
        navigate('/login');
        return;
      }

      let userID = currentUser.uid;
      let profileID = null;

      if (location.state?.currentProfileId) {
        profileID = location.state.currentProfileId;
      } else if (location.search) {
        const params = new URLSearchParams(location.search);
        const urlProfileId = params.get('profileId');
        if (urlProfileId) {
          profileID = urlProfileId;
        }
      }

      if (!profileID) {
        profileID = localStorage.getItem("currentProfileID");
      }

      if (!profileID) {
        setError("No profile selected. Please select a profile first.");
        setLoading(false);
        navigate('/profiles');
        return;
      }

      setUserId(userID);
      setProfileId(profileID);
    };

    fetchUserAndProfileData();
  }, [location, navigate]);

  // Fetch items from Firestore
  const fetchItems = useCallback(async () => {
    if (!userId || !profileId) return;

    setLoading(true);
    setError(null);

    try {
      const clothesQuery = query(
        collection(db, 'clothing_items'),
        where('user_id', '==', userId),
        where('profile_id', '==', profileId)
      );

      const querySnapshot = await getDocs(clothesQuery);
      const clothingData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`Fetched ${clothingData.length} items from Firestore`);

      // Apply category filter
      const filteredData = activeFilters.length > 0
        ? clothingData.filter(item => activeFilters.includes(item.category))
        : clothingData;

      setItems(filteredData);
      setLoading(false);

    } catch (err) {
      console.error('Error fetching items:', err);
      setError("Failed to load your wardrobe. Please try again.");
      setLoading(false);
    }
  }, [userId, profileId, activeFilters]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Memoized grouped items
  const groupedItems = useMemo(() => {
    const grouped = {};
    items.forEach(item => {
      const category = item.category || 'Uncategorized';
      const subCategory = item.sub_category || 'Other';

      if (!grouped[category]) {
        grouped[category] = {};
      }
      if (!grouped[category][subCategory]) {
        grouped[category][subCategory] = [];
      }
      grouped[category][subCategory].push(item);
    });
    return grouped;
  }, [items]);

  // Filtered items for search
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      (item.sub_category || '').toLowerCase().includes(query) ||
      (item.brand || '').toLowerCase().includes(query) ||
      (item.category || '').toLowerCase().includes(query) ||
      (item.colors || []).some(color => color.toLowerCase().includes(query))
    );
  }, [items, searchQuery]);

  const handleEditItem = (item) => {
    const formData = {
      brand: item.brand || '',
      size: item.size || '',
      category: item.category || '',
      subcategory: item.sub_category || '',
      washingCondition: item.washing_conditions || '',
      colors: item.colors || []
    };

    navigate('/uploadform', {
      state: {
        isEditing: true,
        itemId: item.id,
        currentProfileId: profileId,
        formData: formData,
        imageId: item.image_id,
        processedImage: item.processed_image,
        originalImage: item.original_image,
        processedPreviewUrl: item.image_url,
        storagePath: item.storage_path
      }
    });

    setSelectedItem(null);
  };

  const handleDeleteConfirmation = (item) => {
    setDeleteConfirmation(item);
  };

  const executeDeleteItem = async () => {
    if (!deleteConfirmation) return;

    const item = deleteConfirmation;
    setDeleteStatus({ status: 'deleting', message: 'Deleting item...' });

    try {
      console.log('Starting deletion process for item:', item.id);
      console.log('Item data:', item);

      // Step 1: Delete from Firebase Storage first
      let storageDeleteSuccess = false;
      const storage = getStorage();

      // Method 1: Try using the exact storage_path if it exists
      if (item.storage_path) {
        try {
          console.log('Attempting to delete using storage_path:', item.storage_path);
          const storageRef = ref(storage, item.storage_path);
          await deleteObject(storageRef);
          storageDeleteSuccess = true;
          console.log('Successfully deleted using storage_path');
        } catch (error) {
          console.warn('Failed to delete using storage_path:', error.code, error.message);

          // Only consider "not found" as success, other errors should be handled
          if (error.code === 'storage/object-not-found') {
            console.log('Object not found in storage - may have been already deleted');
            storageDeleteSuccess = true;
          }
        }
      }

      // Method 2: Extract path from image_url (this is the most reliable method for your case)
      if (!storageDeleteSuccess && item.image_url) {
        try {
          console.log('Attempting to extract path from image_url:', item.image_url);

          // Parse Firebase Storage URL to extract the actual storage path
          const url = new URL(item.image_url);

          if (url.hostname.includes('firebasestorage') || url.hostname.includes('googleapis.com')) {
            // Extract the path from Firebase Storage URL
            // Format: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile?alt=media&token=...
            const pathMatch = url.pathname.match(/\/o\/(.+?)(\?|$)/);

            if (pathMatch) {
              let extractedPath = decodeURIComponent(pathMatch[1]);

              // Remove any query parameters that might be part of the path
              extractedPath = extractedPath.split('?')[0];

              console.log('Extracted storage path from URL:', extractedPath);

              const storageRef = ref(storage, extractedPath);
              await deleteObject(storageRef);

              console.log('Successfully deleted using URL-extracted path');
              storageDeleteSuccess = true;

              // Update the item's storage_path for future reference
              try {
                await updateDoc(doc(db, 'clothing_items', item.id), {
                  storage_path: extractedPath
                });
                console.log('Updated storage_path in Firestore');
              } catch (updateError) {
                console.warn('Could not update storage_path in document:', updateError);
              }
            }
          }
        } catch (error) {
          console.warn('Failed to delete using URL-extracted path:', error.code, error.message);

          if (error.code === 'storage/object-not-found') {
            storageDeleteSuccess = true;
          }
        }
      }

      // Method 3: Try constructing the path using available item data (fallback)
      if (!storageDeleteSuccess && item.image_id) {
        const possibleStoragePaths = [];

        if (userId && profileId) {
          // Based on your Firebase Storage structure, construct possible paths
          if (item.category && item.sub_category) {
            possibleStoragePaths.push(`wardrobe/${userId}/${profileId}/${item.category}/${item.sub_category}/${item.image_id}`);
          }

          // Add more specific paths based on your storage structure
          possibleStoragePaths.push(`wardrobe/${userId}/${profileId}/images/${item.image_id}`);
          possibleStoragePaths.push(`wardrobe/${userId}/${profileId}/${item.image_id}`);
          possibleStoragePaths.push(`users/${userId}/wardrobe/${profileId}/${item.image_id}`);
          possibleStoragePaths.push(`clothing_items/${userId}/${profileId}/${item.image_id}`);

          // From your screenshot, it looks like files might be stored directly with their full names
          possibleStoragePaths.push(`${item.image_id}`);

          // Try with common file extensions if image_id doesn't have one
          if (!item.image_id.includes('.')) {
            const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
            extensions.forEach(ext => {
              if (item.category && item.sub_category) {
                possibleStoragePaths.push(`wardrobe/${userId}/${profileId}/${item.category}/${item.sub_category}/${item.image_id}${ext}`);
              }
              possibleStoragePaths.push(`wardrobe/${userId}/${profileId}/images/${item.image_id}${ext}`);
              possibleStoragePaths.push(`wardrobe/${userId}/${profileId}/${item.image_id}${ext}`);
              possibleStoragePaths.push(`${item.image_id}${ext}`);
            });
          }
        }

        console.log('Trying possible storage paths:', possibleStoragePaths);

        for (const path of possibleStoragePaths) {
          if (storageDeleteSuccess) break;

          try {
            console.log('Attempting to delete from path:', path);
            const storageRef = ref(storage, path);
            await deleteObject(storageRef);

            console.log('Successfully deleted from path:', path);
            storageDeleteSuccess = true;

            // Update the item's storage_path for future reference
            try {
              await updateDoc(doc(db, 'clothing_items', item.id), {
                storage_path: path
              });
              console.log('Updated storage_path in Firestore for future use');
            } catch (updateError) {
              console.warn('Could not update storage_path in document:', updateError);
            }

            break;
          } catch (error) {
            console.warn(`Failed to delete from path ${path}:`, error.code, error.message);

            // If object not found, continue to next path
            if (error.code === 'storage/object-not-found') {
              continue;
            }
          }
        }
      }

      // Method 4: Direct file name deletion (based on your screenshot structure)
      if (!storageDeleteSuccess && item.image_id) {
        try {
          // From your screenshot, it looks like the file might be stored directly by its name
          // Try deleting using just the image_id as the path
          console.log('Attempting direct file deletion with image_id:', item.image_id);
          const directRef = ref(storage, item.image_id);
          await deleteObject(directRef);

          storageDeleteSuccess = true;
          console.log('Successfully deleted using direct image_id path');

          // Update storage_path
          try {
            await updateDoc(doc(db, 'clothing_items', item.id), {
              storage_path: item.image_id
            });
          } catch (updateError) {
            console.warn('Could not update storage_path:', updateError);
          }
        } catch (error) {
          console.warn('Direct deletion failed:', error.code, error.message);
          if (error.code === 'storage/object-not-found') {
            storageDeleteSuccess = true;
          }
        }
      }

      // Log final storage deletion result
      if (storageDeleteSuccess) {
        console.log('✅ Storage deletion completed successfully');
      } else {
        console.warn('⚠️ Storage deletion failed - file may not exist or path is incorrect');
        console.warn('Available item data for debugging:', {
          image_id: item.image_id,
          storage_path: item.storage_path,
          image_url: item.image_url,
          category: item.category,
          sub_category: item.sub_category
        });
      }

      // Step 2: Delete from Firestore (this is the critical part)
      console.log('Attempting to delete from Firestore, document ID:', item.id);

      try {
        const docRef = doc(db, 'clothing_items', item.id);
        await deleteDoc(docRef);
        console.log('✅ Successfully deleted from Firestore');
      } catch (firestoreError) {
        console.error('❌ Critical error - Firestore deletion failed:', firestoreError);
        throw new Error(`Failed to delete item from database: ${firestoreError.message}`);
      }

      // Step 3: Update local state and clear caches
      console.log('Updating local state and clearing caches');

      // Remove from local items array
      setItems(prevItems => prevItems.filter(i => i.id !== item.id));

      // Clear all caches for this item
      globalImageCache.delete(item.id);
      failedImageCache.delete(item.id);
      if (pendingFetches && pendingFetches.has(item.id)) {
        pendingFetches.delete(item.id);
      }

      // Step 4: Set success status
      const statusMessage = storageDeleteSuccess
        ? '✅ Item and image deleted successfully!'
        : '⚠️ Item deleted from database. Image file may need manual removal from storage.';

      setDeleteStatus({
        status: 'success',
        message: statusMessage
      });

      console.log('🎉 Deletion process completed successfully');

      // Step 5: Auto-close after success
      setTimeout(() => {
        setSelectedItem(null);
        setDeleteConfirmation(null);
        setDeleteStatus({ status: 'idle', message: '' });
      }, 2000);

    } catch (error) {
      console.error('❌ Delete operation failed:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });

      setDeleteStatus({
        status: 'error',
        message: `Failed to delete item: ${error.message || 'Unknown error occurred'}`
      });

      // Clear error after 5 seconds
      setTimeout(() => {
        if (deleteStatus.status === 'error') {
          setDeleteStatus({ status: 'idle', message: '' });
        }
      }, 5000);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const toggleFilter = (filter) => {
    setActiveFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const renderSubcategorySection = (categoryName, subcategoryName, subcategoryItems) => (
    <div key={`${categoryName}-${subcategoryName}`} className="subcategorySection">
      <div className="subcategoryHeader">
        <h4 className="subcategoryTitle">{subcategoryName}</h4>
        <span className="subcategoryCount">{subcategoryItems.length}</span>
      </div>
      <div className="itemsGrid">
        {subcategoryItems.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            onClick={setSelectedItem}
            imageBatchFetcher={imageBatchFetcher}
          />
        ))}
      </div>
    </div>
  );

  const renderCategoryWithDropdown = (categoryName) => {
    const categoryData = groupedItems[categoryName];
    if (!categoryData) return null;

    const isExpanded = expandedCategories[categoryName];
    const totalItems = Object.values(categoryData).reduce((sum, items) => sum + items.length, 0);

    return (
      <div key={categoryName} className="categoryCard">
        <div
          className="categoryHeader clickable"
          onClick={() => toggleCategory(categoryName)}
        >
          <div className="categoryTitle">
            <Tag className="w-5 h-5 text-white mr-2" />
            <h3>{categoryName}</h3>
            <span className="categoryCount">{totalItems}</span>
          </div>
          <div className="categoryToggle">
            {isExpanded ?
              <ChevronUp className="w-5 h-5 text-white" /> :
              <ChevronDown className="w-5 h-5 text-white" />
            }
          </div>
        </div>

        {isExpanded && (
          <div className="categoryContent expanded">
            {Object.entries(categoryData)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([subcategoryName, subcategoryItems]) =>
                renderSubcategorySection(categoryName, subcategoryName, subcategoryItems)
              )}
          </div>
        )}
      </div>
    );
  };

  const renderDeleteConfirmation = () => {
    if (!deleteConfirmation) return null;

    return (
      <div className="modalOverlay" onClick={cancelDelete}>
        <div className="modalContent deleteConfirmation" onClick={(e) => e.stopPropagation()}>
          <div className="modalHeader">
            <h3 className="modalTitle">Confirm Deletion</h3>
            <button onClick={cancelDelete} className="closeButton">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="deleteConfirmationContent">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="confirmText">
              Are you sure you want to delete this {deleteConfirmation.sub_category || 'item'}?
            </p>
            <p className="warningText">This action cannot be undone.</p>
          </div>

          <div className="modalActions">
            <button
              onClick={cancelDelete}
              className="secondaryButton"
              disabled={deleteStatus.status === 'deleting'}
            >
              Cancel
            </button>
            <button
              onClick={executeDeleteItem}
              className="dangerButton"
              disabled={deleteStatus.status === 'deleting'}
            >
              {deleteStatus.status === 'deleting' ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                'Delete Item'
              )}
            </button>
          </div>

          {deleteStatus.status === 'error' && (
            <div className="errorMessage">{deleteStatus.message}</div>
          )}
        </div>
      </div>
    );
  };

  const renderProfileInfo = () => {
    if (!profileId) return null;
    const profileName = location.state?.name || localStorage.getItem("currentUserName") || "Profile";
    return (
      <div className="profileInfoBanner">
        <p>Viewing wardrobe for: <strong>{profileName}</strong></p>
      </div>
    );
  };

  const renderDeleteStatus = () => {
    if (deleteStatus.status !== 'success') return null;
    return (
      <div className="deleteSuccessMessage">
        <div className="successIcon">✓</div>
        <p>{deleteStatus.message}</p>
      </div>
    );
  };

  // Don't render anything if imageBatchFetcher is not initialized
  if (!imageBatchFetcher) {
    return (
      <div className="loadingContainer">
        <div className="loadingSpinner"></div>
        <p>Initializing...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="wrapper">
        <div className="header">
          <div className="header-flex">
            <div className="wardrobe-title">
              <h2 className="title">
                <span role="img" aria-label="wardrobe" className="mr-2">👔</span>
                My Wardrobe
              </h2>
            </div>
            <div className="profile-container">
              {renderProfileInfo()}
            </div>
          </div>

          <div className="searchFilterContainer">
            <div className="searchContainer">
              <Search className="searchIcon" />
              <input
                type="text"
                placeholder="Search items, brands, colors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="searchInput"
              />
            </div>

            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="filterButton"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              {activeFilters.length > 0 && (
                <span className="filterBadge">{activeFilters.length}</span>
              )}
            </button>
          </div>

          {filterOpen && (
            <div className="filterPanel">
              <h3 className="filterTitle">Categories</h3>
              <div className="filterOptions">
                {Object.keys(CATEGORIES).map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleFilter(category)}
                    className={`filterOption ${activeFilters.includes(category) ? 'activeFilter' : ''}`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {activeFilters.length > 0 && (
                <div className="clearFilters">
                  <button
                    onClick={() => setActiveFilters([])}
                    className="clearFiltersButton"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {renderDeleteStatus()}

        {loading ? (
          <div className="loadingContainer">
            <div className="loadingSpinner"></div>
            <p>Loading your wardrobe...</p>
          </div>
        ) : error ? (
          <div className="errorContainer">
            <p>{error}</p>
            <button onClick={fetchItems} className="retryButton">
              Try Again
            </button>
          </div>
        ) : (
          <>
            {searchQuery && (
              <div className="searchResultsContainer">
                <div className="searchResultsTitle">
                  <Search className="w-5 h-5 text-white mr-2" />
                  <h3>Search Results</h3>
                  {filteredItems.length > 0 && (
                    <span className="categoryCount">{filteredItems.length}</span>
                  )}
                </div>

                {filteredItems.length > 0 ? (
                  <div className="categoryContent">
                    <div className="itemsGrid">
                      {filteredItems.map(item => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          onClick={setSelectedItem}
                          imageBatchFetcher={imageBatchFetcher}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="emptyCategory">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="emptyCategoryTitle">No matching items</h4>
                    <p className="emptyCategoryText">
                      Try adjusting your search or filters.
                    </p>
                  </div>
                )}
              </div>
            )}

            {!searchQuery && (
              <div className="categoriesContainer">
                {Object.keys(CATEGORIES)
                  .filter(categoryName =>
                    activeFilters.length === 0 || activeFilters.includes(categoryName)
                  )
                  .filter(categoryName => groupedItems[categoryName])
                  .map(renderCategoryWithDropdown)}
              </div>
            )}
          </>
        )}
      </div>

      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onEdit={handleEditItem}
          onDelete={handleDeleteConfirmation}
          imageBatchFetcher={imageBatchFetcher}
        />
      )}
      {deleteConfirmation && renderDeleteConfirmation()}
    </div>
  );
}