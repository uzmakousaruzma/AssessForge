// Utility function to convert numbers to Roman numerals
export const toRoman = (num) => {
  const romanNumerals = [
    { value: 8, numeral: 'VIII' },
    { value: 7, numeral: 'VII' },
    { value: 6, numeral: 'VI' },
    { value: 5, numeral: 'V' },
    { value: 4, numeral: 'IV' },
    { value: 3, numeral: 'III' },
    { value: 2, numeral: 'II' },
    { value: 1, numeral: 'I' },
  ];

  for (let i = 0; i < romanNumerals.length; i++) {
    if (num >= romanNumerals[i].value) {
      return romanNumerals[i].numeral;
    }
  }
  return '';
};

