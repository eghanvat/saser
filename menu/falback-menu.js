// Fallback menu — shown only if the live Supabase connection fails.
// Keep this in sync manually whenever the real menu changes in Supabase,
// so guests always see something close to accurate even if the database is down.

const FALLBACK_MENU = [
  { category: "Burger/Sandwich", items: [
    { name: "Veg Sandwich", price: 150, is_veg: true, is_available: true },
    { name: "Chicken Sandwich", price: 230, is_veg: false, is_available: true },
    { name: "Mutton Sandwich", price: 250, is_veg: false, is_available: true },
    { name: "Veg Burger", price: 200, is_veg: true, is_available: true },
    { name: "Potato Cheese Burger", price: 230, is_veg: true, is_available: true },
    { name: "Chicken Burger", price: 250, is_veg: false, is_available: true },
    { name: "Mutton Burger", price: 300, is_veg: false, is_available: true }
  ]},
  { category: "Snack", items: [
    { name: "Masala Papad", price: 70, is_veg: true, is_available: true },
    { name: "Veg Pakora", price: 120, is_veg: true, is_available: true },
    { name: "Paneer Pakora", price: 150, is_veg: true, is_available: true },
    { name: "Veg Roll", price: 150, is_veg: true, is_available: true },
    { name: "Paneer Roll", price: 170, is_veg: true, is_available: true },
    { name: "Chicken Roll", price: 200, is_veg: false, is_available: true },
    { name: "Mutton Roll", price: 250, is_veg: false, is_available: true }
  ]},
  { category: "Momo/Noodle", items: [
    { name: "Veg Thukpa", price: 230, is_veg: true, is_available: true },
    { name: "Chicken Thukpa", price: 260, is_veg: false, is_available: true },
    { name: "Mutton Thukpa", price: 280, is_veg: false, is_available: true },
    { name: "Veg Chowmein", price: 230, is_veg: true, is_available: true },
    { name: "Chicken Chowmein", price: 260, is_veg: false, is_available: true },
    { name: "Mutton Chowmein", price: 280, is_veg: false, is_available: true },
    { name: "Veg Thenthuk", price: 230, is_veg: true, is_available: true },
    { name: "Chicken Thenthuk", price: 260, is_veg: false, is_available: true },
    { name: "Mutton Thenthuk", price: 280, is_veg: false, is_available: true },
    { name: "Veg Momo", price: 250, is_veg: true, is_available: true },
    { name: "Chicken Momo", price: 280, is_veg: false, is_available: true },
    { name: "Mutton Momo", price: 300, is_veg: false, is_available: true },
    { name: "Tingmo", price: 80, is_veg: true, is_available: true }
  ]},
  { category: "Roti/Rice", items: [
    { name: "Plain Rice", price: 80, is_veg: true, is_available: true },
    { name: "Jeera Rice", price: 100, is_veg: true, is_available: true },
    { name: "Veg Fried Rice", price: 150, is_veg: true, is_available: true },
    { name: "Plain Roti", price: 20, is_veg: true, is_available: true },
    { name: "Butter Roti", price: 25, is_veg: true, is_available: true },
    { name: "Plain Naan", price: 50, is_veg: true, is_available: true },
    { name: "Butter Naan", price: 70, is_veg: true, is_available: true },
    { name: "Garlic Naan", price: 80, is_veg: true, is_available: true }
  ]},
  { category: "Veg/Non Veg", items: [
    { name: "Plain Dal", price: 130, is_veg: true, is_available: true },
    { name: "Dal Fry", price: 150, is_veg: true, is_available: true },
    { name: "Rajma Dal", price: 180, is_veg: true, is_available: true },
    { name: "Dal Makhani", price: 200, is_veg: true, is_available: true },
    { name: "Mix Veg", price: 200, is_veg: true, is_available: true },
    { name: "Saute Veg", price: 200, is_veg: true, is_available: true },
    { name: "Palak Paneer", price: 250, is_veg: true, is_available: true },
    { name: "Chicken Shapta", price: 260, is_veg: false, is_available: true },
    { name: "Mutton Shapta", price: 300, is_veg: false, is_available: true },
    { name: "Chicken Curry", price: 280, is_veg: false, is_available: true },
    { name: "Mutton Curry", price: 300, is_veg: false, is_available: true },
    { name: "Butter Chicken", price: 280, is_veg: false, is_available: true },
    { name: "Chilli Chicken", price: 280, is_veg: false, is_available: true }
  ]},
  { category: "Tea/Coffee", items: [
    { name: "Black Tea", price: 30, is_veg: true, is_available: true },
    { name: "Green Tea", price: 50, is_veg: true, is_available: true },
    { name: "Milk Tea", price: 40, is_veg: true, is_available: true },
    { name: "Masala Tea", price: 50, is_veg: true, is_available: true },
    { name: "Lemon Tea", price: 50, is_veg: true, is_available: true },
    { name: "Lemon Ginger Honey", price: 80, is_veg: true, is_available: true },
    { name: "Black Coffee", price: 60, is_veg: true, is_available: true },
    { name: "Milk Coffee", price: 100, is_veg: true, is_available: true }
  ]},
  { category: "Breakfast", items: [
    { name: "Plain Toast", price: 50, is_veg: true, is_available: true },
    { name: "Butter Toast", price: 80, is_veg: true, is_available: true },
    { name: "Bread Omelette", price: 100, is_veg: false, is_available: true },
    { name: "Aloo Paratha", price: 120, is_veg: true, is_available: true },
    { name: "Paneer Paratha", price: 150, is_veg: true, is_available: true },
    { name: "Cheese Paratha", price: 150, is_veg: true, is_available: true },
    { name: "Paneer Burji", price: 150, is_veg: true, is_available: true },
    { name: "Boil Egg", price: 70, is_veg: false, is_available: true },
    { name: "Plain Omelette", price: 70, is_veg: false, is_available: true },
    { name: "Masala Omelette", price: 90, is_veg: false, is_available: true }
  ]},
  { category: "Porridge/Pancake", items: [
    { name: "Plain Porridge", price: 120, is_veg: true, is_available: true },
    { name: "Honey Porridge", price: 150, is_veg: true, is_available: true },
    { name: "Banana Porridge", price: 200, is_veg: true, is_available: true },
    { name: "Mix Fruit Porridge", price: 0, is_veg: true, is_available: false },
    { name: "Plain Pancake", price: 100, is_veg: true, is_available: true },
    { name: "Banana Pancake", price: 130, is_veg: true, is_available: true },
    { name: "Mix Fruit Pancake", price: 150, is_veg: true, is_available: true }
  ]},
  { category: "Juice/Cold Drink", items: [
    { name: "Mineral Water", price: 30, is_veg: true, is_available: true },
    { name: "Plain Soda", price: 30, is_veg: true, is_available: true },
    { name: "Lemon Soda", price: 50, is_veg: true, is_available: true },
    { name: "ABC Juice", price: 150, is_veg: true, is_available: true },
    { name: "Orange Juice", price: 150, is_veg: true, is_available: true },
    { name: "Pineapple Juice", price: 150, is_veg: true, is_available: true },
    { name: "Watermelon Juice", price: 150, is_veg: true, is_available: true },
    { name: "Mix Fruit Juice", price: 200, is_veg: true, is_available: true }
  ]},
  { category: "Lassi/Shake", items: [
    { name: "Plain Lassi", price: 70, is_veg: true, is_available: true },
    { name: "Sweet/Salt Lassi", price: 80, is_veg: true, is_available: true },
    { name: "Banana Lassi", price: 100, is_veg: true, is_available: true },
    { name: "Mango Lassi", price: 150, is_veg: true, is_available: true },
    { name: "Plain Shake", price: 100, is_veg: true, is_available: true },
    { name: "Banana Shake", price: 150, is_veg: true, is_available: true },
    { name: "Mango Shake", price: 150, is_veg: true, is_available: true }
  ]},
  { category: "Soups", items: [
    { name: "Veg Soup", price: 150, is_veg: true, is_available: true },
    { name: "Tomato Soup", price: 180, is_veg: true, is_available: true },
    { name: "Mushroom Soup", price: 200, is_veg: true, is_available: true },
    { name: "Chicken Soup", price: 230, is_veg: false, is_available: true },
    { name: "Mutton Soup", price: 250, is_veg: false, is_available: true }
  ]}
];
