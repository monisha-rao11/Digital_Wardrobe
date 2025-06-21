// export interface ClothingItem {
//   id?: string;
//   category: string;
//   subCategory: string;
//   gender: 'Male' | 'Female';
//   colors: string[];
//   size: string;
//   brand: string;
//   washingCondition: string;
//   imageUrl?: string;
//   uploadTimestamp?: string;
// }

// export interface Category {
//   name: string;
//   subCategories: string[];
//   icon: string;
//   sizes: string[];
// }

// export const WASHING_CONDITIONS = [
//   'Machine wash cold',
//   'Machine wash warm',
//   'Machine wash hot',
//   'Hand wash only',
//   'Dry clean only',
//   'Gentle cycle',
//   'Do not tumble dry',
//   'Line dry',
//   'Iron low temperature',
//   'Do not iron'
// ];

// export const CATEGORIES: Record<'Male' | 'Female', Category[]> = {
//   Male: [
//     { 
//       name: 'Tops', 
//       subCategories: ['T-Shirts', 'Shirts', 'Sweaters', 'Hoodies'], 
//       icon: '👕',
//       sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
//     },
//     { 
//       name: 'Bottoms', 
//       subCategories: ['Jeans', 'Trousers', 'Shorts'], 
//       icon: '👖',
//       sizes: ['28', '30', '32', '34', '36', '38', '40', '42', '44']
//     },
//     { 
//       name: 'Shoes', 
//       subCategories: ['Sneakers', 'Formal', 'Boots'], 
//       icon: '👞',
//       sizes: ['6', '7', '8', '9', '10', '11', '12', '13']
//     },
//     { 
//       name: 'Formal', 
//       subCategories: ['Suits', 'Blazers'], 
//       icon: '🕴️',
//       sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
//     },
//   ],
//   Female: [
//     { 
//       name: 'Tops', 
//       subCategories: ['T-Shirts', 'Blouses', 'Sweaters'], 
//       icon: '👚',
//       sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
//     },
//     { 
//       name: 'Bottoms', 
//       subCategories: ['Jeans', 'Skirts', 'Trousers'], 
//       icon: '👗',
//       sizes: ['24', '26', '28', '30', '32', '34', '36', '38']
//     },
//     { 
//       name: 'Dresses', 
//       subCategories: ['Casual', 'Formal', 'Evening'], 
//       icon: '👗',
//       sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
//     },
//     { 
//       name: 'Shoes', 
//       subCategories: ['Flats', 'Heels', 'Boots'], 
//       icon: '👠',
//       sizes: ['5', '6', '7', '8', '9', '10', '11']
//     },
//   ],
// };

export interface ClothingItem {
  id?: string;
  category: string;
  subCategory: string;
  gender: 'Male' | 'Female';
  colors: string[];
  size: string;
  brand: string;
  washingCondition: string;
  imageUrl?: string;
  uploadTimestamp?: string;
}

export interface Category {
  name: string;
  subCategories: string[];
  icon: string;
  sizes: string[];
}

export const WASHING_CONDITIONS = [
  'Machine wash cold',
  'Machine wash warm',
  'Machine wash hot',
  'Hand wash only',
  'Dry clean only',
  'Gentle cycle',
  'Do not tumble dry',
  'Line dry',
  'Iron low temperature',
  'Do not iron'
];

export const CATEGORIES: Record<'Male' | 'Female', Category[]> = {
  Male: [
      {
          name: 'Tops',
          subCategories: [
              'T-Shirts',
              'Shirts',
              'Polos',  // Added
              'Sweaters',
              'Hoodies',
              'Tank Tops', // Added
              'Vests'      //Added
          ],
          icon: '👕',
          sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
      },
      {
          name: 'Bottoms',
          subCategories: [
              'Jeans',
              'Trousers',
              'Shorts',
              'Sweatpants', // Added
              'Joggers'    //Added
          ],
          icon: '👖',
          sizes: ['28', '30', '32', '34', '36', '38', '40', '42', '44']
      },
      {
          name: 'Suits & Blazers', // Changed from 'Formal'
          subCategories: [
              'Suits',
              'Blazers',
              'Suit Separates' //Added
          ],
          icon: '🕴️',
          sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
      },
      {
          name: 'Shoes',
          subCategories: [
              'Sneakers',
              'Formal Shoes', // Changed from 'Formal'
              'Boots',
              'Sandals',  //Added
              'Loafers'    //Added
          ],
          icon: '👞',
          sizes: ['6', '7', '8', '9', '10', '11', '12', '13']
      },
      {
        name: 'Outerwear',
        subCategories: ['Jackets', 'Coats', 'Vests'],
        icon: '🧥',
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
      },
      {
          name: 'Traditional Wear',
          subCategories: ['Kurtas', 'Sherwanis', 'Dhotis'],
          icon: '👳',
          sizes: ['S', 'M', 'L', 'XL', 'XXL']
      }
  ],
  Female: [
      {
          name: 'Tops',
          subCategories: [
              'T-Shirts',
              'Blouses',
              'Knit Tops', // Added
              'Sweaters',
              'Tank Tops', // Added
              'Camisoles',  //Added
              'Crop Tops',  //Added
              'Tunics'    //Added
          ],
          icon: '👚',
          sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
      },
      {
          name: 'Bottoms',
          subCategories: [
              'Jeans',
              'Skirts',
              'Trousers',
              'Leggings', // Added
              'Shorts',    //Added
              'Jeggings',
              'Palazzo Pants'
          ],
          icon: '👗',
          sizes: ['24', '26', '28', '30', '32', '34', '36', '38']
      },
      {
          name: 'Dresses & Jumpsuits', // Combined
          subCategories: [
              'Casual Dresses', // More specific
              'Formal Dresses',
              'Evening Dresses',
              'Day Dresses',  // Added
              'Jumpsuits',
              'Rompers'
          ],
          icon: '👗',
          sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
      },
      {
          name: 'Shoes',
          subCategories: [
              'Flats',
              'Heels',
              'Boots',
              'Sandals', // Added
              'Sneakers', //Added
              'Pumps'
          ],
          icon: '👠',
          sizes: ['5', '6', '7', '8', '9', '10', '11']
      },
      {
        name: 'Outerwear',
        subCategories: ['Jackets', 'Coats', 'Wraps'],
        icon: '🧥',
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
      },
      {
          name: 'Traditional Wear',
          subCategories: [
              'Kurtis',
              'Salwar Kameez',
              'Sarees',
              'Lehengas',
              'Cholis'
          ],
          icon: '💃',
          sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
      }
  ],
};
