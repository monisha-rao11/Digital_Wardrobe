import React from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Plus, AlertCircle, Trash2, Check } from 'lucide-react';

// Export these constants for use in other components
export const MALE_SUBCATEGORIES = {
  'Tops': ['Shirt', 'T-Shirt', 'Hoodie', 'Sweater', 'Sportswear'],
  'Bottoms': ['Jeans', 'Trousers', 'Shorts', 'Track Pants'],
  'Outerwear': ['Jacket', 'Coat', 'Blazer', 'Cardigan'],
  'Footwear': ['Sneakers', 'Formal Shoes', 'Boots', 'Sandals', 'Loafers']
};

export const FEMALE_SUBCATEGORIES = {
  'Tops': ['T-Shirt', 'Shirt', 'Blouse', 'Sweater', 'Hoodie', 'Crop Top'],
  'Bottoms': ['Jeans', 'Trousers', 'Shorts', 'Skirt', 'Leggings'],
  'Outerwear': ['Jacket', 'Coat', 'Blazer', 'Cardigan'],
  'Dresses': ['Casual Dress', 'Formal Dress', 'Maxi Dress', 'Mini Dress'],
  'Footwear': ['Sneakers', 'Flats', 'Heels', 'Boots', 'Sandals', 'Loafers']
};

export const SIZES = {
  'Tops': ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  'Bottoms': ['28', '30', '32', '34', '36', '38', '40'],
  'Dresses': ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  'Outerwear': ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  // 'Activewear': ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  // 'Accessories': ['One Size', 'S', 'M', 'L'],
  'Shoes': ['5','6', '7', '8', '9', '10', '11', '12', '13']
};

export const WASHING_CONDITIONS = {
  'machine_wash': 'Machine Wash',
  'hand_wash': 'Hand Wash Only',
  'dry_clean': 'Dry Clean Only',
  'cold_wash': 'Cold Wash',
  'warm_wash': 'Warm Wash',
  'delicate': 'Delicate/Gentle Cycle'
};

// Define the ClothingItem interface
export interface ClothingItem {
  id?: string;
  imageUrl: string;
  thumbnailUrl: string;
  gender: string; // Added gender field
  category: string;
  subcategory: string;
  size: string;
  brand: string;
  colors: string[];
  washingCondition: string;
  notes?: string;
  dateAdded: string;
  lastWorn?: string;
  timesWorn?: number;
}

// Props interface for the form steps
interface StepProps {
  formData: Partial<ClothingItem>;
  handleInputChange: (field: string, value: any) => void;
  validationErrors: { [key: number]: boolean };
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  originalPreviewUrl: string | null;
  processedPreviewUrl: string | null;
  isUploading: boolean;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentColor: string;
  setCurrentColor: (color: string) => void;
  socketConnected: boolean;
}

export function ImageUpload({
  selectedFile,
  setSelectedFile,
  originalPreviewUrl,
  processedPreviewUrl,
  isUploading,
  handleFileChange,
  validationErrors,
  socketConnected
}: StepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="relative h-72 bg-gray-50 rounded-xl border-2 border-dashed border-blue-300 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-blue-400 hover:bg-blue-50">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        {originalPreviewUrl ? (
          <div className="w-full h-full relative">
            <img
              src={originalPreviewUrl}
              alt="Original Uploaded"
              className="absolute inset-0 w-full h-full object-contain"
            />
            {!isUploading && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                className="absolute top-2 right-2 bg-red-100 rounded-full p-2 hover:bg-red-200 transition-colors"
                onClick={() => {
                  // Reset everything related to the images
                  setSelectedFile(null);
                }}
              >
                <X className="w-4 h-4 text-red-600" />
              </motion.button>
            )}

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <div className="bg-white p-3 rounded-full">
                  <svg
                    className="animate-spin h-6 w-6 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              </div>
            )}
          </div>
        ) : (
          <label
            htmlFor="file-upload"
            className={`cursor-pointer text-center w-full h-full flex flex-col items-center justify-center hover:bg-blue-50 transition-colors p-4 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-blue-100 rounded-full p-4 mb-3"
            >
              <Upload className="h-8 w-8 text-blue-600" />
            </motion.div>
            <span className="mt-2 block text-sm font-medium text-gray-900">
              Upload an image of your garment
            </span>
            <span className="mt-1 block text-xs text-gray-500">
              JPG, PNG or GIF up to 16MB
            </span>
            {!socketConnected && (
              <span className="mt-2 text-xs text-red-500">
                Not connected to server. Please wait...
              </span>
            )}
          </label>
        )}
      </div>

      {processedPreviewUrl && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Background removed preview:</p>
          <div className="h-40 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
            <img
              src={processedPreviewUrl}
              alt="Processed"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      )}

      {validationErrors[0] && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-500 text-sm flex items-center"
        >
          <AlertCircle className="w-4 h-4 mr-1" /> {processedPreviewUrl ? "Please wait for processing to complete." : "Please select an image file."}
        </motion.p>
      )}
    </motion.div>
  );
}

export function GenderSelection({ formData, handleInputChange, validationErrors }: StepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-medium text-gray-900">Select Gender</h3>
        <p className="text-sm text-gray-500 mb-4">
          Choose the gender category for this clothing item.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`border rounded-lg p-6 cursor-pointer transition-colors flex flex-col items-center ${
              formData.gender === 'male'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => {
              handleInputChange('gender', 'male');
              // Reset category and subcategory when gender changes
              handleInputChange('category', '');
              handleInputChange('subcategory', '');
            }}
          >
            <div className="text-3xl mb-2">👨</div>
            <span className="text-sm font-medium text-gray-900">Male</span>
            {formData.gender === 'male' && (
              <Check className="h-5 w-5 text-blue-600 mt-2" />
            )}
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`border rounded-lg p-6 cursor-pointer transition-colors flex flex-col items-center ${
              formData.gender === 'female'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => {
              handleInputChange('gender', 'female');
              // Reset category and subcategory when gender changes
              handleInputChange('category', '');
              handleInputChange('subcategory', '');
            }}
          >
            <div className="text-3xl mb-2">👩</div>
            <span className="text-sm font-medium text-gray-900">Female</span>
            {formData.gender === 'female' && (
              <Check className="h-5 w-5 text-blue-600 mt-2" />
            )}
          </motion.div>
        </div>
      </div>

      {validationErrors[0] && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-500 text-sm flex items-center"
        >
          <AlertCircle className="w-4 h-4 mr-1" /> Please select a gender.
        </motion.p>
      )}
    </motion.div>
  );
}

export function BasicDetails({ formData, handleInputChange, validationErrors }: StepProps) {
  // Get appropriate subcategories based on gender
  const getSubcategories = () => {
    if (!formData.gender) return {};
    return formData.gender === 'male' ? MALE_SUBCATEGORIES : FEMALE_SUBCATEGORIES;
  };
  
  // Function to get appropriate sizes based on category
  const getSizesForSelection = () => {
    if (!formData.category) return [];
    
    // Handle special case for 'Footwear' (which should use the 'Shoes' sizes)
    if (formData.category === 'Footwear') {
      return SIZES['Shoes'] || [];
    }
    
    // Normal case - get sizes for the selected category
    return SIZES[formData.category] || [];
  };

  const subcategories = getSubcategories();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {!formData.gender ? (
        <div className="text-center p-4">
          <p className="text-gray-600">Please select a gender first</p>
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              value={formData.category || ''}
              onChange={(e) => {
                handleInputChange('category', e.target.value);
                // Reset subcategory when category changes
                handleInputChange('subcategory', '');
                // Reset size when category changes
                handleInputChange('size', '');
              }}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="" disabled>
                Select a category
              </option>
              {Object.keys(subcategories).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {formData.category && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-6"
            >
              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategory
                </label>
                <select
                  id="subcategory"
                  value={formData.subcategory || ''}
                  onChange={(e) => handleInputChange('subcategory', e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="" disabled>
                    Select a subcategory
                  </option>
                  {subcategories[formData.category].map((subcat) => (
                    <option key={subcat} value={subcat}>
                      {subcat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
                  Size
                </label>
                <select
                  id="size"
                  value={formData.size || ''}
                  onChange={(e) => handleInputChange('size', e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="" disabled>
                    Select a size
                  </option>
                  {getSizesForSelection().map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  id="brand"
                  value={formData.brand || ''}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  placeholder="Enter the brand name"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </motion.div>
          )}
        </>
      )}

      {validationErrors[1] && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-500 text-sm flex items-center"
        >
          <AlertCircle className="w-4 h-4 mr-1" /> Please fill in all required fields.
        </motion.p>
      )}
    </motion.div>
  );
}

// Color Picker component used by ColorSelection
function ColorPicker({ currentColor, setCurrentColor, onAdd }: { 
  currentColor: string; 
  setCurrentColor: (color: string) => void;
  onAdd: () => void;
}) {
  const predefinedColors = [
    '#000000', // Black
    '#FFFFFF', // White
    '#0000FF', // Blue
    '#FF0000', // Red
    '#008000', // Green
    '#FFC0CB', // Pink
    '#800080', // Purple
    '#FFA500', // Orange
    '#A52A2A', // Brown
    '#FFFF00', // Yellow
    '#808080', // Gray
    '#40E0D0', // Turquoise
  ];

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 items-center">
        <input
          type="color"
          value={currentColor}
          onChange={(e) => setCurrentColor(e.target.value)}
          className="h-10 w-10 rounded cursor-pointer"
        />
        <input
          type="text"
          value={currentColor}
          onChange={(e) => setCurrentColor(e.target.value)}
          placeholder="#000000"
          className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm flex-1"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAdd}
          className="ml-2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
        </motion.button>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Common Colors
        </label>
        <div className="grid grid-cols-6 gap-2">
          {predefinedColors.map((color) => (
            <motion.button
              key={color}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              style={{ backgroundColor: color, border: color === '#FFFFFF' ? '1px solid #e5e7eb' : 'none' }}
              className="h-8 w-8 rounded-full shadow-sm"
              onClick={() => setCurrentColor(color)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ColorSelection({ formData, handleInputChange, currentColor, setCurrentColor, validationErrors }: StepProps) {
  const addColor = () => {
    if (!formData.colors) {
      handleInputChange('colors', [currentColor]);
    } else {
      // Only add if not already in the array
      if (!formData.colors.includes(currentColor)) {
        handleInputChange('colors', [...formData.colors, currentColor]);
      }
    }
  };

  const removeColor = (colorToRemove: string) => {
    if (formData.colors) {
      handleInputChange(
        'colors',
        formData.colors.filter((color) => color !== colorToRemove)
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-medium text-gray-900">Select Colors</h3>
        <p className="text-sm text-gray-500 mb-4">
          Choose the colors present in your garment.
        </p>

        <ColorPicker 
          currentColor={currentColor} 
          setCurrentColor={setCurrentColor} 
          onAdd={addColor} 
        />

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selected Colors
          </label>
          {formData.colors && formData.colors.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.colors.map((color) => (
                <motion.div
                  key={color}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center bg-gray-100 rounded-full pl-1 pr-2 py-1"
                >
                  <div
                    className="w-6 h-6 rounded-full mr-1"
                    style={{ backgroundColor: color, border: color === '#FFFFFF' ? '1px solid #e5e7eb' : 'none' }}
                  ></div>
                  <span className="text-xs text-gray-800">{color}</span>
                  <button
                    onClick={() => removeColor(color)}
                    className="ml-1 text-gray-500 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No colors selected yet</p>
          )}
        </div>
      </div>

      {validationErrors[2] && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-500 text-sm flex items-center"
        >
          <AlertCircle className="w-4 h-4 mr-1" /> Please select at least one color.
        </motion.p>
      )}
    </motion.div>
  );
}

export function AdditionalInfo({ formData, handleInputChange, validationErrors }: StepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-medium text-gray-900">Care Instructions</h3>
        <p className="text-sm text-gray-500 mb-4">
          How should this item be washed and cared for?
        </p>

        <div className="grid grid-cols-1 gap-4 mt-4">
          {Object.entries(WASHING_CONDITIONS).map(([key, label]) => (
            <motion.div
              key={key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                formData.washingCondition === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => handleInputChange('washingCondition', key)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{label}</span>
                {formData.washingCondition === key && (
                  <Check className="h-5 w-5 text-blue-600" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Additional Notes (Optional)
        </label>
        <textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Add any additional details about this item..."
          rows={3}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      {validationErrors[3] && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-500 text-sm flex items-center"
        >
          <AlertCircle className="w-4 h-4 mr-1" /> Please select a washing condition.
        </motion.p>
      )}
    </motion.div>
  );
}