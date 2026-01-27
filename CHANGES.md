# Admin Users Page Fixes - FE-114

## Date
2026-01-27

## Changes Summary

### 1. Action Button Dropdown UI Fix
**File**: `/Users/geonho.yeom/workspace/voc-auto-bot-fe-114/frontend/src/components/user/UserTable.tsx`

#### Problem
- Dropdown menu was being clipped by table cell overflow
- Low z-index (z-10) caused dropdown to appear behind other elements
- No click-outside handler to close dropdown

#### Solution
- **Line 84**: Added `overflow-y-visible` to table wrapper to prevent vertical clipping
- **Line 161**: Increased z-index from `z-10` to `z-50` for proper stacking
- **Line 147**: Added `overflow-visible` to table cell
- **Lines 2, 27, 32-45**: Added click-outside handler with useRef and useEffect
- **Line 148**: Attached ref to dropdown container for click-outside detection
- **Lines 152-153**: Added ARIA attributes for accessibility

### 2. Filter Parameter Fix
**File**: `/Users/geonho.yeom/workspace/voc-auto-bot-fe-114/frontend/src/hooks/useUsers.ts`

#### Problem
- Filter parameters with `undefined` values were being passed to API
- This could cause issues with backend parameter parsing

#### Solution
- **Lines 13-15**: Filter out undefined values before passing to API
- Uses `Object.fromEntries()` and `filter()` to clean parameters
- Only defined filter values (role, isActive, search) are sent to backend

## Technical Details

### Dropdown Fix Implementation
```typescript
// Added imports
import { useState, useEffect, useRef } from 'react';

// Added ref and effect
const dropdownRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setActionUserId(null);
    }
  };

  if (actionUserId !== null) {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }
}, [actionUserId]);
```

### Filter Fix Implementation
```typescript
const cleanParams = params ? Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== undefined)
) : undefined;
const response = await api.get<PageResponse<User>>('/users', cleanParams as Record<string, unknown>);
```

## Verification Steps

1. Action dropdown now displays fully without being clipped
2. Dropdown appears above other elements with z-50
3. Clicking outside closes the dropdown
4. Role filter (ADMIN/MANAGER/OPERATOR) works correctly
5. Status filter (active/inactive) works correctly
6. Search filter works correctly
7. Only defined filter parameters are sent to API

## Files Modified
- `/frontend/src/components/user/UserTable.tsx`
- `/frontend/src/hooks/useUsers.ts`

## Accessibility Improvements
- Added `aria-label="액션 메뉴"` to dropdown button
- Added `aria-expanded` state attribute
- Improved keyboard accessibility with proper event handlers

## Quality Checklist
- [x] No business logic in components
- [x] All logic properly separated
- [x] No 'any' types (used proper type casting)
- [x] Accessibility (ARIA) attributes added
- [x] Click-outside behavior handled
- [x] Proper cleanup in useEffect
