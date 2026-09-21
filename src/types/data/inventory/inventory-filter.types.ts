/** Submenu item in inventory filter menu */
export type InventorySubmenuItem = {
  id: string;
  label: string;
  icon: string | null;
  priority: number;
};

/** Top-level menu item in inventory filter */
export type InventoryMenuItem = {
  id: string;
  label: string;
  icon: string | null;
  priority: number;
  submenu: InventorySubmenuItem[];
};

/** Course level filter item */
export type InventoryLevelItem = {
  id: string;
  label: string;
  priority: number;
};

/** Response payload for inventory filter options */
export type InventoryFilterResponse = {
  menu: InventoryMenuItem[];
  level: InventoryLevelItem[];
};
