## Refactoring Plan

### 1. Create Abstract ItemSelector Component

- **File**: `src/ItemSelector.svelte`
- **Purpose**: Abstract common functionality between category and tag panels
- **Features**:
  - Handle item display, selection, and color management
  - Support add/delete/update/clear operations
  - Use `$props` for data and callbacks
  - Proper CSS alignment with baseline

### 2. Update MyInput Component

- **File**: `src/MyInput.svelte`
- **Changes**:
  - Replace direct state binding with `$bindable` for better data flow
  - Maintain existing functionality while improving component API

### 3. Refactor App.svelte

- **Changes**:
  - Replace duplicate category and tag panel code with `ItemSelector` component
  - Pass appropriate props for categories and tags separately
  - Maintain existing functionality while reducing code duplication

### 4. Add Ctrl+Click Support

- **Feature**: Allow Ctrl+left click to simulate middle click (button=2)
- **Implementation**: Modify mouse event handlers to check for Ctrl key and adjust button value accordingly

### 5. Improve CSS Alignment

- **Changes**:
  - Ensure all buttons and controls are aligned using `align-items: baseline`
  - Use consistent spacing and layout across components

### Expected Benefits

- Reduced code duplication (shared logic in ItemSelector)
- Better component API with proper bindings
- Improved maintainability
- Enhanced user experience with Ctrl+click support
- Consistent visual alignment

This plan will maintain all existing functionality while improving the codebase structure and adding the requested features.
