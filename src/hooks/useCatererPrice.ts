import { useState, useEffect } from 'react';
import { UnifiedCaterer } from '@/types/unifiedCaterer';

interface MenuDetails {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface UseCatererPriceReturn {
  pricePerPerson: number;
  totalPrice: number;
  selectedMenuDetails: MenuDetails | null;
}

export const useCatererPrice = (
  caterer: UnifiedCaterer | undefined,
  selectedMenuId: string | null,
  guestCount: number
): UseCatererPriceReturn => {
  const [pricePerPerson, setPricePerPerson] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [selectedMenuDetails, setSelectedMenuDetails] = useState<MenuDetails | null>(null);

  useEffect(() => {
    if (!caterer) return;

    let price = caterer.pricePerPerson || 0;
    let menuDetails = null;

    // If a menu is selected, use its price
    if (selectedMenuId && caterer.menus) {
      const menu = caterer.menus.find(menu => menu.id === selectedMenuId);
      if (menu) {
        price = menu.price;
        menuDetails = {
          id: menu.id,
          name: menu.name,
          price: menu.price,
          description: menu.description,
        };
      }
    }

    setPricePerPerson(price);
    setTotalPrice(price * guestCount);
    setSelectedMenuDetails(menuDetails);
  }, [caterer, selectedMenuId, guestCount]);

  return { pricePerPerson, totalPrice, selectedMenuDetails };
};

export default useCatererPrice;
