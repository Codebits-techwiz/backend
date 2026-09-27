export const formatMoney = (amount, currencyCode = 'USD') => {
  let locale = 'en-US';
  if (currencyCode === 'PKR') locale = 'en-PK';
  if (currencyCode === 'EUR') locale = 'en-IE';
  if (currencyCode === 'GBP') locale = 'en-GB';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};
