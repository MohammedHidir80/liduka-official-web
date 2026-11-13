export const categories = [
  { id: "all", name: "All" },
  { id: "electronics", name: "Electronics" },
  { id: "fashion", name: "Fashion" },
  { id: "home", name: "Home" },
  { id: "beauty", name: "Beauty" },
  { id: "sports", name: "Sports" },
  { id: "books", name: "Books" },
  { id: "toys", name: "Toys" },
];

export const vendors = [
  {
    id: "v1",
    name: "TechNova",
    avatar: "https://i.pravatar.cc/150?u=technova",

    tagline: "Premium Tech Essentials",
    description: "Award-winning tech gadgets designed for modern living. Trusted by thousands across Africa.",
    cover: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
    joined: "January 2024",
    location: "Accra, Ghana",
    rating: 4.8,
    reviews: 1240,
    followers: 3120,
    verified: true,
    hue: 232
  },
  {
    id: "v2",
    name: "UrbanStyle",
    avatar: "https://i.pravatar.cc/150?u=urbanstyle",
    tagline: "Timeless Urban Fashion",
    description: "Crafted leather goods and timeless accessories for the modern wardrobe.",
    cover: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80",
    joined: "March 2024",
    location: "Lagos, Nigeria",
    rating: 4.7,
    reviews: 860,
    followers: 2410,
    verified: true,
    hue: 330
  },
  {
    id: "v3",
    name: "EcoWear",
    avatar: "https://i.pravatar.cc/150?u=ecowear",
    tagline: "Sustainable everyday essentials",
    description: "Organic fabrics, ethical production, zero compromise on comfort.",
    cover: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&q=80",
    joined: "June 2024",
    location: "Nairobi, Kenya",
    rating: 4.5,
    reviews: 430,
    followers: 980,
    verified: true,
    hue: 160
  },
  {
    id: "v4",
    name: "ComfortZone",
    avatar: "https://i.pravatar.cc/150?u=beautyglow",
    tagline: "Furniture that feels like home",
    description: "Ergonomic furniture crafted for comfort and durability.",
    cover: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80",
    joined: "August 2024",
    location: "Cape Town, SA",
    rating: 4.9,
    reviews: 2100,
    followers: 5400,
    verified: false,
    hue: 20
  },
  {
    id: "v5",
    name: "BeautyGlow",
    avatar: "https://i.pravatar.cc/150?u=toyworld",
    tagline: "Skincare backed by science",
    description: "Dermatologist-approved skincare formulas for glowing, healthy skin.",
    cover: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1200&q=80",
    joined: "February 2024",
    location: "Accra, Ghana",
    rating: 4.8,
    reviews: 1500,
    followers: 4200,
    verified: true,
    hue: 280
  },
  {
    id: "v6",
    name: "HomeDecorCo",
    avatar: "https://i.pravatar.cc/150?u=homedecorco",
    tagline: "Small touches, big impact",
    description: "Curated home décor and lifestyle accessories to elevate your space.",
    cover: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80",
    joined: "May 2024",
    location: "Kumasi, Ghana",
    rating: 4.6,
    reviews: 890,
    followers: 1800,
    verified: false,
    hue: 45
  },
  {
    id: "v7",
    name: "ActiveLife",
    avatar: "https://i.pravatar.cc/150?u=activelife",
    tagline: "Gear for the active",
    description: "Yoga and fitness gear designed to move with you.",
    cover: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80",
    joined: "July 2024",
    location: "Lagos, Nigeria",
    rating: 4.7,
    reviews: 670,
    followers: 2100,
    verified: true,
    hue: 120
  },
  {
    id: "v8",
    name: "PageTurner",
    avatar: "https://i.pravatar.cc/150?u=pageturner",
    tagline: "Stories worth your time",
    description: "Handpicked books for every kind of reader.",
    cover: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&q=80",
    joined: "September 2024",
    location: "Accra, Ghana",
    rating: 4.9,
    reviews: 320,
    followers: 950,
    verified: false,
    hue: 200
  },
  {
    id: "v9",
    name: "ToyWorld",
    avatar: "https://i.pravatar.cc/150?u=toyworld",
    tagline: "Play, learn, grow",
    description: "Safe, creative toys for curious minds.",
    cover: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&q=80",
    joined: "October 2024",
    location: "Tema, Ghana",
    rating: 4.5,
    reviews: 410,
    followers: 1100,
    verified: true,
    hue: 15
  },
];

export const products = [
  {
    id: '1', vendorId: 'v1', title: 'Wireless Noise-Cancelling Headphones', category: 'electronics', price: 299.99, oldPrice: 0, rating: 4.8, reviews: 214, stock: 12, hue: 232,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80'],
    video: 'https://www.w3schools.com/html/mov_bbb.mp4',
    description: 'Experience premium sound quality with active noise cancellation, comfortable ear cups, and 30-hour battery life.',
    variants: [{ type: 'Color', options: ['Black', 'Silver', 'White'] }]
  },
  {
    id: '4', vendorId: 'v1', title: 'Smart Home Speaker', category: 'electronics', price: 89.99, oldPrice: 0, rating: 4.6, reviews: 96, stock: 8, hue: 205,
    images: ['https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=80'],
    description: 'Control your smart home devices, play music, and get daily updates with this voice-activated smart speaker.',
    variants: [{ type: 'Color', options: ['Charcoal', 'Sand'] }]
  },
  {
    id: '12', vendorId: 'v1', title: 'Mechanical Gaming Keyboard', category: 'electronics', price: 129.99, oldPrice: 0, rating: 4.7, reviews: 331, stock: 10, hue: 250,
    images: ['https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80'],
    description: 'Tactile mechanical switches, customizable RGB backlighting, and durable aluminum frame.',
    variants: [{ type: 'Switch Type', options: ['Red', 'Blue', 'Brown'] }]
  },
  {
    id: '13', vendorId: 'v1', title: 'Wireless Ergonomic Mouse', category: 'electronics', price: 49.99, oldPrice: 0, rating: 4.4, reviews: 51, stock: 18, hue: 250,
    images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80'],
    description: 'Designed to reduce wrist strain. Features silent clicking, adjustable DPI, and a long-lasting rechargeable battery.',
    variants: [{ type: 'Color', options: ['Black', 'White'] }]
  },
  {
    id: '18', vendorId: 'v1', title: 'True Wireless Earbuds', category: 'electronics', price: 79.99, oldPrice: 0, rating: 4.3, reviews: 143, stock: 7, hue: 205,
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80'],
    description: 'Compact, sweat-proof earbuds with touch controls and a pocket-sized charging case.',
    variants: [{ type: 'Color', options: ['White', 'Black'] }]
  },
  {
    id: '2', vendorId: 'v2', title: 'Minimalist Leather Watch', category: 'fashion', price: 149.50, oldPrice: 0, rating: 4.5, reviews: 78, stock: 5, hue: 300,
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'],
    description: 'A sleek, minimalist timepiece featuring a genuine leather strap and scratch-resistant sapphire crystal glass.',
    variants: []
  },
  {
    id: '3', vendorId: 'v3', title: 'Organic Cotton T-Shirt', category: 'fashion', price: 29.99, oldPrice: 0, rating: 4.2, reviews: 143, stock: 45, hue: 160,
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'],
    description: 'Crafted from 100% organic cotton, this ultra-soft t-shirt is breathable, sustainable, and perfect for everyday wear.',
    variants: [{ type: 'Size', options: ['S', 'M', 'L', 'XL'] }, { type: 'Color', options: ['White', 'Black', 'Navy'] }]
  },
  {
    id: '7', vendorId: 'v2', title: 'Classic Denim Jacket', category: 'fashion', price: 89.50, oldPrice: 0, rating: 4.6, reviews: 64, stock: 15, hue: 330,
    images: ['https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&q=80'],
    description: 'A timeless wardrobe staple. Made with durable denim and a comfortable fit that only gets better with age.',
    variants: [{ type: 'Size', options: ['S', 'M', 'L', 'XL'] }, { type: 'Color', options: ['Blue', 'Black'] }]
  },
  {
    id: '16', vendorId: 'v2', title: 'Minimalist Leather Wallet', category: 'fashion', price: 39.00, oldPrice: 0, rating: 4.8, reviews: 112, stock: 12, hue: 25,
    images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80'],
    description: 'Slim, RFID-blocking wallet made from full-grain leather. Holds up to 8 cards and cash without the bulk.',
    variants: [{ type: 'Color', options: ['Brown', 'Black'] }]
  },
  {
    id: '5', vendorId: 'v4', title: 'Ergonomic Office Chair', category: 'home', price: 199.00, oldPrice: 0, rating: 4.7, reviews: 88, stock: 3, hue: 20,
    images: ['https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=800&q=80'],
    description: 'Designed for maximum comfort during long work hours. Features adjustable lumbar support, armrests, and breathable mesh.',
    variants: []
  },
  {
    id: '11', vendorId: 'v6', title: 'Ceramic Pour-Over Coffee Set', category: 'home', price: 45.00, oldPrice: 0, rating: 4.9, reviews: 210, stock: 6, hue: 45,
    images: ['https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80'],
    description: 'Brew the perfect cup with this elegant ceramic dripper and matching carafe. Dishwasher safe and heat resistant.',
    variants: []
  },
  {
    id: '14', vendorId: 'v6', title: 'Scented Soy Candle Set', category: 'home', price: 28.50, oldPrice: 0, rating: 4.5, reviews: 45, stock: 22, hue: 45,
    images: ['https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&q=80'],
    description: 'Set of 3 hand-poured soy candles with essential oils. Creates a relaxing and inviting atmosphere in any room.',
    variants: [{ type: 'Scent', options: ['Lavender', 'Vanilla', 'Ocean'] }]
  },
  {
    id: '19', vendorId: 'v6', title: 'Adjustable LED Desk Lamp', category: 'home', price: 32.99, oldPrice: 0, rating: 4.3, reviews: 33, stock: 11, hue: 45,
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80'],
    description: 'Modern desk lamp with 3 color temperatures and 10 brightness levels. Features a built-in USB charging port.',
    variants: [{ type: 'Color', options: ['White', 'Black'] }]
  },
  {
    id: '20', vendorId: 'v4', title: 'Stainless Steel Cookware Set', category: 'home', price: 149.99, oldPrice: 0, rating: 4.6, reviews: 72, stock: 4, hue: 20,
    images: ['https://images.unsplash.com/photo-1584990347449-a2d4c2c9c08d?w=800&q=80'],
    video: 'https://www.w3schools.com/html/mov_bbb.mp4',
    description: '10-piece professional cookware set. Triple-layer stainless steel construction ensures even heat distribution.',
    variants: []
  },
  {
    id: '8', vendorId: 'v5', title: 'Vitamin C Brightening Serum', category: 'beauty', price: 34.99, oldPrice: 0, rating: 4.7, reviews: 205, stock: 30, hue: 280,
    images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80'],
    description: 'A powerful antioxidant serum that brightens skin tone, reduces dark spots, and boosts collagen production.',
    variants: []
  },
  {
    id: '17', vendorId: 'v5', title: 'Hydrating Face Moisturizer', category: 'beauty', price: 24.99, oldPrice: 0, rating: 4.4, reviews: 135, stock: 35, hue: 280,
    images: ['https://images.unsplash.com/photo-1608248593849-59099f3b40d5?w=800&q=80'],
    video: 'https://www.w3schools.com/html/mov_bbb.mp4',
    description: 'Lightweight, non-greasy daily moisturizer with hyaluronic acid. Keeps skin hydrated for up to 48 hours.',
    variants: []
  },
  {
    id: '6', vendorId: 'v3', title: 'Stainless Steel Water Bottle', category: 'sports', price: 24.99, oldPrice: 0, rating: 4.4, reviews: 89, stock: 20, hue: 160,
    images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80'],
    description: 'Double-wall vacuum insulation keeps your drinks cold for 24 hours or hot for 12 hours. Leak-proof and durable.',
    variants: [{ type: 'Color', options: ['Silver', 'Matte Black', 'Ocean Blue'] }]
  },
  {
    id: '9', vendorId: 'v7', title: 'Non-Slip Yoga Mat', category: 'sports', price: 39.99, oldPrice: 0, rating: 4.8, reviews: 150, stock: 25, hue: 120,
    images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80'],
    video: 'https://www.w3schools.com/html/mov_bbb.mp4',
    description: 'Eco-friendly TPE yoga mat with excellent grip and cushioning. Includes a carrying strap for easy transport.',
    variants: [{ type: 'Color', options: ['Purple', 'Green', 'Black'] }]
  },
  {
    id: '10', vendorId: 'v8', title: 'The Silent Patient (Paperback)', category: 'books', price: 14.99, oldPrice: 0, rating: 4.9, reviews: 412, stock: 40, hue: 200,
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80'],
    description: 'A psychological thriller about a woman who shoots her husband and then never speaks another word.',
    variants: []
  },
  {
    id: '15', vendorId: 'v9', title: '1000-Piece Jigsaw Puzzle', category: 'toys', price: 19.99, oldPrice: 0, rating: 4.5, reviews: 60, stock: 14, hue: 15,
    images: ['https://images.unsplash.com/photo-1612404730960-5c71577fca11?w=800&q=80'],
    description: 'Challenge your mind with this beautiful landscape puzzle. Made from high-quality recycled cardboard.',
    variants: []
  },
];

export const orders = [
  {
    id: "ORD-1042",
    buyerId: "u1",
    vendorId: "v1",
    items: [{ productId: "1", qty: 1, price: 299.99 }],
    status: "pending",
    total: 299.99,
    createdAt: "2025-01-12",
  },
  {
    id: "ORD-1041",
    buyerId: "u1",
    vendorId: "v1",
    items: [{ productId: "4", qty: 2, price: 89.99 }],
    status: "shipped",
    total: 179.98,
    createdAt: "2025-01-09",
  },
  {
    id: "ORD-1040",
    buyerId: "u3",
    vendorId: "v1",
    items: [{ productId: "12", qty: 1, price: 129.99 }],
    status: "accepted",
    total: 129.99,
    createdAt: "2025-01-08",
  },
];

export const demoAccounts = [
  {
    id: "u1",
    name: "Ama Mensah",
    email: "ama@Liduka.app",
    role: "buyer",
    walletBalance: 320.5,
    hue: 330,
  },
  {
    id: "u2",
    name: "Kofi Boateng",
    email: "kofi@Liduka.app",
    role: "vendor",
    vendorId: "v1",
    hue: 232,
  },
];

export const vendorById = Object.fromEntries(vendors.map((v) => [v.id, v]));
export const productById = Object.fromEntries(products.map((p) => [p.id, p]));