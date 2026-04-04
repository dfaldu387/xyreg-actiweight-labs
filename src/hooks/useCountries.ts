import { useState, useEffect } from 'react';
import { countries } from '@/data/countries';

export interface CountryOption {
  value: string;
  label: string;
}

export function useCountries() {
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCountries = () => {
      try {
        setLoading(true);
        setError(null);
        
        const countryOptions: CountryOption[] = countries.map(country => ({
          value: country,
          label: country
        }));
        
        // Sort countries alphabetically
        countryOptions.sort((a, b) => a.label.localeCompare(b.label));
        
        setCountryOptions(countryOptions);
      } catch (err) {
        console.error('Error loading countries:', err);
        setError('Failed to load countries');
      } finally {
        setLoading(false);
      }
    };

    loadCountries();
  }, []);

  return { countries: countryOptions, loading, error };
}