import { Product } from '../types/coffee';

export const PRODUCTS: Product[] = [
  {
    id: 'ethiopia-yirgacheffe',
    name: 'Ethiopia Yirgacheffe G1',
    origin: 'Ethiopia',
    region: 'Yirgacheffe',
    process: 'Washed',
    altitude: '1,900 - 2,200m',
    flavor_notes: ['Jasmine', 'Bergamot', 'Peach', 'Lemon Drop'],
    roast_level: 'Light',
    description: 'A legendary washed Ethiopian coffee with vibrant floral aromatics, crisp citrus acidity, and an exceptionally clean, tea-like finish.',
    price: 18.50,
    stock_quantity: 40,
    image: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=800&auto=format&fit=crop',
    weight_options: ['250g', '500g', '1kg'],
    grind_options: ['Whole Bean', 'Espresso', 'Pour Over / Drip', 'French Press'],
    bestseller: true,
  },
  {
    id: 'colombia-huila-bourbon',
    name: 'Colombia El Paraiso Bourbon',
    origin: 'Colombia',
    region: 'Huila',
    process: 'Honey',
    altitude: '1,750m',
    flavor_notes: ['Caramel', 'Red Apple', 'Brown Sugar', 'Milk Chocolate'],
    roast_level: 'Medium',
    description: 'Sourced from high-altitude farms in Huila, this honey-processed Bourbon delivers incredible sweetness with balanced red fruit acidity and buttery body.',
    price: 17.00,
    stock_quantity: 30,
    image: 'https://images.unsplash.com/photo-1610632380989-68fef408161d?q=80&w=800&auto=format&fit=crop',
    weight_options: ['250g', '500g', '1kg'],
    grind_options: ['Whole Bean', 'Espresso', 'Pour Over / Drip', 'French Press'],
    bestseller: true,
  },
  {
    id: 'sumatra-mandheling',
    name: 'Sumatra Kerinci Triple Pick',
    origin: 'Indonesia',
    region: 'Kerinci, Sumatra',
    process: 'Wet-Hulled (Giling Basah)',
    altitude: '1,500m',
    flavor_notes: ['Dark Chocolate', 'Cedar', 'Blackberry', 'Tobacco Leaf'],
    roast_level: 'Dark',
    description: 'Traditional Sumatran wet-hulled processing creates a heavy, syrupy body with low acidity and deep, earthy cocoa notes.',
    price: 16.50,
    stock_quantity: 25,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop',
    weight_options: ['250g', '500g', '1kg'],
    grind_options: ['Whole Bean', 'Espresso', 'Pour Over / Drip', 'French Press'],
  },
  {
    id: 'guatemala-antigua',
    name: 'Guatemala Antigua La Cascada',
    origin: 'Guatemala',
    region: 'Antigua Valley',
    process: 'Washed',
    altitude: '1,600 - 1,800m',
    flavor_notes: ['Toasted Almond', 'Cacao Nibs', 'Green Apple', 'Spiced Caramel'],
    roast_level: 'Medium',
    description: 'Grown in volcanic soil surrounded by three volcanoes. Offers a rich, velvety cup with complex cocoa notes and a smooth finish.',
    price: 17.50,
    stock_quantity: 35,
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800&auto=format&fit=crop',
    weight_options: ['250g', '500g', '1kg'],
    grind_options: ['Whole Bean', 'Espresso', 'Pour Over / Drip', 'French Press'],
  }
];

export const BREW_GUIDES = [
  {
    method: 'Pour Over (V60)',
    ratio: '1:16 (e.g., 20g coffee to 320g water)',
    grind: 'Medium-Fine (like table salt)',
    time: '2:30 - 3:00 minutes',
    steps: [
      'Rinse paper filter with hot water and discard water.',
      'Add 20g of medium-fine coffee and tare scale.',
      'Pour 60g water for a 30-second bloom.',
      'Pour in concentric circles up to 320g in stages. Enjoy!'
    ]
  },
  {
    method: 'Espresso',
    ratio: '1:2 (e.g., 18g coffee to 36g espresso out)',
    grind: 'Fine (powdery)',
    time: '25 - 30 seconds',
    steps: [
      'Dose 18g freshly ground coffee into your portafilter and distribute evenly.',
      'Tamp firmly and level.',
      'Lock in and immediately start extraction. Aim for 36g liquid espresso in 28 seconds.'
    ]
  },
  {
    method: 'French Press',
    ratio: '1:15 (e.g., 30g coffee to 450g water)',
    grind: 'Coarse (sea salt consistency)',
    time: '4:00 minutes',
    steps: [
      'Add 30g coarse coffee to the French Press.',
      'Pour 450g hot water (93°C), give a gentle stir.',
      'Place plunger on top without pressing down. Steep for 4 minutes.',
      'Press down slowly and serve immediately.'
    ]
  }
];