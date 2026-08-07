// The real backend only has 5 categories (com.zivdah.product.enums.ProductCategory),
// with no icon/color/display-name metadata of its own — this is purely client-side
// presentation dressing mapped onto the real enum values, not invented backend data.
export const CATEGORY_META = {
  VEGETABLE: { label: 'Vegetables', icon: '🥦', color: '#4caf50' },
  FRUIT: { label: 'Fruits', icon: '🍎', color: '#e53935' },
  MILK: { label: 'Dairy & Milk', icon: '🥛', color: '#42a5f5' },
  PULSE: { label: 'Pulses & Grains', icon: '🫘', color: '#8d6e63' },
  GROCERY: { label: 'Grocery', icon: '🛒', color: '#fb8c00' },
};

export const CATEGORY_VALUES = Object.keys(CATEGORY_META);

export function categoryLabel(category) {
  return CATEGORY_META[category]?.label ?? category;
}
