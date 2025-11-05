import { Injectable } from '@angular/core';
import {ProductCategory} from '../Models/ProductCategory';

@Injectable({
  providedIn: 'root',
})
export class ProductDatabaseService {
  private productDatabase: ProductCategory[] = [
    // Electronics & Technology
    {
      name: 'Smartphones',
      keywords: ['phone', 'smartphone', 'mobile', 'cell', 'téléphone'],
      brands: [
        'iPhone', 'Apple', 'Samsung', 'Galaxy', 'Xiaomi', 'Redmi', 'Mi',
        'Huawei', 'Honor', 'Nokia', 'OnePlus', 'Oppo', 'Vivo', 'Realme',
        'Google Pixel', 'Sony Xperia', 'LG', 'Motorola', 'Asus', 'ZTE'
      ]
    },
    {
      name: 'Computers & Laptops',
      keywords: ['laptop', 'computer', 'pc', 'desktop', 'notebook', 'macbook', 'ordinateur'],
      brands: [
        'Apple', 'MacBook', 'iMac', 'Mac Pro', 'Dell', 'HP', 'Hewlett Packard',
        'Lenovo', 'ThinkPad', 'Asus', 'Acer', 'MSI', 'Razer', 'Alienware',
        'Microsoft Surface', 'Samsung', 'Toshiba', 'Sony Vaio', 'Huawei MateBook'
      ]
    },
    {
      name: 'Electronics',
      keywords: ['tablet', 'ipad', 'watch', 'smartwatch', 'earbuds', 'headphones'],
      brands: [
        'iPad', 'Apple Watch', 'AirPods', 'Samsung Galaxy Tab', 'Galaxy Watch',
        'Amazon Kindle', 'Fire Tablet', 'Fitbit', 'Garmin', 'Sony', 'Bose',
        'JBL', 'Beats', 'Sennheiser', 'Audio-Technica'
      ]
    },

    // Clothing & Fashion
    {
      name: 'Sportswear',
      keywords: ['shoes', 'sneakers', 'chaussures', 'shirt', 't-shirt', 'pants', 'shorts'],
      brands: [
        'Nike', 'Adidas', 'Puma', 'Reebok', 'Under Armour', 'New Balance',
        'Converse', 'Vans', 'Fila', 'Champion', 'Jordan', 'Yeezy',
        'Asics', 'Skechers', 'Columbia', 'The North Face', 'Patagonia'
      ]
    },
    {
      name: 'Fashion',
      keywords: ['jacket', 'coat', 'dress', 'jeans', 'hoodie', 'sweater', 'vêtement'],
      brands: [
        'Zara', 'H&M', 'Gucci', 'Louis Vuitton', 'Chanel', 'Prada', 'Dior',
        'Versace', 'Armani', 'Calvin Klein', 'Tommy Hilfiger', 'Ralph Lauren',
        'Lacoste', 'Hugo Boss', 'Burberry', 'Levi\'s', 'Gap', 'Uniqlo'
      ]
    },

    // Food & Beverages
    {
      name: 'Fruits',
      keywords: ['fruit', 'fresh', 'organic', 'bio'],
      brands: [
        'Banana', 'Banane', 'Apple', 'Pomme', 'Orange', 'Pineapple', 'Ananas',
        'Mango', 'Mangue', 'Strawberry', 'Fraise', 'Watermelon', 'Pastèque',
        'Grape', 'Raisin', 'Lemon', 'Citron', 'Kiwi', 'Peach', 'Pêche',
        'Pear', 'Poire', 'Cherry', 'Cerise', 'Avocado', 'Avocat'
      ]
    },
    {
      name: 'Vegetables',
      keywords: ['vegetable', 'légume', 'veggie', 'organic'],
      brands: [
        'Tomato', 'Tomate', 'Cucumber', 'Concombre', 'Onion', 'Oignon',
        'Carrot', 'Carotte', 'Potato', 'Pomme de terre', 'Lettuce', 'Laitue',
        'Broccoli', 'Brocoli', 'Spinach', 'Épinard', 'Pepper', 'Poivron',
        'Cabbage', 'Chou', 'Celery', 'Céleri', 'Zucchini', 'Courgette'
      ]
    },
    {
      name: 'Beverages',
      keywords: ['drink', 'beverage', 'soda', 'juice', 'water', 'boisson'],
      brands: [
        'Coca-Cola', 'Coke', 'Pepsi', 'Sprite', 'Fanta', 'Mountain Dew',
        'Red Bull', 'Monster Energy', 'Gatorade', 'Tropicana', 'Minute Maid',
        'Evian', 'Perrier', 'San Pellegrino', 'Vittel', 'Nestlé'
      ]
    },

    // Automotive
    {
      name: 'Cars',
      keywords: ['car', 'vehicle', 'auto', 'voiture', 'automobile'],
      brands: [
        'Mercedes', 'Mercedes-Benz', 'BMW', 'Audi', 'Volkswagen', 'VW',
        'Porsche', 'Ferrari', 'Lamborghini', 'Volvo', 'Tesla', 'Ford',
        'Toyota', 'Honda', 'Nissan', 'Mazda', 'Hyundai', 'Kia', 'Lexus',
        'Jaguar', 'Land Rover', 'Range Rover', 'Bentley', 'Rolls-Royce',
        'Peugeot', 'Renault', 'Citroën', 'Fiat', 'Alfa Romeo', 'Chevrolet'
      ]
    },

    // Home & Furniture
    {
      name: 'Furniture',
      keywords: ['furniture', 'table', 'chair', 'sofa', 'bed', 'meuble'],
      brands: [
        'IKEA', 'Ashley', 'Wayfair', 'West Elm', 'Pottery Barn', 'Crate & Barrel',
        'CB2', 'Room & Board', 'Article', 'Restoration Hardware', 'La-Z-Boy'
      ]
    },

    // Beauty & Personal Care
    {
      name: 'Beauty',
      keywords: ['makeup', 'cosmetic', 'perfume', 'beauty', 'beauté', 'parfum'],
      brands: [
        'L\'Oréal', 'Maybelline', 'MAC', 'Estée Lauder', 'Clinique', 'Lancôme',
        'Dior', 'Chanel', 'YSL', 'Nars', 'Urban Decay', 'Sephora', 'NYX',
        'Revlon', 'CoverGirl', 'Neutrogena', 'Nivea', 'Dove', 'Olay'
      ]
    }
  ];

  // Fuzzy matching function using Levenshtein distance
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  // Find the best match for a product name
  findBestMatch(text: string, threshold: number = 0.7): { name: string; category: string; confidence: number } | null {
    text = text.toLowerCase().trim();
    let bestMatch: { name: string; category: string; confidence: number } | null = null;
    let bestScore = 0;

    for (const category of this.productDatabase) {
      for (const brand of category.brands) {
        const brandLower = brand.toLowerCase();

        // Exact match
        if (text === brandLower) {
          return { name: brand, category: category.name, confidence: 1.0 };
        }

        // Contains match
        if (text.includes(brandLower) || brandLower.includes(text)) {
          const confidence = Math.max(text.length, brandLower.length) /
            Math.min(text.length, brandLower.length);
          if (confidence > bestScore) {
            bestScore = confidence;
            bestMatch = { name: brand, category: category.name, confidence };
          }
        }

        // Fuzzy match (Levenshtein distance)
        const distance = this.levenshteinDistance(text, brandLower);
        const maxLength = Math.max(text.length, brandLower.length);
        const similarity = 1 - (distance / maxLength);

        if (similarity >= threshold && similarity > bestScore) {
          bestScore = similarity;
          bestMatch = { name: brand, category: category.name, confidence: similarity };
        }
      }
    }

    return bestMatch && bestScore >= threshold ? bestMatch : null;
  }

  // Enhanced product recognition from OCR text
  extractProducts(ocrText: string): Array<{ original: string; matched: string; category: string; confidence: number }> {
    const lines = ocrText.split('\n');
    const products: Array<{ original: string; matched: string; category: string; confidence: number }> = [];

    for (const line of lines) {
      const words = line.split(/\s+/);

      // Check each word and word combinations
      for (let i = 0; i < words.length; i++) {
        // Single word
        const match1 = this.findBestMatch(words[i]);
        if (match1 && match1.confidence >= 0.7) {
          products.push({
            original: words[i],
            matched: match1.name,
            category: match1.category,
            confidence: match1.confidence
          });
        }

        // Two words
        if (i < words.length - 1) {
          const twoWords = `${words[i]} ${words[i + 1]}`;
          const match2 = this.findBestMatch(twoWords);
          if (match2 && match2.confidence >= 0.7) {
            products.push({
              original: twoWords,
              matched: match2.name,
              category: match2.category,
              confidence: match2.confidence
            });
          }
        }

        // Three words
        if (i < words.length - 2) {
          const threeWords = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
          const match3 = this.findBestMatch(threeWords);
          if (match3 && match3.confidence >= 0.7) {
            products.push({
              original: threeWords,
              matched: match3.name,
              category: match3.category,
              confidence: match3.confidence
            });
          }
        }
      }
    }

    // Remove duplicates and keep highest confidence
    const uniqueProducts = new Map<string, typeof products[0]>();
    for (const product of products) {
      const existing = uniqueProducts.get(product.matched);
      if (!existing || product.confidence > existing.confidence) {
        uniqueProducts.set(product.matched, product);
      }
    }

    return Array.from(uniqueProducts.values());
  }

  // Get all brands for autocomplete/suggestions
  getAllBrands(): string[] {
    const brands: string[] = [];
    for (const category of this.productDatabase) {
      brands.push(...category.brands);
    }
    return brands.sort();
  }

  // Add custom product to database
  addCustomProduct(category: string, brandName: string) {
    const cat = this.productDatabase.find(c => c.name === category);
    if (cat && !cat.brands.includes(brandName)) {
      cat.brands.push(brandName);
    }
  }
}
