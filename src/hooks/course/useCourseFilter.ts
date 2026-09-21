import { useEffect, useMemo, useState } from 'react';
import { log } from '../../helpers/logger';
import { apiGetInventoryFilter } from '../../services/inventory/inventory';
import { InventoryFilterResponse } from '../../types/data/inventory/inventory-filter.types';

/**
 * Manage course filter data and UI selection states.
 */
export const useCourseFilter = () => {
  const [filterData, setFilterData] = useState<InventoryFilterResponse | null>(
    null,
  );

  // Section visibility
  const [showCourseType, setShowCourseType] = useState(false);
  const [showPriceRange, setShowPriceRange] = useState(false);
  const [showLevel, setShowLevel] = useState(false);

  // Course type selection
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
    {},
  );
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [selectedSubmenuId, setSelectedSubmenuId] = useState<string | null>(
    null,
  );

  // Price and level selection
  const [selectedPriceId, setSelectedPriceId] = useState<string>('all');
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);

  // Load filter data once on mount
  useEffect(() => {
    let mounted = true;

    apiGetInventoryFilter()
      .then(res => {
        if (mounted) setFilterData(res);
      })
      .catch(err => {
        log('Course', 'inventory filter error', err?.message ?? err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Handle top-level menu click.
   * - If menu has submenu: toggle current menu and collapse others
   * - If no submenu: select menu directly
   */
  const handleMenuPress = (menuId: string, hasSubmenu: boolean) => {
    if (hasSubmenu) {
      setExpandedMenus(prev => {
        const next: Record<string, boolean> = {};
        filterData?.menu?.forEach(menu => {
          next[menu.id] = menu.id === menuId ? !prev[menu.id] : false;
        });
        return next;
      });
    } else {
      setSelectedMenuId(menuId);
      setSelectedSubmenuId(null);
      setExpandedMenus({});
    }
  };

  /**
   * Handle submenu click.
   * subId = null means "All" in selected menu.
   */
  const handleSubmenuPress = (menuId: string, subId: string | null) => {
    setSelectedMenuId(menuId);
    setSelectedSubmenuId(subId);

    if (subId === null) {
      log('Course', 'selected ALL for menu:', menuId);
    } else {
      log('Course', 'selected submenu:', subId, 'of menu:', menuId);
    }
  };

  /** Check whether a menu is selected */
  const isMenuSelected = (menuId: string) => selectedMenuId === menuId;

  /** Check whether a submenu (or All) is selected under a menu */
  const isSubmenuSelected = (menuId: string, subId: string | null) => {
    if (selectedMenuId !== menuId) return false;
    if (subId === null) return selectedSubmenuId === null;
    return selectedSubmenuId === subId;
  };

  /** Select price option */
  const handlePricePress = (id: string) => {
    setSelectedPriceId(id);
  };

  /** Select level option */
  const handleLevelPress = (id: string) => {
    setSelectedLevelId(id);
  };

  /** Level options sorted by priority */
  const levelOptions =
    useMemo(
      () =>
        filterData?.level
          ?.slice()
          .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0)) ?? [],
      [filterData],
    ) ?? [];

  /** Clear only the course-type selection (back to "All"). */
  const resetCourseType = () => {
    setSelectedMenuId(null);
    setSelectedSubmenuId(null);
    setExpandedMenus({});
  };

  /** Clear only the level selection (back to "All"). */
  const resetLevel = () => {
    setSelectedLevelId(null);
  };

  /** Reset all filter and section states */
  const resetFilterState = () => {
    setSelectedMenuId(null);
    setSelectedSubmenuId(null);
    setExpandedMenus({});
    setSelectedPriceId('all');
    setSelectedLevelId(null);
    setShowCourseType(false);
    setShowPriceRange(false);
    setShowLevel(false);
  };

  return {
    filterData,

    showCourseType,
    setShowCourseType,
    expandedMenus,
    selectedMenuId,
    selectedSubmenuId,
    handleMenuPress,
    handleSubmenuPress,
    isMenuSelected,
    isSubmenuSelected,
    resetCourseType,

    showPriceRange,
    setShowPriceRange,
    selectedPriceId,
    handlePricePress,

    showLevel,
    setShowLevel,
    selectedLevelId,
    handleLevelPress,
    resetLevel,
    levelOptions,

    resetFilterState,
  };
};
