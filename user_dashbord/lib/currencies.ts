export type CurrencyItem = {
  code: string;
  name: string;
  icon?: string;
};

// Default currencies (can be extended via modal)
export const DEFAULT_CURRENCIES: CurrencyItem[] = [
  { code: 'USD', name: 'US Dollar', icon: '$' },
  { code: 'EUR', name: 'Euro', icon: '€' },
  { code: 'GBP', name: 'British Pound', icon: '£' },
  { code: 'JPY', name: 'Japanese Yen', icon: '¥' },
  { code: 'AUD', name: 'Australian Dollar', icon: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', icon: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', icon: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', icon: '¥' },
  { code: 'INR', name: 'Indian Rupee', icon: '₹' },
  { code: 'NZD', name: 'New Zealand Dollar', icon: 'NZ$' },
  { code: 'SGD', name: 'Singapore Dollar', icon: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', icon: 'HK$' },
  { code: 'SEK', name: 'Swedish Krona', icon: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', icon: 'kr' },
  { code: 'MXN', name: 'Mexican Peso', icon: '$' },
  { code: 'BRL', name: 'Brazilian Real', icon: 'R$' },
  { code: 'ZAR', name: 'South African Rand', icon: 'R' },
];
