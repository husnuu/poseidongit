import type { SiteLocale } from './config'

export type MenuPageUi = {
  numberLocale: string
  pageTitle: string
  pageIntro: string
  categoriesAriaLabel: string
  emptyCategory: string
  outOfStock: string
  tabAll: string
  tabCocktails: string
  cardCocktails: string
  tabMocktails: string
  tabBeerWine: string
  cardAlcoholic: string
  tabSoftDrinks: string
  cardSoftDrinks: string
  tabBottles: string
  tabColdCoffee: string
  cardColdCoffee: string
  tabHotCoffee: string
  cardHotCoffee: string
  tabPremiumTea: string
  cardPremiumTea: string
  tabIceCream: string
  tabDesserts: string
}

const TR: MenuPageUi = {
  numberLocale: 'tr-TR',
  pageTitle: 'Tekne Menüsü',
  pageIntro: 'Lüks tekne konseptine uygun içecek ve atıştırmalıklar. Kategoriye dokunarak filtreleyin.',
  categoriesAriaLabel: 'Menü kategorileri',
  emptyCategory: 'Bu kategoride henüz ürün yok.',
  outOfStock: 'Tükendi',
  tabAll: 'Tümü',
  tabCocktails: 'Kokteyller',
  cardCocktails: 'Kokteyller (Margarita, Mojito vb.)',
  tabMocktails: 'Mocktails',
  tabBeerWine: 'Bira & Şarap',
  cardAlcoholic: 'Alkollü içecekler',
  tabSoftDrinks: 'Soft içecek',
  cardSoftDrinks: 'Soft içecekler',
  tabBottles: 'Şişeler',
  tabColdCoffee: 'Soğuk kahve',
  cardColdCoffee: 'Soğuk Kahveler',
  tabHotCoffee: 'Sıcak kahve',
  cardHotCoffee: 'Sıcak Kahveler',
  tabPremiumTea: 'Premium çay',
  cardPremiumTea: 'Premium Çaylar',
  tabIceCream: 'Dondurma',
  tabDesserts: 'Tatlı',
}

const EN: MenuPageUi = {
  numberLocale: 'en-US',
  pageTitle: 'Boat Menu',
  pageIntro: 'Drinks and snacks fitting the luxury yacht concept. Tap a category to filter.',
  categoriesAriaLabel: 'Menu categories',
  emptyCategory: 'No items in this category yet.',
  outOfStock: 'Sold out',
  tabAll: 'All',
  tabCocktails: 'Cocktails',
  cardCocktails: 'Cocktails (Margarita, Mojito etc.)',
  tabMocktails: 'Mocktails',
  tabBeerWine: 'Beer & Wine',
  cardAlcoholic: 'Alcoholic drinks',
  tabSoftDrinks: 'Soft drinks',
  cardSoftDrinks: 'Soft drinks',
  tabBottles: 'Bottles',
  tabColdCoffee: 'Iced coffee',
  cardColdCoffee: 'Iced coffees',
  tabHotCoffee: 'Hot coffee',
  cardHotCoffee: 'Hot coffees',
  tabPremiumTea: 'Premium tea',
  cardPremiumTea: 'Premium teas',
  tabIceCream: 'Ice cream',
  tabDesserts: 'Desserts',
}

const DE: MenuPageUi = {
  numberLocale: 'de-DE',
  pageTitle: 'Bootsmenü',
  pageIntro: 'Getränke und Snacks passend zum Luxusyacht-Konzept. Tippen Sie auf eine Kategorie zum Filtern.',
  categoriesAriaLabel: 'Menükategorien',
  emptyCategory: 'In dieser Kategorie gibt es noch keine Produkte.',
  outOfStock: 'Ausverkauft',
  tabAll: 'Alle',
  tabCocktails: 'Cocktails',
  cardCocktails: 'Cocktails (Margarita, Mojito usw.)',
  tabMocktails: 'Mocktails',
  tabBeerWine: 'Bier & Wein',
  cardAlcoholic: 'Alkoholische Getränke',
  tabSoftDrinks: 'Softdrinks',
  cardSoftDrinks: 'Softdrinks',
  tabBottles: 'Flaschen',
  tabColdCoffee: 'Eiskaffee',
  cardColdCoffee: 'Eiskaffees',
  tabHotCoffee: 'Heißer Kaffee',
  cardHotCoffee: 'Heiße Kaffees',
  tabPremiumTea: 'Premium-Tee',
  cardPremiumTea: 'Premium-Tees',
  tabIceCream: 'Eis',
  tabDesserts: 'Desserts',
}

const MAP: Record<SiteLocale, MenuPageUi> = { tr: TR, en: EN, de: DE }

export function getMenuPageUi(locale: SiteLocale): MenuPageUi {
  return MAP[locale] ?? TR
}
