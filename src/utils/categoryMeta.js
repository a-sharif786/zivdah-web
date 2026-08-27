// The real backend only has 5 categories (com.zivdah.product.enums.ProductCategory),
// with no icon/color/display-name metadata of its own — this is purely client-side
// presentation dressing mapped onto the real enum values, not invented backend data.
export const CATEGORY_META = {
  VEGETABLE: { label: 'Vegetables', icon: 'https://www.zivdahonlinegrocery.com/media/etrend/brand/Vegetables.png', color: '#4caf50' },
  FRUIT: { label: 'Fruits', icon: 'https://www.zivdahonlinegrocery.com/media/etrend/brand/Fruits.png', color: '#e53935' },
  MILK: { label: 'Dairy & Milk', icon: 'https://www.zivdahonlinegrocery.com/media/etrend/brand/DairyProducts.png', color: '#42a5f5' },
  PULSE: { label: 'Pulses & Grains', icon: 'https://www.zivdahonlinegrocery.com/media/etrend/brand/Pulses.png', color: '#8d6e63' },
  GROCERY: { label: 'Grocery', icon: 'https://www.zivdahonlinegrocery.com/media/etrend/brand/Groceries.png', color: '#fb8c00' },
};

export const CATEGORY_VALUES = Object.keys(CATEGORY_META);

export function categoryLabel(category) {
  return CATEGORY_META[category]?.label ?? category;
}
