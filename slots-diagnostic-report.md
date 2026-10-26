# 🧩 Consona Interface: Comprehensive Slots & Factory Diagnostic Report

> **Analysis of `createInterfaceComponent<Props, Slots>`, Slot Declarations, `renderSlot` Dispatches, Config Completeness, and Compound Composites Parity.**

**Generated:** 2026-10-26T13:04:19.269Z  
**Total Factory Components Analyzed:** 632 | **Files with Actionable Fixes:** 0 | **Compound Families:** 140

## 📊 Executive Summary

| Category / Check | Violations / Count | Status |
| :--- | :---: | :---: |
| **1. Missing Slots Generic in Factory** (`<Props>` instead of `<Props, Slots>`) | **0** | ✅ Clean |
| **2. Unused / Unrendered Slots** (Declared in `*Slots` interface but never rendered) | **0** | ✅ Clean |
| **3. Undeclared Slots Dispatched** (`renderSlot` called with undeclared slot key) | **0** | ✅ Clean |
| **4. Missing Keys in `config.slots`** (Declared in interface but omitted in factory config) | **0** | ✅ Clean |
| **5. Missing `slots` / `slotProps` in `*Props` interface** | **0** | ✅ Clean |
| **6. Inline Lambda in `defaultComponent`** (Rule C8.4 violation) | **0** | ✅ Clean |
| **7. Container Subcomponents with 0 Slots Declared** | **69** | ⚠️ Refactor |
| **8. Compound Component Families Audited** | **140** | ℹ️ Audited |

---

## 🌳 Dependency Hierarchy & Fast-Resolution Tree

Execute fixes from bottom-up (**Level 1: Leaf Primitives** ➔ **Level 4: High-Level Module Composites**) to prevent broken slot types and cascading compiler regressions.

### 🏷️ LEVEL 1: Independent Leaf Primitives (Zero internal UI dependencies)

*✅ Clean — No issues in this tier.*

### 🏷️ LEVEL 2: Atomic Primitives & Subcomponents

*✅ Clean — No issues in this tier.*

### 🏷️ LEVEL 3: Mid-Level Composite Widgets

*✅ Clean — No issues in this tier.*

### 🏷️ LEVEL 4: High-Level Module Composites

*✅ Clean — No issues in this tier.*

---

## 1. Missing Slots Generic in Factory (`<Props, Slots>`)

✅ *No components missing slots generic.*

## 2. Unused / Unrendered Slots (Declared but not dispatched)

✅ *All declared slots are actively dispatched or referenced in JSX.*

## 3. Undeclared Slots Dispatched via `renderSlot`

✅ *No undeclared slots dispatched.*

## 4. Missing Slots in Factory `config.slots`

✅ *All declared slots are registered in factory `config.slots`.*

## 5. Missing `slots` / `slotProps` in `*Props` Interface

✅ *All props interfaces declare `slots` and `slotProps` properly.*

## 6. Inline Lambda in `defaultComponent` (Rule C8.4)

✅ *Zero inline lambdas in defaultComponent (all pass stable component identifiers).*

## 7. Container Subcomponents with 0 Slots Declared

| File | Component | Line | Action Needed |
| :--- | :--- | :---: | :--- |
| [`src/modules/charts/components/chart-container/chart-container.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/chart-container/chart-container.tsx#L202) | **`ChartHeader`** | [L202](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/chart-container/chart-container.tsx#L202) | Define `ChartHeaderSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/charts/components/chart-container/chart-container.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/chart-container/chart-container.tsx#L319) | **`ChartToolbar`** | [L319](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/chart-container/chart-container.tsx#L319) | Define `ChartToolbarSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/charts/components/chart-container/chart-container.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/chart-container/chart-container.tsx#L1070) | **`ChartFooter`** | [L1070](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/chart-container/chart-container.tsx#L1070) | Define `ChartFooterSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/accordion/accordion.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/accordion/accordion.tsx#L418) | **`AccordionContent`** | [L418](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/accordion/accordion.tsx#L418) | Define `AccordionContentSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/avatar/avatar.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/avatar/avatar.tsx#L306) | **`AvatarGroup`** | [L306](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/avatar/avatar.tsx#L306) | Define `AvatarGroupSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/button/button.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/button/button.tsx#L389) | **`ButtonGroup`** | [L389](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/button/button.tsx#L389) | Define `ButtonGroupSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/button/expand-button.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/button/expand-button.tsx#L304) | **`ExpandButtonContent`** | [L304](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/button/expand-button.tsx#L304) | Define `ExpandButtonContentSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/calendar/calendar.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/calendar/calendar.tsx#L261) | **`CalendarHeaderCell`** | [L261](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/calendar/calendar.tsx#L261) | Define `CalendarHeaderCellSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/calendar/calendar.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/calendar/calendar.tsx#L425) | **`CalendarGridHeader`** | [L425](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/calendar/calendar.tsx#L425) | Define `CalendarGridHeaderSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/calendar/calendar.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/calendar/calendar.tsx#L444) | **`CalendarGridBody`** | [L444](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/calendar/calendar.tsx#L444) | Define `CalendarGridBodySlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/card/card.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/card/card.tsx#L165) | **`CardHeader`** | [L165](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/card/card.tsx#L165) | Define `CardHeaderSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/card/card.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/card/card.tsx#L195) | **`CardTitle`** | [L195](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/card/card.tsx#L195) | Define `CardTitleSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/card/card.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/card/card.tsx#L220) | **`CardDescription`** | [L220](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/card/card.tsx#L220) | Define `CardDescriptionSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/card/card.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/card/card.tsx#L245) | **`CardContent`** | [L245](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/card/card.tsx#L245) | Define `CardContentSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/card/card.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/card/card.tsx#L270) | **`CardFooter`** | [L270](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/card/card.tsx#L270) | Define `CardFooterSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/card/card.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/card/card.tsx#L296) | **`CardAction`** | [L296](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/card/card.tsx#L296) | Define `CardActionSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/chapter-scrubber/chapter-scrubber.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/chapter-scrubber/chapter-scrubber.tsx#L267) | **`ChapterScrubberCard`** | [L267](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/chapter-scrubber/chapter-scrubber.tsx#L267) | Define `ChapterScrubberCardSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/checkbox/checkbox.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/checkbox/checkbox.tsx#L40) | **`CheckboxGroup`** | [L40](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/checkbox/checkbox.tsx#L40) | Define `CheckboxGroupSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/command-menu/command-menu.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/command-menu/command-menu.tsx#L310) | **`CommandMenuList`** | [L310](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/command-menu/command-menu.tsx#L310) | Define `CommandMenuListSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/command-menu/command-menu.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/command-menu/command-menu.tsx#L360) | **`CommandMenuSection`** | [L360](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/command-menu/command-menu.tsx#L360) | Define `CommandMenuSectionSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/command-menu/command-menu.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/command-menu/command-menu.tsx#L518) | **`CommandMenuFooter`** | [L518](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/command-menu/command-menu.tsx#L518) | Define `CommandMenuFooterSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/context-menu/context-menu.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/context-menu/context-menu.tsx#L152) | **`ContextMenuContent`** | [L152](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/context-menu/context-menu.tsx#L152) | Define `ContextMenuContentSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/data-table/data-table.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/data-table/data-table.tsx#L908) | **`DataTableToolbarActions`** | [L908](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/data-table/data-table.tsx#L908) | Define `DataTableToolbarActionsSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/data-table/data-table.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/data-table/data-table.tsx#L1240) | **`DataTableHeaderCell`** | [L1240](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/data-table/data-table.tsx#L1240) | Define `DataTableHeaderCellSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/data-table/data-table.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/data-table/data-table.tsx#L1712) | **`DataTableContainer`** | [L1712](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/data-table/data-table.tsx#L1712) | Define `DataTableContainerSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/diff-viewer/diff-viewer.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/diff-viewer/diff-viewer.tsx#L418) | **`DiffViewerHeader`** | [L418](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/diff-viewer/diff-viewer.tsx#L418) | Define `DiffViewerHeaderSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/diff-viewer/diff-viewer.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/diff-viewer/diff-viewer.tsx#L659) | **`DiffViewerContent`** | [L659](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/diff-viewer/diff-viewer.tsx#L659) | Define `DiffViewerContentSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/drawer/drawer.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/drawer/drawer.tsx#L281) | **`DrawerHeader`** | [L281](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/drawer/drawer.tsx#L281) | Define `DrawerHeaderSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/drawer/drawer.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/drawer/drawer.tsx#L347) | **`DrawerBody`** | [L347](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/drawer/drawer.tsx#L347) | Define `DrawerBodySlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/drawer/drawer.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/drawer/drawer.tsx#L371) | **`DrawerFooter`** | [L371](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/drawer/drawer.tsx#L371) | Define `DrawerFooterSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/field/field.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/field/field.tsx#L189) | **`FieldGroup`** | [L189](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/field/field.tsx#L189) | Define `FieldGroupSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/grid-list/grid-list.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/grid-list/grid-list.tsx#L98) | **`GridListSection`** | [L98](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/grid-list/grid-list.tsx#L98) | Define `GridListSectionSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/grid-list/grid-list.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/grid-list/grid-list.tsx#L128) | **`GridListHeader`** | [L128](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/grid-list/grid-list.tsx#L128) | Define `GridListHeaderSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/grid-list/grid-list.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/grid-list/grid-list.tsx#L272) | **`GridListEmptyState`** | [L272](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/grid-list/grid-list.tsx#L272) | Define `GridListEmptyStateSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/grid-list/grid-list.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/grid-list/grid-list.tsx#L290) | **`GridListSpacer`** | [L290](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/grid-list/grid-list.tsx#L290) | Define `GridListSpacerSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/grid-list/grid-list.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/grid-list/grid-list.tsx#L315) | **`GridListStart`** | [L315](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/grid-list/grid-list.tsx#L315) | Define `GridListStartSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/grid-list/grid-list.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/grid-list/grid-list.tsx#L333) | **`GridListLabel`** | [L333](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/grid-list/grid-list.tsx#L333) | Define `GridListLabelSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/grid-list/grid-list.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/grid-list/grid-list.tsx#L353) | **`GridListDescription`** | [L353](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/grid-list/grid-list.tsx#L353) | Define `GridListDescriptionSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/input/input.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/input/input.tsx#L122) | **`InputGroup`** | [L122](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/input/input.tsx#L122) | Define `InputGroupSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/input-otp/input-otp.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/input-otp/input-otp.tsx#L111) | **`InputOTPGroup`** | [L111](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/input-otp/input-otp.tsx#L111) | Define `InputOTPGroupSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/layout/layout.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/layout/layout.tsx#L58) | **`Container`** | [L58](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/layout/layout.tsx#L58) | Define `ContainerSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/menu/menu.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/menu/menu.tsx#L280) | **`MenuSection`** | [L280](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/menu/menu.tsx#L280) | Define `MenuSectionSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/menu/menu.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/menu/menu.tsx#L308) | **`MenuHeader`** | [L308](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/menu/menu.tsx#L308) | Define `MenuHeaderSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/meter/meter.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/meter/meter.tsx#L227) | **`MeterHeader`** | [L227](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/meter/meter.tsx#L227) | Define `MeterHeaderSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/modal/modal.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/modal/modal.tsx#L239) | **`ModalHeader`** | [L239](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/modal/modal.tsx#L239) | Define `ModalHeaderSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/modal/modal.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/modal/modal.tsx#L306) | **`ModalBody`** | [L306](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/modal/modal.tsx#L306) | Define `ModalBodySlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/modal/modal.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/modal/modal.tsx#L331) | **`ModalFooter`** | [L331](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/modal/modal.tsx#L331) | Define `ModalFooterSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/pagination/pagination.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/pagination/pagination.tsx#L240) | **`PaginationSection`** | [L240](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/pagination/pagination.tsx#L240) | Define `PaginationSectionSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/pagination-sections/pagination-sections.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/pagination-sections/pagination-sections.tsx#L307) | **`PaginatedSectionPagination`** | [L307](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/pagination-sections/pagination-sections.tsx#L307) | Define `PaginatedSectionPaginationSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/popover/popover.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/popover/popover.tsx#L292) | **`PopoverHeader`** | [L292](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/popover/popover.tsx#L292) | Define `PopoverHeaderSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/popover/popover.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/popover/popover.tsx#L359) | **`PopoverFooter`** | [L359](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/popover/popover.tsx#L359) | Define `PopoverFooterSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/progress/progress.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/progress/progress.tsx#L197) | **`ProgressHeader`** | [L197](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/progress/progress.tsx#L197) | Define `ProgressHeaderSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/radio/radio.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/radio/radio.tsx#L41) | **`RadioGroup`** | [L41](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/radio/radio.tsx#L41) | Define `RadioGroupSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/select/select.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/select/select.tsx#L389) | **`ListBox`** | [L389](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/select/select.tsx#L389) | Define `ListBoxSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/select/select.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/select/select.tsx#L464) | **`ListBoxItem`** | [L464](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/select/select.tsx#L464) | Define `ListBoxItemSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/select/select.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/select/select.tsx#L506) | **`ListBoxSection`** | [L506](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/select/select.tsx#L506) | Define `ListBoxSectionSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/select/select.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/select/select.tsx#L531) | **`ListBoxSeparator`** | [L531](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/select/select.tsx#L531) | Define `ListBoxSeparatorSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/sidebar/sidebar.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/sidebar/sidebar.tsx#L604) | **`SidebarHeader`** | [L604](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/sidebar/sidebar.tsx#L604) | Define `SidebarHeaderSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/sidebar/sidebar.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/sidebar/sidebar.tsx#L635) | **`SidebarFooter`** | [L635](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/sidebar/sidebar.tsx#L635) | Define `SidebarFooterSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/slider/slider.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/slider/slider.tsx#L35) | **`SliderGroup`** | [L35](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/slider/slider.tsx#L35) | Define `SliderGroupSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/snippet/snippet.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/snippet/snippet.tsx#L306) | **`SnippetTabList`** | [L306](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/snippet/snippet.tsx#L306) | Define `SnippetTabListSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/split-pane/split-pane.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/split-pane/split-pane.tsx#L543) | **`SplitPaneFirst`** | [L543](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/split-pane/split-pane.tsx#L543) | Define `SplitPaneFirstSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/split-pane/split-pane.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/split-pane/split-pane.tsx#L559) | **`SplitPaneSecond`** | [L559](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/split-pane/split-pane.tsx#L559) | Define `SplitPaneSecondSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/table/table.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/table/table.tsx#L733) | **`TableFooter`** | [L733](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/table/table.tsx#L733) | Define `TableFooterSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/tabs/tabs.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/tabs/tabs.tsx#L416) | **`TabList`** | [L416](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/tabs/tabs.tsx#L416) | Define `TabListSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/core/components/tooltip/tooltip.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/tooltip/tooltip.tsx#L215) | **`TooltipContent`** | [L215](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/tooltip/tooltip.tsx#L215) | Define `TooltipContentSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/gantt/components/gantt-toolbar/gantt-toolbar.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/gantt/components/gantt-toolbar/gantt-toolbar.tsx#L354) | **`GanttToolbarSearch`** | [L354](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/gantt/components/gantt-toolbar/gantt-toolbar.tsx#L354) | Define `GanttToolbarSearchSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/gantt/components/gantt-toolbar/gantt-toolbar.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/gantt/components/gantt-toolbar/gantt-toolbar.tsx#L391) | **`GanttToolbarFilterTrigger`** | [L391](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/gantt/components/gantt-toolbar/gantt-toolbar.tsx#L391) | Define `GanttToolbarFilterTriggerSlots`, pass generic to factory, and wire fallback slots |
| [`src/modules/gantt/components/gantt-toolbar/gantt-toolbar.tsx`](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/gantt/components/gantt-toolbar/gantt-toolbar.tsx#L515) | **`GanttToolbarFilterPopover`** | [L515](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/gantt/components/gantt-toolbar/gantt-toolbar.tsx#L515) | Define `GanttToolbarFilterPopoverSlots`, pass generic to factory, and wire fallback slots |

## 8. Compound Component Families Anatomy & Slots Surface

### 📦 `AreaChart` — [src/modules/charts/components/area-chart/area-chart.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/area-chart/area-chart.tsx#L475)

- **Root Slots (10):** `container`, `canvas`, `chart`, `header`, `toolbar`, `legend`, `tooltip`, `empty`, `loading`, `footer`
- **Subcomponents Attached (10):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `AreaChart.Provider` | **`AreaChartProvider`** | 0 | *none* | *none* |
| `AreaChart.Container` | **`ChartContainer`** | 2 | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` |
| `AreaChart.Header` | **`ChartHeader`** | 1 | *none* | *none* |
| `AreaChart.Toolbar` | **`ChartToolbar`** | 1 | *none* | *none* |
| `AreaChart.Legend` | **`ChartLegend`** | 1 | *none* | *none* |
| `AreaChart.Canvas` | **`ChartCanvas`** | 1 | *none* | *none* |
| `AreaChart.Tooltip` | **`ChartTooltip`** | 1 | *none* | *none* |
| `AreaChart.Empty` | **`ChartEmptyState`** | 1 | *none* | *none* |
| `AreaChart.Loading` | **`ChartLoadingState`** | 1 | *none* | *none* |
| `AreaChart.Footer` | **`ChartFooter`** | 1 | *none* | *none* |

### 📦 `BarChart` — [src/modules/charts/components/bar-chart/bar-chart.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/bar-chart/bar-chart.tsx#L526)

- **Root Slots (11):** `container`, `canvas`, `chart`, `item`, `header`, `toolbar`, `legend`, `tooltip`, `empty`, `loading`, `footer`
- **Subcomponents Attached (13):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `BarChart.Provider` | **`BarChartProvider`** | 0 | *none* | *none* |
| `BarChart.Container` | **`ChartContainer`** | 2 | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` |
| `BarChart.Header` | **`ChartHeader`** | 1 | *none* | *none* |
| `BarChart.Toolbar` | **`ChartToolbar`** | 1 | *none* | *none* |
| `BarChart.Legend` | **`ChartLegend`** | 1 | *none* | *none* |
| `BarChart.Canvas` | **`ChartCanvas`** | 1 | *none* | *none* |
| `BarChart.Tooltip` | **`ChartTooltip`** | 1 | *none* | *none* |
| `BarChart.Empty` | **`ChartEmptyState`** | 1 | *none* | *none* |
| `BarChart.Loading` | **`ChartLoadingState`** | 1 | *none* | *none* |
| `BarChart.Footer` | **`ChartFooter`** | 1 | *none* | *none* |
| `BarChart.Item` | **`BarChartItem`** | 0 | *none* | *none* |
| `BarChart.TopRounded` | **`TopRoundedBarItem`** | 0 | *none* | *none* |
| `BarChart.RightRounded` | **`RightRoundedBarItem`** | 0 | *none* | *none* |

### 📦 `BumpChart` — [src/modules/charts/components/bump-chart/bump-chart.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/bump-chart/bump-chart.tsx#L561)

- **Root Slots (10):** `container`, `canvas`, `chart`, `header`, `toolbar`, `legend`, `tooltip`, `empty`, `loading`, `footer`
- **Subcomponents Attached (10):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `BumpChart.Provider` | **`BumpChartProvider`** | 0 | *none* | *none* |
| `BumpChart.Container` | **`ChartContainer`** | 2 | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` |
| `BumpChart.Header` | **`ChartHeader`** | 1 | *none* | *none* |
| `BumpChart.Toolbar` | **`ChartToolbar`** | 1 | *none* | *none* |
| `BumpChart.Legend` | **`ChartLegend`** | 1 | *none* | *none* |
| `BumpChart.Canvas` | **`ChartCanvas`** | 1 | *none* | *none* |
| `BumpChart.Tooltip` | **`ChartTooltip`** | 1 | *none* | *none* |
| `BumpChart.Empty` | **`ChartEmptyState`** | 1 | *none* | *none* |
| `BumpChart.Loading` | **`ChartLoadingState`** | 1 | *none* | *none* |
| `BumpChart.Footer` | **`ChartFooter`** | 1 | *none* | *none* |

### 📦 `CandlestickChart` — [src/modules/charts/components/candlestick-chart/candlestick-chart.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/candlestick-chart/candlestick-chart.tsx#L697)

- **Root Slots (10):** `container`, `canvas`, `chart`, `header`, `toolbar`, `legend`, `tooltip`, `empty`, `loading`, `footer`
- **Subcomponents Attached (10):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `CandlestickChart.Provider` | **`CandlestickChartProvider`** | 0 | *none* | *none* |
| `CandlestickChart.Container` | **`ChartContainer`** | 2 | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` |
| `CandlestickChart.Header` | **`ChartHeader`** | 1 | *none* | *none* |
| `CandlestickChart.Toolbar` | **`ChartToolbar`** | 1 | *none* | *none* |
| `CandlestickChart.Legend` | **`ChartLegend`** | 1 | *none* | *none* |
| `CandlestickChart.Canvas` | **`ChartCanvas`** | 1 | *none* | *none* |
| `CandlestickChart.Tooltip` | **`ChartTooltip`** | 1 | *none* | *none* |
| `CandlestickChart.Empty` | **`ChartEmptyState`** | 1 | *none* | *none* |
| `CandlestickChart.Loading` | **`ChartLoadingState`** | 1 | *none* | *none* |
| `CandlestickChart.Footer` | **`ChartFooter`** | 1 | *none* | *none* |

### 📦 `ChartContainer` — [src/modules/charts/components/chart-container/chart-container.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/chart-container/chart-container.tsx#L111)

- **Root Slots (6):** `header`, `toolbar`, `legend`, `canvas`, `content`, `footer`
- **Subcomponents Attached (11):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `ChartContainer.Header` | **`ChartHeader`** | 1 | *none* | *none* |
| `ChartContainer.Toolbar` | **`ChartToolbar`** | 1 | *none* | *none* |
| `ChartContainer.Legend` | **`ChartLegend`** | 1 | *none* | *none* |
| `ChartContainer.Canvas` | **`ChartCanvas`** | 1 | *none* | *none* |
| `ChartContainer.Tooltip` | **`ChartTooltip`** | 1 | *none* | *none* |
| `ChartContainer.Overlay` | **`CanvasTooltipOverlay`** | 0 | *none* | *none* |
| `ChartContainer.Bridge` | **`ChartTooltipBridge`** | 0 | *none* | *none* |
| `ChartContainer.Empty` | **`ChartEmptyState`** | 1 | *none* | *none* |
| `ChartContainer.Loading` | **`ChartLoadingState`** | 1 | *none* | *none* |
| `ChartContainer.Footer` | **`ChartFooter`** | 1 | *none* | *none* |
| `ChartContainer.ChartToolbar` | **`ChartToolbar`** | 1 | *none* | *none* |

### 📦 `ChartTooltip` — [src/modules/charts/components/chart-container/chart-container.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/chart-container/chart-container.tsx#L665)

- **Root Slots (0):** *none*
- **Subcomponents Attached (7):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `ChartTooltip.Header` | **`ChartTooltipHeader`** | 0 | *none* | *none* |
| `ChartTooltip.Section` | **`ChartTooltipSection`** | 0 | *none* | *none* |
| `ChartTooltip.Row` | **`ChartTooltipRow`** | 0 | *none* | *none* |
| `ChartTooltip.Indicator` | **`ChartTooltipIndicator`** | 0 | *none* | *none* |
| `ChartTooltip.Value` | **`ChartTooltipValue`** | 0 | *none* | *none* |
| `ChartTooltip.Badge` | **`ChartTooltipBadge`** | 0 | *none* | *none* |
| `ChartTooltip.Bridge` | **`ChartTooltipBridge`** | 0 | *none* | *none* |

### 📦 `ChartCanvas` — [src/modules/charts/components/chart-container/chart-container.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/chart-container/chart-container.tsx#L935)

- **Root Slots (0):** *none*
- **Subcomponents Attached (1):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `ChartCanvas.Overlay` | **`CanvasTooltipOverlay`** | 0 | *none* | *none* |

### 📦 `ChordChart` — [src/modules/charts/components/chord-chart/chord-chart.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/chord-chart/chord-chart.tsx#L417)

- **Root Slots (10):** `container`, `canvas`, `chart`, `header`, `toolbar`, `legend`, `tooltip`, `empty`, `loading`, `footer`
- **Subcomponents Attached (10):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `ChordChart.Provider` | **`ChordChartProvider`** | 0 | *none* | *none* |
| `ChordChart.Container` | **`ChartContainer`** | 2 | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` |
| `ChordChart.Header` | **`ChartHeader`** | 1 | *none* | *none* |
| `ChordChart.Toolbar` | **`ChartToolbar`** | 1 | *none* | *none* |
| `ChordChart.Legend` | **`ChartLegend`** | 1 | *none* | *none* |
| `ChordChart.Canvas` | **`ChartCanvas`** | 1 | *none* | *none* |
| `ChordChart.Tooltip` | **`ChartTooltip`** | 1 | *none* | *none* |
| `ChordChart.Empty` | **`ChartEmptyState`** | 1 | *none* | *none* |
| `ChordChart.Loading` | **`ChartLoadingState`** | 1 | *none* | *none* |
| `ChordChart.Footer` | **`ChartFooter`** | 1 | *none* | *none* |

### 📦 `FunnelChart` — [src/modules/charts/components/funnel-chart/funnel-chart.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/funnel-chart/funnel-chart.tsx#L454)

- **Root Slots (10):** `container`, `canvas`, `chart`, `header`, `toolbar`, `legend`, `tooltip`, `empty`, `loading`, `footer`
- **Subcomponents Attached (10):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `FunnelChart.Provider` | **`FunnelChartProvider`** | 0 | *none* | *none* |
| `FunnelChart.Container` | **`ChartContainer`** | 2 | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` |
| `FunnelChart.Header` | **`ChartHeader`** | 1 | *none* | *none* |
| `FunnelChart.Toolbar` | **`ChartToolbar`** | 1 | *none* | *none* |
| `FunnelChart.Legend` | **`ChartLegend`** | 1 | *none* | *none* |
| `FunnelChart.Canvas` | **`ChartCanvas`** | 1 | *none* | *none* |
| `FunnelChart.Tooltip` | **`ChartTooltip`** | 1 | *none* | *none* |
| `FunnelChart.Empty` | **`ChartEmptyState`** | 1 | *none* | *none* |
| `FunnelChart.Loading` | **`ChartLoadingState`** | 1 | *none* | *none* |
| `FunnelChart.Footer` | **`ChartFooter`** | 1 | *none* | *none* |

### 📦 `HeatmapChart` — [src/modules/charts/components/heatmap-chart/heatmap-chart.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/heatmap-chart/heatmap-chart.tsx#L417)

- **Root Slots (11):** `container`, `canvas`, `chart`, `header`, `toolbar`, `legend`, `tooltip`, `item`, `empty`, `loading`, `footer`
- **Subcomponents Attached (10):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `HeatmapChart.Provider` | **`HeatmapChartProvider`** | 0 | *none* | *none* |
| `HeatmapChart.Container` | **`ChartContainer`** | 2 | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` |
| `HeatmapChart.Header` | **`ChartHeader`** | 1 | *none* | *none* |
| `HeatmapChart.Toolbar` | **`ChartToolbar`** | 1 | *none* | *none* |
| `HeatmapChart.Legend` | **`ChartLegend`** | 1 | *none* | *none* |
| `HeatmapChart.Canvas` | **`ChartCanvas`** | 1 | *none* | *none* |
| `HeatmapChart.Tooltip` | **`ChartTooltip`** | 1 | *none* | *none* |
| `HeatmapChart.Empty` | **`ChartEmptyState`** | 1 | *none* | *none* |
| `HeatmapChart.Loading` | **`ChartLoadingState`** | 1 | *none* | *none* |
| `HeatmapChart.Footer` | **`ChartFooter`** | 1 | *none* | *none* |

### 📦 `LineChart` — [src/modules/charts/components/line-chart/line-chart.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/line-chart/line-chart.tsx#L461)

- **Root Slots (10):** `container`, `canvas`, `chart`, `header`, `toolbar`, `legend`, `tooltip`, `empty`, `loading`, `footer`
- **Subcomponents Attached (10):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `LineChart.Provider` | **`LineChartProvider`** | 0 | *none* | *none* |
| `LineChart.Container` | **`ChartContainer`** | 2 | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` |
| `LineChart.Header` | **`ChartHeader`** | 1 | *none* | *none* |
| `LineChart.Toolbar` | **`ChartToolbar`** | 1 | *none* | *none* |
| `LineChart.Legend` | **`ChartLegend`** | 1 | *none* | *none* |
| `LineChart.Canvas` | **`ChartCanvas`** | 1 | *none* | *none* |
| `LineChart.Tooltip` | **`ChartTooltip`** | 1 | *none* | *none* |
| `LineChart.Empty` | **`ChartEmptyState`** | 1 | *none* | *none* |
| `LineChart.Loading` | **`ChartLoadingState`** | 1 | *none* | *none* |
| `LineChart.Footer` | **`ChartFooter`** | 1 | *none* | *none* |

### 📦 `PieChart` — [src/modules/charts/components/pie-chart/pie-chart.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/pie-chart/pie-chart.tsx#L551)

- **Root Slots (11):** `container`, `canvas`, `chart`, `header`, `toolbar`, `legend`, `centerMetric`, `tooltip`, `empty`, `loading`, `footer`
- **Subcomponents Attached (11):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `PieChart.Provider` | **`PieChartProvider`** | 0 | *none* | *none* |
| `PieChart.Container` | **`ChartContainer`** | 2 | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` |
| `PieChart.Header` | **`ChartHeader`** | 1 | *none* | *none* |
| `PieChart.Toolbar` | **`ChartToolbar`** | 1 | *none* | *none* |
| `PieChart.Legend` | **`ChartLegend`** | 1 | *none* | *none* |
| `PieChart.Canvas` | **`ChartCanvas`** | 1 | *none* | *none* |
| `PieChart.CenterMetric` | **`PieCenterMetric`** | 1 | *none* | *none* |
| `PieChart.Tooltip` | **`ChartTooltip`** | 1 | *none* | *none* |
| `PieChart.Empty` | **`ChartEmptyState`** | 1 | *none* | *none* |
| `PieChart.Loading` | **`ChartLoadingState`** | 1 | *none* | *none* |
| `PieChart.Footer` | **`ChartFooter`** | 1 | *none* | *none* |

### 📦 `RadarChart` — [src/modules/charts/components/radar-chart/radar-chart.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/radar-chart/radar-chart.tsx#L465)

- **Root Slots (10):** `container`, `canvas`, `chart`, `header`, `toolbar`, `legend`, `tooltip`, `empty`, `loading`, `footer`
- **Subcomponents Attached (10):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `RadarChart.Provider` | **`RadarChartProvider`** | 0 | *none* | *none* |
| `RadarChart.Container` | **`ChartContainer`** | 2 | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` |
| `RadarChart.Header` | **`ChartHeader`** | 1 | *none* | *none* |
| `RadarChart.Toolbar` | **`ChartToolbar`** | 1 | *none* | *none* |
| `RadarChart.Legend` | **`ChartLegend`** | 1 | *none* | *none* |
| `RadarChart.Canvas` | **`ChartCanvas`** | 1 | *none* | *none* |
| `RadarChart.Tooltip` | **`ChartTooltip`** | 1 | *none* | *none* |
| `RadarChart.Empty` | **`ChartEmptyState`** | 1 | *none* | *none* |
| `RadarChart.Loading` | **`ChartLoadingState`** | 1 | *none* | *none* |
| `RadarChart.Footer` | **`ChartFooter`** | 1 | *none* | *none* |

### 📦 `RadialBarChart` — [src/modules/charts/components/radial-bar-chart/radial-bar-chart.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/radial-bar-chart/radial-bar-chart.tsx#L467)

- **Root Slots (10):** `container`, `canvas`, `chart`, `header`, `toolbar`, `legend`, `tooltip`, `empty`, `loading`, `footer`
- **Subcomponents Attached (10):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `RadialBarChart.Provider` | **`RadialBarChartProvider`** | 0 | *none* | *none* |
| `RadialBarChart.Container` | **`ChartContainer`** | 2 | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` |
| `RadialBarChart.Header` | **`ChartHeader`** | 1 | *none* | *none* |
| `RadialBarChart.Toolbar` | **`ChartToolbar`** | 1 | *none* | *none* |
| `RadialBarChart.Legend` | **`ChartLegend`** | 1 | *none* | *none* |
| `RadialBarChart.Canvas` | **`ChartCanvas`** | 1 | *none* | *none* |
| `RadialBarChart.Tooltip` | **`ChartTooltip`** | 1 | *none* | *none* |
| `RadialBarChart.Empty` | **`ChartEmptyState`** | 1 | *none* | *none* |
| `RadialBarChart.Loading` | **`ChartLoadingState`** | 1 | *none* | *none* |
| `RadialBarChart.Footer` | **`ChartFooter`** | 1 | *none* | *none* |

### 📦 `SankeyChart` — [src/modules/charts/components/sankey-chart/sankey-chart.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/sankey-chart/sankey-chart.tsx#L462)

- **Root Slots (10):** `container`, `canvas`, `chart`, `header`, `toolbar`, `legend`, `tooltip`, `empty`, `loading`, `footer`
- **Subcomponents Attached (10):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `SankeyChart.Provider` | **`SankeyChartProvider`** | 0 | *none* | *none* |
| `SankeyChart.Container` | **`ChartContainer`** | 2 | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` |
| `SankeyChart.Header` | **`ChartHeader`** | 1 | *none* | *none* |
| `SankeyChart.Toolbar` | **`ChartToolbar`** | 1 | *none* | *none* |
| `SankeyChart.Legend` | **`ChartLegend`** | 1 | *none* | *none* |
| `SankeyChart.Canvas` | **`ChartCanvas`** | 1 | *none* | *none* |
| `SankeyChart.Tooltip` | **`ChartTooltip`** | 1 | *none* | *none* |
| `SankeyChart.Empty` | **`ChartEmptyState`** | 1 | *none* | *none* |
| `SankeyChart.Loading` | **`ChartLoadingState`** | 1 | *none* | *none* |
| `SankeyChart.Footer` | **`ChartFooter`** | 1 | *none* | *none* |

### 📦 `ScatterChart` — [src/modules/charts/components/scatter-chart/scatter-chart.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/scatter-chart/scatter-chart.tsx#L451)

- **Root Slots (11):** `container`, `canvas`, `chart`, `item`, `header`, `toolbar`, `legend`, `tooltip`, `empty`, `loading`, `footer`
- **Subcomponents Attached (10):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `ScatterChart.Provider` | **`ScatterChartProvider`** | 0 | *none* | *none* |
| `ScatterChart.Container` | **`ChartContainer`** | 2 | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` |
| `ScatterChart.Header` | **`ChartHeader`** | 1 | *none* | *none* |
| `ScatterChart.Toolbar` | **`ChartToolbar`** | 1 | *none* | *none* |
| `ScatterChart.Legend` | **`ChartLegend`** | 1 | *none* | *none* |
| `ScatterChart.Canvas` | **`ChartCanvas`** | 1 | *none* | *none* |
| `ScatterChart.Tooltip` | **`ChartTooltip`** | 1 | *none* | *none* |
| `ScatterChart.Empty` | **`ChartEmptyState`** | 1 | *none* | *none* |
| `ScatterChart.Loading` | **`ChartLoadingState`** | 1 | *none* | *none* |
| `ScatterChart.Footer` | **`ChartFooter`** | 1 | *none* | *none* |

### 📦 `StreamChart` — [src/modules/charts/components/stream-chart/stream-chart.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/stream-chart/stream-chart.tsx#L485)

- **Root Slots (10):** `container`, `canvas`, `chart`, `header`, `toolbar`, `legend`, `tooltip`, `empty`, `loading`, `footer`
- **Subcomponents Attached (10):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `StreamChart.Provider` | **`StreamChartProvider`** | 0 | *none* | *none* |
| `StreamChart.Container` | **`ChartContainer`** | 2 | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` |
| `StreamChart.Header` | **`ChartHeader`** | 1 | *none* | *none* |
| `StreamChart.Toolbar` | **`ChartToolbar`** | 1 | *none* | *none* |
| `StreamChart.Legend` | **`ChartLegend`** | 1 | *none* | *none* |
| `StreamChart.Canvas` | **`ChartCanvas`** | 1 | *none* | *none* |
| `StreamChart.Tooltip` | **`ChartTooltip`** | 1 | *none* | *none* |
| `StreamChart.Empty` | **`ChartEmptyState`** | 1 | *none* | *none* |
| `StreamChart.Loading` | **`ChartLoadingState`** | 1 | *none* | *none* |
| `StreamChart.Footer` | **`ChartFooter`** | 1 | *none* | *none* |

### 📦 `SunburstChart` — [src/modules/charts/components/sunburst-chart/sunburst-chart.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/sunburst-chart/sunburst-chart.tsx#L440)

- **Root Slots (10):** `container`, `canvas`, `chart`, `header`, `toolbar`, `legend`, `tooltip`, `empty`, `loading`, `footer`
- **Subcomponents Attached (10):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `SunburstChart.Provider` | **`SunburstChartProvider`** | 0 | *none* | *none* |
| `SunburstChart.Container` | **`ChartContainer`** | 2 | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` |
| `SunburstChart.Header` | **`ChartHeader`** | 1 | *none* | *none* |
| `SunburstChart.Toolbar` | **`ChartToolbar`** | 1 | *none* | *none* |
| `SunburstChart.Legend` | **`ChartLegend`** | 1 | *none* | *none* |
| `SunburstChart.Canvas` | **`ChartCanvas`** | 1 | *none* | *none* |
| `SunburstChart.Tooltip` | **`ChartTooltip`** | 1 | *none* | *none* |
| `SunburstChart.Empty` | **`ChartEmptyState`** | 1 | *none* | *none* |
| `SunburstChart.Loading` | **`ChartLoadingState`** | 1 | *none* | *none* |
| `SunburstChart.Footer` | **`ChartFooter`** | 1 | *none* | *none* |

### 📦 `TreemapChart` — [src/modules/charts/components/treemap-chart/treemap-chart.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/charts/components/treemap-chart/treemap-chart.tsx#L457)

- **Root Slots (11):** `container`, `canvas`, `chart`, `item`, `header`, `toolbar`, `legend`, `tooltip`, `empty`, `loading`, `footer`
- **Subcomponents Attached (10):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `TreemapChart.Provider` | **`TreemapChartProvider`** | 0 | *none* | *none* |
| `TreemapChart.Container` | **`ChartContainer`** | 2 | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` | `header`, `toolbar`, `legend`, `canvas`, `content`, `footer` |
| `TreemapChart.Header` | **`ChartHeader`** | 1 | *none* | *none* |
| `TreemapChart.Toolbar` | **`ChartToolbar`** | 1 | *none* | *none* |
| `TreemapChart.Legend` | **`ChartLegend`** | 1 | *none* | *none* |
| `TreemapChart.Canvas` | **`ChartCanvas`** | 1 | *none* | *none* |
| `TreemapChart.Tooltip` | **`ChartTooltip`** | 1 | *none* | *none* |
| `TreemapChart.Empty` | **`ChartEmptyState`** | 1 | *none* | *none* |
| `TreemapChart.Loading` | **`ChartLoadingState`** | 1 | *none* | *none* |
| `TreemapChart.Footer` | **`ChartFooter`** | 1 | *none* | *none* |

### 📦 `OrbAudioPlayer` — [src/modules/composites/components/orb-audio-player/orb-audio-player.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/composites/components/orb-audio-player/orb-audio-player.tsx#L650)

- **Root Slots (8):** `artwork`, `trackInfo`, `timeline`, `playButton`, `speedDropdown`, `muteButton`, `volumeSlider`, `footer`
- **Subcomponents Attached (12):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `OrbAudioPlayer.Orb` | **`ReactiveOrb`** | 0 | *none* | *none* |
| `OrbAudioPlayer.Artwork` | **`OrbAudioArtwork`** | 0 | *none* | *none* |
| `OrbAudioPlayer.PlayButton` | **`AudioPlayerPlayButton`** | 2 | `playIcon`, `pauseIcon` | `playIcon`, `pauseIcon` |
| `OrbAudioPlayer.Timeline` | **`AudioTimeline`** | 2 | `container`, `timestamp` | `timestamp`, `timestamp`, `timestamp`, `timestamp`, `container` |
| `OrbAudioPlayer.TrackInfo` | **`AudioPlayerTrackInfo`** | 2 | `wrapper`, `artwork` | `artwork`, `wrapper` |
| `OrbAudioPlayer.Scrubber` | **`AudioPlayerScrubber`** | 2 | `scrubBar` | `scrubBar` |
| `OrbAudioPlayer.Time` | **`AudioPlayerTime`** | 2 | `wrapper` | `wrapper` |
| `OrbAudioPlayer.Duration` | **`AudioPlayerDuration`** | 2 | `wrapper` | `wrapper` |
| `OrbAudioPlayer.MuteButton` | **`AudioPlayerMuteButton`** | 2 | `soundIcon`, `muteIcon` | `muteIcon`, `soundIcon` |
| `OrbAudioPlayer.VolumeSlider` | **`AudioPlayerVolumeSlider`** | 2 | `wrapper` | `wrapper` |
| `OrbAudioPlayer.SpeedDropdown` | **`AudioPlayerSpeedDropdown`** | 2 | `trigger` | `trigger` |
| `OrbAudioPlayer.Pill` | **`AudioPlayerPill`** | 2 | `playIcon`, `pauseIcon`, `artwork` | `artwork`, `playIcon`, `pauseIcon`, `artwork`, `playIcon`, `pauseIcon` |

### 📦 `Accordion` — [src/modules/core/components/accordion/accordion.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/accordion/accordion.tsx#L130)

- **Root Slots (0):** *none*
- **Subcomponents Attached (6):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Accordion.Provider` | **`AccordionProvider`** | 0 | *none* | *none* |
| `Accordion.Item` | **`AccordionItem`** | 2 | `trigger`, `content` | `trigger`, `content` |
| `Accordion.Trigger` | **`AccordionTrigger`** | 1 | *none* | *none* |
| `Accordion.Heading` | **`AccordionHeading`** | 1 | *none* | *none* |
| `Accordion.Content` | **`AccordionContent`** | 1 | *none* | *none* |
| `Accordion.Collapsible` | **`Collapsible`** | 0 | *none* | *none* |

### 📦 `Avatar` — [src/modules/core/components/avatar/avatar.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/avatar/avatar.tsx#L209)

- **Root Slots (2):** `badge`, `fallback`
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Avatar.Badge` | **`AvatarBadge`** | 1 | *none* | *none* |
| `Avatar.Group` | **`AvatarGroup`** | 1 | *none* | *none* |

### 📦 `Badge` — [src/modules/core/components/badge/badge.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/badge/badge.tsx#L107)

- **Root Slots (1):** `icon`
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Badge.Tag` | **`Tag`** | 0 | *none* | *none* |
| `Badge.Chip` | **`Chip`** | 0 | *none* | *none* |

### 📦 `BentoGrid` — [src/modules/core/components/bento-grid/bento-grid.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/bento-grid/bento-grid.tsx#L705)

- **Root Slots (2):** `header`, `footer`
- **Subcomponents Attached (3):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `BentoGrid.Card` | **`BentoCard`** | 2 | `header`, `icon`, `badge`, `cta`, `title`, `description`, `footer` | `header`, `icon`, `badge`, `cta`, `title`, `description`, `footer` |
| `BentoGrid.Row` | **`BentoRow`** | 2 | `backdrop` | `backdrop` |
| `BentoGrid.Provider` | **`BentoGridProvider`** | 0 | *none* | *none* |

### 📦 `Breadcrumbs` — [src/modules/core/components/breadcrumbs/breadcrumbs.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/breadcrumbs/breadcrumbs.tsx#L74)

- **Root Slots (0):** *none*
- **Subcomponents Attached (3):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Breadcrumbs.Provider` | **`BreadcrumbsProvider`** | 0 | *none* | *none* |
| `Breadcrumbs.Item` | **`BreadcrumbItem`** | 2 | `icon` | `icon`, `icon` |
| `Breadcrumbs.Separator` | **`BreadcrumbSeparator`** | 1 | *none* | *none* |

### 📦 `Button` — [src/modules/core/components/button/button.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/button/button.tsx#L281)

- **Root Slots (5):** `loader`, `leftIcon`, `rightIcon`, `successIcon`, `errorIcon`
- **Subcomponents Attached (5):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Button.Group` | **`ButtonGroup`** | 1 | *none* | *none* |
| `Button.Toggle` | **`ToggleButton`** | 1 | *none* | *none* |
| `Button.WithIndicator` | **`ButtonWithIndicator`** | 1 | *none* | *none* |
| `Button.Indicator` | **`ButtonWithIndicator`** | 1 | *none* | *none* |
| `Button.Expand` | **`ExpandButton`** | 2 | `trigger`, `content`, `grid`, `chevron` | `trigger`, `chevron`, `content`, `grid` |

### 📦 `ExpandButton` — [src/modules/core/components/button/expand-button.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/button/expand-button.tsx#L613)

- **Root Slots (4):** `trigger`, `content`, `grid`, `chevron`
- **Subcomponents Attached (5):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `ExpandButton.Trigger` | **`ExpandButtonTrigger`** | 1 | *none* | *none* |
| `ExpandButton.Content` | **`ExpandButtonContent`** | 1 | *none* | *none* |
| `ExpandButton.Grid` | **`ExpandButtonGrid`** | 1 | *none* | *none* |
| `ExpandButton.Item` | **`ExpandButtonItem`** | 1 | *none* | *none* |
| `ExpandButton.Field` | **`ExpandButtonItem`** | 1 | *none* | *none* |

### 📦 `Calendar` — [src/modules/core/components/calendar/calendar.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/calendar/calendar.tsx#L971)

- **Root Slots (12):** `header`, `grid`, `monthPicker`, `yearPicker`, `prevButton`, `nextButton`, `heading`, `gridHeader`, `gridBody`, `cell`, `cellIndicator`, `remaining`
- **Subcomponents Attached (12):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Calendar.Header` | **`CalendarHeader`** | 2 | `prevButton`, `nextButton`, `monthPicker`, `yearPicker`, `heading` | `prevButton`, `nextButton`, `monthPicker`, `yearPicker`, `heading` |
| `Calendar.Heading` | **`CalendarHeading`** | 1 | *none* | *none* |
| `Calendar.NavButton` | **`CalendarNavButton`** | 1 | *none* | *none* |
| `Calendar.HeaderCell` | **`CalendarHeaderCell`** | 1 | *none* | *none* |
| `Calendar.GridHeader` | **`CalendarGridHeader`** | 1 | *none* | *none* |
| `Calendar.Grid` | **`CalendarGrid`** | 2 | `header`, `body`, `cell`, `cellIndicator` | `cell`, `header`, `body` |
| `Calendar.GridBody` | **`CalendarGridBody`** | 1 | *none* | *none* |
| `Calendar.Cell` | **`CalendarCell`** | 2 | `indicator` | `indicator` |
| `Calendar.CellIndicator` | **`CalendarCellIndicator`** | 1 | *none* | *none* |
| `Calendar.Remaining` | **`CalendarRemaining`** | 1 | *none* | *none* |
| `Calendar.MonthPicker` | **`CalendarMonthPicker`** | 1 | *none* | *none* |
| `Calendar.YearPicker` | **`CalendarYearPicker`** | 1 | *none* | *none* |

### 📦 `RangeCalendar` — [src/modules/core/components/calendar/range-calendar.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/calendar/range-calendar.tsx#L260)

- **Root Slots (12):** `header`, `grid`, `monthPicker`, `yearPicker`, `prevButton`, `nextButton`, `heading`, `gridHeader`, `gridBody`, `cell`, `cellIndicator`, `remaining`
- **Subcomponents Attached (10):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `RangeCalendar.Header` | **`CalendarHeader`** | 2 | `prevButton`, `nextButton`, `monthPicker`, `yearPicker`, `heading` | `prevButton`, `nextButton`, `monthPicker`, `yearPicker`, `heading` |
| `RangeCalendar.Heading` | **`CalendarHeading`** | 1 | *none* | *none* |
| `RangeCalendar.NavButton` | **`CalendarNavButton`** | 1 | *none* | *none* |
| `RangeCalendar.HeaderCell` | **`CalendarHeaderCell`** | 1 | *none* | *none* |
| `RangeCalendar.Grid` | **`CalendarGrid`** | 2 | `header`, `body`, `cell`, `cellIndicator` | `cell`, `header`, `body` |
| `RangeCalendar.GridHeader` | **`CalendarGridHeader`** | 1 | *none* | *none* |
| `RangeCalendar.GridBody` | **`CalendarGridBody`** | 1 | *none* | *none* |
| `RangeCalendar.Cell` | **`CalendarCell`** | 2 | `indicator` | `indicator` |
| `RangeCalendar.CellIndicator` | **`CalendarCellIndicator`** | 1 | *none* | *none* |
| `RangeCalendar.Remaining` | **`CalendarRemaining`** | 1 | *none* | *none* |

### 📦 `Card` — [src/modules/core/components/card/card.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/card/card.tsx#L115)

- **Root Slots (3):** `header`, `content`, `footer`
- **Subcomponents Attached (7):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Card.Provider` | **`CardProvider`** | 0 | *none* | *none* |
| `Card.Header` | **`CardHeader`** | 1 | *none* | *none* |
| `Card.Title` | **`CardTitle`** | 1 | *none* | *none* |
| `Card.Description` | **`CardDescription`** | 1 | *none* | *none* |
| `Card.Content` | **`CardContent`** | 1 | *none* | *none* |
| `Card.Footer` | **`CardFooter`** | 1 | *none* | *none* |
| `Card.Action` | **`CardAction`** | 1 | *none* | *none* |

### 📦 `Carousel` — [src/modules/core/components/carousel/carousel.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/carousel/carousel.tsx#L755)

- **Root Slots (0):** *none*
- **Subcomponents Attached (11):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Carousel.Provider` | **`CarouselProvider`** | 0 | *none* | *none* |
| `Carousel.Content` | **`CarouselContent`** | 2 | *none* | *none* |
| `Carousel.Item` | **`CarouselItem`** | 2 | *none* | *none* |
| `Carousel.Handler` | **`CarouselHandler`** | 2 | *none* | *none* |
| `Carousel.Button` | **`CarouselButton`** | 2 | *none* | *none* |
| `Carousel.Dots` | **`CarouselDots`** | 2 | *none* | *none* |
| `Carousel.Thumb` | **`CarouselThumb`** | 2 | *none* | *none* |
| `Carousel.Thumbnails` | **`CarouselThumbnails`** | 2 | *none* | *none* |
| `Carousel.Thumbs` | **`CarouselThumbs`** | 0 | *none* | *none* |
| `Carousel.Progress` | **`CarouselProgress`** | 2 | *none* | *none* |
| `Carousel.Counter` | **`CarouselCounter`** | 2 | *none* | *none* |

### 📦 `ChapterScrubber` — [src/modules/core/components/chapter-scrubber/chapter-scrubber.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/chapter-scrubber/chapter-scrubber.tsx#L701)

- **Root Slots (2):** `card`, `tick`
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `ChapterScrubber.Card` | **`ChapterScrubberCard`** | 1 | *none* | *none* |
| `ChapterScrubber.Tick` | **`ChapterScrubberTick`** | 1 | *none* | *none* |

### 📦 `Checkbox` — [src/modules/core/components/checkbox/checkbox.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/checkbox/checkbox.tsx#L175)

- **Root Slots (2):** `checkIcon`, `minusIcon`
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Checkbox.Group` | **`CheckboxGroup`** | 1 | *none* | *none* |
| `Checkbox.Field` | **`CheckboxField`** | 1 | *none* | *none* |

### 📦 `ChoiceBox` — [src/modules/core/components/choice-box/choice-box.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/choice-box/choice-box.tsx#L134)

- **Root Slots (0):** *none*
- **Subcomponents Attached (4):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `ChoiceBox.Provider` | **`ChoiceBoxProvider`** | 0 | *none* | *none* |
| `ChoiceBox.Item` | **`ChoiceBoxItem`** | 2 | `icon`, `avatar` | `avatar`, `avatar`, `icon`, `icon` |
| `ChoiceBox.Label` | **`ChoiceBoxLabel`** | 2 | *none* | *none* |
| `ChoiceBox.Description` | **`ChoiceBoxDescription`** | 2 | *none* | *none* |

### 📦 `Clock` — [src/modules/core/components/clock/clock.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/clock/clock.tsx#L721)

- **Root Slots (5):** `timezone`, `analog`, `digital`, `badge`, `date`
- **Subcomponents Attached (3):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Clock.Analog` | **`ClockAnalog`** | 1 | *none* | *none* |
| `Clock.Digital` | **`ClockDigital`** | 2 | `badge`, `date` | `badge`, `date` |
| `Clock.Timezone` | **`ClockTimezone`** | 1 | *none* | *none* |

### 📦 `ColorArea` — [src/modules/core/components/color/color-area.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/color/color-area.tsx#L93)

- **Root Slots (1):** `thumb`
- **Subcomponents Attached (1):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `ColorArea.Thumb` | **`ColorThumb`** | 2 | *none* | *none* |

### 📦 `Color` — [src/modules/core/components/color/color-control.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/color/color-control.tsx#L334)

- **Root Slots (2):** `trigger`, `picker`
- **Subcomponents Attached (18):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Color.Trigger` | **`ColorTrigger`** | 1 | *none* | *none* |
| `Color.Picker` | **`ColorPicker`** | 2 | `presets`, `createPresetForm`, `area`, `slider`, `alphaSlider`, `field`, `formatInputs`, `gradientEditor`, `imageFill`, `eyeDropper`, `swatch`, `swatchPicker`, `closeIcon` | `createPresetForm`, `closeIcon`, `closeIcon`, `gradientEditor`, `imageFill`, `area`, `slider`, `alphaSlider`, `formatInputs`, `field`, `eyeDropper`, `swatch`, `swatchPicker`, `presets` |
| `Color.Presets` | **`PresetsContainer`** | 2 | `createForm`, `addIcon`, `deleteIcon` | `addIcon`, `deleteIcon`, `createForm`, `addIcon` |
| `Color.CreatePresetForm` | **`CreatePresetForm`** | 2 | `area`, `slider`, `alphaSlider`, `formatInputs`, `gradientEditor`, `nameInput`, `backIcon` | `backIcon`, `nameInput`, `area`, `slider`, `alphaSlider`, `formatInputs`, `gradientEditor` |
| `Color.FormatInputs` | **`ColorFormatInputs`** | 2 | `copyIcon`, `checkIcon` | `checkIcon`, `copyIcon` |
| `Color.GradientEditor` | **`ColorGradientEditor`** | 2 | `presets`, `createPresetForm`, `area`, `slider`, `alphaSlider`, `formatInputs`, `plusIcon`, `minusIcon`, `reverseIcon`, `backIcon` | `createPresetForm`, `backIcon`, `presets`, `reverseIcon`, `minusIcon`, `plusIcon` |
| `Color.ImageFill` | **`ColorImageFill`** | 2 | `uploadIcon`, `rotateIcon`, `photoIcon`, `chevronIcon`, `slider` | `photoIcon`, `uploadIcon`, `chevronIcon`, `rotateIcon`, `slider`, `slider`, `slider`, `slider`, `slider`, `slider`, `slider`, `slider` |
| `Color.Swatch` | **`ColorSwatch`** | 2 | *none* | *none* |
| `Color.SwatchPicker` | **`ColorSwatchPicker`** | 2 | *none* | *none* |
| `Color.SwatchPickerItem` | **`ColorSwatchPickerItem`** | 2 | `checkIcon` | `checkIcon` |
| `Color.Area` | **`ColorArea`** | 2 | `thumb` | `thumb` |
| `Color.Slider` | **`ColorSlider`** | 2 | `output`, `track` | `output`, `track` |
| `Color.SliderOutput` | **`ColorSliderOutput`** | 2 | *none* | *none* |
| `Color.SliderTrack` | **`ColorSliderTrack`** | 2 | `thumb` | `thumb` |
| `Color.Thumb` | **`ColorThumb`** | 2 | *none* | *none* |
| `Color.Wheel` | **`ColorWheel`** | 2 | `thumb` | `thumb` |
| `Color.Field` | **`ColorField`** | 2 | `input` | `input`, `input` |
| `Color.EyeDropper` | **`EyeDropper`** | 2 | `icon` | `icon` |

### 📦 `ColorField` — [src/modules/core/components/color/color-field.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/color/color-field.tsx#L184)

- **Root Slots (1):** `input`
- **Subcomponents Attached (1):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `ColorField.Input` | **`Input`** | 2 | *none* | *none* |

### 📦 `ColorGradientEditor` — [src/modules/core/components/color/color-gradient-editor.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/color/color-gradient-editor.tsx#L976)

- **Root Slots (10):** `presets`, `createPresetForm`, `area`, `slider`, `alphaSlider`, `formatInputs`, `plusIcon`, `minusIcon`, `reverseIcon`, `backIcon`
- **Subcomponents Attached (3):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `ColorGradientEditor.Area` | **`ColorArea`** | 2 | `thumb` | `thumb` |
| `ColorGradientEditor.Slider` | **`ColorSlider`** | 2 | `output`, `track` | `output`, `track` |
| `ColorGradientEditor.FormatInputs` | **`ColorFormatInputs`** | 2 | `copyIcon`, `checkIcon` | `checkIcon`, `copyIcon` |

### 📦 `ColorPicker` — [src/modules/core/components/color/color-picker.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/color/color-picker.tsx#L485)

- **Root Slots (13):** `presets`, `createPresetForm`, `area`, `slider`, `alphaSlider`, `field`, `formatInputs`, `gradientEditor`, `imageFill`, `eyeDropper`, `swatch`, `swatchPicker`, `closeIcon`
- **Subcomponents Attached (16):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `ColorPicker.FormatInputs` | **`ColorFormatInputs`** | 2 | `copyIcon`, `checkIcon` | `checkIcon`, `copyIcon` |
| `ColorPicker.GradientEditor` | **`ColorGradientEditor`** | 2 | `presets`, `createPresetForm`, `area`, `slider`, `alphaSlider`, `formatInputs`, `plusIcon`, `minusIcon`, `reverseIcon`, `backIcon` | `createPresetForm`, `backIcon`, `presets`, `reverseIcon`, `minusIcon`, `plusIcon` |
| `ColorPicker.ImageFill` | **`ColorImageFill`** | 2 | `uploadIcon`, `rotateIcon`, `photoIcon`, `chevronIcon`, `slider` | `photoIcon`, `uploadIcon`, `chevronIcon`, `rotateIcon`, `slider`, `slider`, `slider`, `slider`, `slider`, `slider`, `slider`, `slider` |
| `ColorPicker.Presets` | **`PresetsContainer`** | 2 | `createForm`, `addIcon`, `deleteIcon` | `addIcon`, `deleteIcon`, `createForm`, `addIcon` |
| `ColorPicker.CreatePresetForm` | **`CreatePresetForm`** | 2 | `area`, `slider`, `alphaSlider`, `formatInputs`, `gradientEditor`, `nameInput`, `backIcon` | `backIcon`, `nameInput`, `area`, `slider`, `alphaSlider`, `formatInputs`, `gradientEditor` |
| `ColorPicker.Area` | **`ColorArea`** | 2 | `thumb` | `thumb` |
| `ColorPicker.Slider` | **`ColorSlider`** | 2 | `output`, `track` | `output`, `track` |
| `ColorPicker.Output` | **`ColorSliderOutput`** | 2 | *none* | *none* |
| `ColorPicker.Track` | **`ColorSliderTrack`** | 2 | `thumb` | `thumb` |
| `ColorPicker.Thumb` | **`ColorThumb`** | 2 | *none* | *none* |
| `ColorPicker.Wheel` | **`ColorWheel`** | 2 | `thumb` | `thumb` |
| `ColorPicker.Field` | **`ColorField`** | 2 | `input` | `input`, `input` |
| `ColorPicker.Swatch` | **`ColorSwatch`** | 2 | *none* | *none* |
| `ColorPicker.SwatchPicker` | **`ColorSwatchPicker`** | 2 | *none* | *none* |
| `ColorPicker.SwatchPickerItem` | **`ColorSwatchPickerItem`** | 2 | `checkIcon` | `checkIcon` |
| `ColorPicker.EyeDropper` | **`EyeDropper`** | 2 | `icon` | `icon` |

### 📦 `PresetsContainer` — [src/modules/core/components/color/color-presets.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/color/color-presets.tsx#L744)

- **Root Slots (3):** `createForm`, `addIcon`, `deleteIcon`
- **Subcomponents Attached (1):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `PresetsContainer.CreateForm` | **`CreatePresetForm`** | 2 | `area`, `slider`, `alphaSlider`, `formatInputs`, `gradientEditor`, `nameInput`, `backIcon` | `backIcon`, `nameInput`, `area`, `slider`, `alphaSlider`, `formatInputs`, `gradientEditor` |

### 📦 `ColorSlider` — [src/modules/core/components/color/color-slider.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/color/color-slider.tsx#L210)

- **Root Slots (2):** `output`, `track`
- **Subcomponents Attached (3):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `ColorSlider.Output` | **`ColorSliderOutput`** | 2 | *none* | *none* |
| `ColorSlider.Track` | **`ColorSliderTrack`** | 2 | `thumb` | `thumb` |
| `ColorSlider.Thumb` | **`ColorThumb`** | 2 | *none* | *none* |

### 📦 `ColorSwatchPicker` — [src/modules/core/components/color/color-swatch-picker.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/color/color-swatch-picker.tsx#L63)

- **Root Slots (0):** *none*
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `ColorSwatchPicker.Item` | **`ColorSwatchPickerItem`** | 2 | `checkIcon` | `checkIcon` |
| `ColorSwatchPicker.Swatch` | **`ColorSwatch`** | 2 | *none* | *none* |

### 📦 `ColorWheel` — [src/modules/core/components/color/color-wheel.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/color/color-wheel.tsx#L88)

- **Root Slots (1):** `thumb`
- **Subcomponents Attached (1):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `ColorWheel.Thumb` | **`ColorThumb`** | 2 | *none* | *none* |

### 📦 `ComboBox` — [src/modules/core/components/combo-box/combo-box.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/combo-box/combo-box.tsx#L118)

- **Root Slots (1):** `chevron`
- **Subcomponents Attached (9):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `ComboBox.Input` | **`ComboBoxInput`** | 2 | `chevron` | `chevron` |
| `ComboBox.Content` | **`ComboBoxContent`** | 2 | *none* | *none* |
| `ComboBox.Item` | **`ComboBoxItem`** | 2 | `checkIcon` | `checkIcon` |
| `ComboBox.Section` | **`ComboBoxSection`** | 2 | *none* | *none* |
| `ComboBox.Header` | **`ComboBoxHeader`** | 2 | *none* | *none* |
| `ComboBox.Separator` | **`ComboBoxSeparator`** | 2 | *none* | *none* |
| `ComboBox.Value` | **`ComboBoxValue`** | 2 | *none* | *none* |
| `ComboBox.Label` | **`ComboBoxLabel`** | 2 | *none* | *none* |
| `ComboBox.Description` | **`ComboBoxDescription`** | 2 | *none* | *none* |

### 📦 `CommandMenu` — [src/modules/core/components/command-menu/command-menu.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/command-menu/command-menu.tsx#L190)

- **Root Slots (2):** `search`, `footer`
- **Subcomponents Attached (10):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `CommandMenu.Provider` | **`CommandMenuProvider`** | 0 | *none* | *none* |
| `CommandMenu.Search` | **`CommandMenuSearch`** | 1 | *none* | *none* |
| `CommandMenu.List` | **`CommandMenuList`** | 1 | *none* | *none* |
| `CommandMenu.Section` | **`CommandMenuSection`** | 1 | *none* | *none* |
| `CommandMenu.Item` | **`CommandMenuItem`** | 1 | *none* | *none* |
| `CommandMenu.Description` | **`CommandMenuDescription`** | 1 | *none* | *none* |
| `CommandMenu.Separator` | **`CommandMenuSeparator`** | 1 | *none* | *none* |
| `CommandMenu.Footer` | **`CommandMenuFooter`** | 1 | *none* | *none* |
| `CommandMenu.Label` | **`CommandMenuLabel`** | 1 | *none* | *none* |
| `CommandMenu.Shortcut` | **`CommandMenuShortcut`** | 1 | *none* | *none* |

### 📦 `ComparePane` — [src/modules/core/components/compare-pane/compare-pane.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/compare-pane/compare-pane.tsx#L560)

- **Root Slots (3):** `handle`, `first`, `second`
- **Subcomponents Attached (5):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `ComparePane.Handle` | **`ComparePaneHandle`** | 2 | *none* | *none* |
| `ComparePane.Divider` | **`ComparePaneDivider`** | 0 | *none* | *none* |
| `ComparePane.First` | **`ComparePaneFirst`** | 2 | *none* | *none* |
| `ComparePane.Second` | **`ComparePaneSecond`** | 2 | *none* | *none* |
| `ComparePane.Label` | **`ComparePaneLabel`** | 2 | *none* | *none* |

### 📦 `ContextMenu` — [src/modules/core/components/context-menu/context-menu.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/context-menu/context-menu.tsx#L65)

- **Root Slots (2):** `trigger`, `content`
- **Subcomponents Attached (9):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `ContextMenu.Trigger` | **`ContextMenuTrigger`** | 1 | *none* | *none* |
| `ContextMenu.Content` | **`ContextMenuContent`** | 1 | *none* | *none* |
| `ContextMenu.Item` | **`ContextMenuItem`** | 0 | *none* | *none* |
| `ContextMenu.Separator` | **`ContextMenuSeparator`** | 0 | *none* | *none* |
| `ContextMenu.Section` | **`ContextMenuSection`** | 0 | *none* | *none* |
| `ContextMenu.Header` | **`ContextMenuHeader`** | 0 | *none* | *none* |
| `ContextMenu.Label` | **`ContextMenuLabel`** | 0 | *none* | *none* |
| `ContextMenu.Shortcut` | **`ContextMenuShortcut`** | 0 | *none* | *none* |
| `ContextMenu.Sub` | **`ContextMenuSub`** | 0 | *none* | *none* |

### 📦 `Counter` — [src/modules/core/components/counter/counter.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/counter/counter.tsx#L177)

- **Root Slots (0):** *none*
- **Subcomponents Attached (1):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Counter.Control` | **`CounterControl`** | 2 | `option` | `option` |

### 📦 `DataSelectionBar` — [src/modules/core/components/data-selection-bar/data-selection-bar.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/data-selection-bar/data-selection-bar.tsx#L1318)

- **Root Slots (8):** `search`, `categorySelect`, `filterBuilder`, `sortMenu`, `filterBadge`, `filterStrip`, `clearButton`, `extraActions`
- **Subcomponents Attached (11):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `DataSelectionBar.Provider` | **`DataSelectionBarProvider`** | 0 | *none* | *none* |
| `DataSelectionBar.Search` | **`DataSelectionBarSearch`** | 1 | *none* | *none* |
| `DataSelectionBar.CategorySelect` | **`DataSelectionBarCategorySelect`** | 1 | *none* | *none* |
| `DataSelectionBar.Categories` | **`DataSelectionBarCategorySelect`** | 1 | *none* | *none* |
| `DataSelectionBar.FilterBuilder` | **`DataSelectionBarFilterBuilder`** | 1 | *none* | *none* |
| `DataSelectionBar.Filter` | **`DataSelectionBarFilterBuilder`** | 1 | *none* | *none* |
| `DataSelectionBar.SortMenu` | **`DataSelectionBarSortMenu`** | 1 | *none* | *none* |
| `DataSelectionBar.Sort` | **`DataSelectionBarSortMenu`** | 1 | *none* | *none* |
| `DataSelectionBar.FilterStrip` | **`DataSelectionBarFilterStrip`** | 2 | `filterBadge`, `clearButton` | `filterBadge`, `clearButton` |
| `DataSelectionBar.FilterBadge` | **`DataSelectionBarFilterBadge`** | 1 | *none* | *none* |
| `DataSelectionBar.Actions` | **`DataSelectionBarActions`** | 1 | *none* | *none* |

### 📦 `DataTable` — [src/modules/core/components/data-table/data-table.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/data-table/data-table.tsx#L2414)

- **Root Slots (14):** `toolbar`, `search`, `selectionBadge`, `columnVisibility`, `toolbarActions`, `container`, `header`, `body`, `row`, `emptyState`, `loader`, `pagination`, `pageSizeSelect`, `rowActionTrigger`
- **Subcomponents Attached (19):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `DataTable.Provider` | **`DataTableProvider`** | 0 | *none* | *none* |
| `DataTable.Toolbar` | **`DataTableToolbar`** | 2 | `search`, `selectionBadge`, `columnVisibility`, `toolbarActions` | `search`, `selectionBadge`, `columnVisibility`, `toolbarActions` |
| `DataTable.Search` | **`DataTableSearch`** | 1 | *none* | *none* |
| `DataTable.SelectionBadge` | **`DataTableSelectionBadge`** | 1 | *none* | *none* |
| `DataTable.SelectionBar` | **`DataTableSelectionBadge`** | 1 | *none* | *none* |
| `DataTable.ColumnVisibility` | **`DataTableColumnVisibility`** | 1 | *none* | *none* |
| `DataTable.ColumnManager` | **`DataTableColumnVisibility`** | 1 | *none* | *none* |
| `DataTable.ToolbarActions` | **`DataTableToolbarActions`** | 1 | *none* | *none* |
| `DataTable.ExportButton` | **`DataTableToolbarActions`** | 1 | *none* | *none* |
| `DataTable.Container` | **`DataTableContainer`** | 1 | *none* | *none* |
| `DataTable.Header` | **`DataTableHeader`** | 2 | `resizer`, `columnActionTrigger` | *none* |
| `DataTable.Head` | **`DataTableHeaderCell`** | 1 | *none* | *none* |
| `DataTable.HeaderCell` | **`DataTableHeaderCell`** | 1 | *none* | *none* |
| `DataTable.Body` | **`DataTableBody`** | 2 | `row`, `loader`, `emptyState`, `rowActionTrigger` | `loader`, `emptyState` |
| `DataTable.Row` | **`DataTableRow`** | 1 | *none* | *none* |
| `DataTable.Cell` | **`DataTableCell`** | 1 | *none* | *none* |
| `DataTable.Loader` | **`DataTableLoader`** | 1 | *none* | *none* |
| `DataTable.EmptyState` | **`DataTableEmptyState`** | 1 | *none* | *none* |
| `DataTable.Pagination` | **`DataTablePagination`** | 2 | `pageSizeSelect` | `pageSizeSelect` |

### 📦 `DateField` — [src/modules/core/components/date-picker/date-field.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/date-picker/date-field.tsx#L168)

- **Root Slots (2):** `input`, `segment`
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `DateField.Input` | **`DateInput`** | 2 | `segment` | `segment` |
| `DateField.Segment` | **`DateSegment`** | 1 | *none* | *none* |

### 📦 `DatePicker` — [src/modules/core/components/date-picker/date-picker.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/date-picker/date-picker.tsx#L345)

- **Root Slots (10):** `trigger`, `overlay`, `calendar`, `input`, `button`, `icon`, `cellIndicator`, `remaining`, `popover`, `modal`
- **Subcomponents Attached (8):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `DatePicker.Trigger` | **`DatePickerTrigger`** | 2 | `input`, `button`, `icon` | `icon`, `input`, `button` |
| `DatePicker.Overlay` | **`DatePickerOverlay`** | 2 | `calendar`, `cellIndicator`, `remaining`, `modal`, `popover` | `calendar`, `calendar` |
| `DatePicker.Calendar` | **`Calendar`** | 2 | `header`, `grid`, `monthPicker`, `yearPicker`, `prevButton`, `nextButton`, `heading`, `gridHeader`, `gridBody`, `cell`, `cellIndicator`, `remaining` | *none* |
| `DatePicker.RangeCalendar` | **`RangeCalendar`** | 2 | `header`, `grid`, `monthPicker`, `yearPicker`, `prevButton`, `nextButton`, `heading`, `gridHeader`, `gridBody`, `cell`, `cellIndicator`, `remaining` | `header`, `cell`, `cellIndicator` |
| `DatePicker.Input` | **`DateInput`** | 2 | `segment` | `segment` |
| `DatePicker.Segment` | **`DateSegment`** | 1 | *none* | *none* |
| `DatePicker.CellIndicator` | **`CalendarCellIndicator`** | 1 | *none* | *none* |
| `DatePicker.Remaining` | **`CalendarRemaining`** | 1 | *none* | *none* |

### 📦 `DateRangePicker` — [src/modules/core/components/date-picker/date-range-picker.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/date-picker/date-range-picker.tsx#L272)

- **Root Slots (12):** `trigger`, `overlay`, `calendar`, `startInput`, `endInput`, `separator`, `button`, `icon`, `cellIndicator`, `remaining`, `popover`, `modal`
- **Subcomponents Attached (8):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `DateRangePicker.Trigger` | **`DateRangePickerTrigger`** | 2 | `startInput`, `endInput`, `separator`, `button`, `icon` | `icon`, `startInput`, `separator`, `endInput`, `button` |
| `DateRangePicker.Overlay` | **`DatePickerOverlay`** | 2 | `calendar`, `cellIndicator`, `remaining`, `modal`, `popover` | `calendar`, `calendar` |
| `DateRangePicker.Calendar` | **`RangeCalendar`** | 2 | `header`, `grid`, `monthPicker`, `yearPicker`, `prevButton`, `nextButton`, `heading`, `gridHeader`, `gridBody`, `cell`, `cellIndicator`, `remaining` | `header`, `cell`, `cellIndicator` |
| `DateRangePicker.RangeCalendar` | **`RangeCalendar`** | 2 | `header`, `grid`, `monthPicker`, `yearPicker`, `prevButton`, `nextButton`, `heading`, `gridHeader`, `gridBody`, `cell`, `cellIndicator`, `remaining` | `header`, `cell`, `cellIndicator` |
| `DateRangePicker.Input` | **`DateInput`** | 2 | `segment` | `segment` |
| `DateRangePicker.Segment` | **`DateSegment`** | 1 | *none* | *none* |
| `DateRangePicker.CellIndicator` | **`CalendarCellIndicator`** | 1 | *none* | *none* |
| `DateRangePicker.Remaining` | **`CalendarRemaining`** | 1 | *none* | *none* |

### 📦 `DateTime` — [src/modules/core/components/date-picker/date-time.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/date-picker/date-time.tsx#L380)

- **Root Slots (10):** `trigger`, `icon`, `clearButton`, `indicator`, `picker`, `label`, `description`, `errorMessage`, `cellIndicator`, `remaining`
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `DateTime.CellIndicator` | **`CalendarCellIndicator`** | 1 | *none* | *none* |
| `DateTime.Remaining` | **`CalendarRemaining`** | 1 | *none* | *none* |

### 📦 `DateTimeContent` — [src/modules/core/components/date-time-picker/date-time-content.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/date-time-picker/date-time-content.tsx#L1279)

- **Root Slots (10):** `presets`, `tabs`, `timeTarget`, `calendar`, `timeWheel`, `footer`, `clearButton`, `doneButton`, `cellIndicator`, `remaining`
- **Subcomponents Attached (8):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `DateTimeContent.Presets` | **`DateTimePresets`** | 1 | *none* | *none* |
| `DateTimeContent.Tabs` | **`DateTimeTabs`** | 1 | *none* | *none* |
| `DateTimeContent.TimeTarget` | **`DateTimeTimeTarget`** | 1 | *none* | *none* |
| `DateTimeContent.Calendar` | **`DateTimeCalendar`** | 1 | *none* | *none* |
| `DateTimeContent.TimeWheel` | **`DateTimeTimeWheel`** | 1 | *none* | *none* |
| `DateTimeContent.Footer` | **`DateTimeFooter`** | 2 | `clearButton`, `doneButton` | `clearButton`, `doneButton` |
| `DateTimeContent.CellIndicator` | **`CalendarCellIndicator`** | 1 | *none* | *none* |
| `DateTimeContent.Remaining` | **`CalendarRemaining`** | 1 | *none* | *none* |

### 📦 `DateTimePicker` — [src/modules/core/components/date-time-picker/date-time-picker.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/date-time-picker/date-time-picker.tsx#L273)

- **Root Slots (3):** `content`, `popover`, `modal`
- **Subcomponents Attached (11):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `DateTimePicker.Content` | **`DateTimeContent`** | 2 | `presets`, `tabs`, `timeTarget`, `calendar`, `timeWheel`, `footer`, `clearButton`, `doneButton`, `cellIndicator`, `remaining` | `presets`, `tabs`, `calendar`, `timeTarget`, `timeWheel`, `timeWheel`, `footer` |
| `DateTimePicker.Presets` | **`DateTimePresets`** | 1 | *none* | *none* |
| `DateTimePicker.Tabs` | **`DateTimeTabs`** | 1 | *none* | *none* |
| `DateTimePicker.TimeTarget` | **`DateTimeTimeTarget`** | 1 | *none* | *none* |
| `DateTimePicker.Calendar` | **`DateTimeCalendar`** | 1 | *none* | *none* |
| `DateTimePicker.TimeWheel` | **`DateTimeTimeWheel`** | 1 | *none* | *none* |
| `DateTimePicker.Footer` | **`DateTimeFooter`** | 2 | `clearButton`, `doneButton` | `clearButton`, `doneButton` |
| `DateTimePicker.Wheel` | **`InteractiveTimeWheel`** | 2 | `hourColumn`, `minuteColumn`, `secondColumn`, `periodColumn`, `modeToggle`, `selectionBar`, `separator`, `remaining` | `modeToggle`, `selectionBar`, `hourColumn`, `separator`, `minuteColumn`, `separator`, `secondColumn`, `periodColumn`, `remaining` |
| `DateTimePicker.Column` | **`DrumColumn`** | 1 | *none* | *none* |
| `DateTimePicker.CellIndicator` | **`CalendarCellIndicator`** | 1 | *none* | *none* |
| `DateTimePicker.Remaining` | **`CalendarRemaining`** | 1 | *none* | *none* |

### 📦 `DescriptionList` — [src/modules/core/components/description-list/description-list.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/description-list/description-list.tsx#L40)

- **Root Slots (0):** *none*
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `DescriptionList.Term` | **`DescriptionTerm`** | 2 | *none* | *none* |
| `DescriptionList.Details` | **`DescriptionDetails`** | 2 | *none* | *none* |

### 📦 `DiffViewer` — [src/modules/core/components/diff-viewer/diff-viewer.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/diff-viewer/diff-viewer.tsx#L831)

- **Root Slots (2):** `splitPane`, `copyButton`
- **Subcomponents Attached (6):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `DiffViewer.Header` | **`DiffViewerHeader`** | 1 | *none* | *none* |
| `DiffViewer.Toolbar` | **`DiffViewerToolbar`** | 2 | `copyButton` | `copyButton` |
| `DiffViewer.Content` | **`DiffViewerContent`** | 1 | *none* | *none* |
| `DiffViewer.Unified` | **`DiffViewerUnified`** | 1 | *none* | *none* |
| `DiffViewer.Split` | **`DiffViewerSplit`** | 2 | `splitPane` | `splitPane` |
| `DiffViewer.Copy` | **`DiffViewerCopyButton`** | 1 | *none* | *none* |

### 📦 `Drawer` — [src/modules/core/components/drawer/drawer.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/drawer/drawer.tsx#L225)

- **Root Slots (1):** `notch`
- **Subcomponents Attached (8):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Drawer.Content` | **`DrawerContent`** | 2 | `notch` | `notch`, `notch` |
| `Drawer.Header` | **`DrawerHeader`** | 1 | *none* | *none* |
| `Drawer.Title` | **`DrawerTitle`** | 1 | *none* | *none* |
| `Drawer.Description` | **`DrawerDescription`** | 1 | *none* | *none* |
| `Drawer.Body` | **`DrawerBody`** | 1 | *none* | *none* |
| `Drawer.Footer` | **`DrawerFooter`** | 1 | *none* | *none* |
| `Drawer.Close` | **`DrawerClose`** | 1 | *none* | *none* |
| `Drawer.Notch` | **`DrawerNotch`** | 1 | *none* | *none* |

### 📦 `EmailField` — [src/modules/core/components/email-field/email-field.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/email-field/email-field.tsx#L118)

- **Root Slots (4):** `label`, `description`, `error`, `input`
- **Subcomponents Attached (1):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `EmailField.Input` | **`EmailInput`** | 2 | `icon` | `icon` |

### 📦 `EmptyState` — [src/modules/core/components/empty-state/empty-state.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/empty-state/empty-state.tsx#L181)

- **Root Slots (4):** `illustration`, `title`, `description`, `actions`
- **Subcomponents Attached (3):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `EmptyState.Title` | **`EmptyStateTitle`** | 0 | *none* | *none* |
| `EmptyState.Description` | **`EmptyStateDescription`** | 0 | *none* | *none* |
| `EmptyState.Actions` | **`EmptyStateActions`** | 1 | *none* | *none* |

### 📦 `Field` — [src/modules/core/components/field/field.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/field/field.tsx#L167)

- **Root Slots (0):** *none*
- **Subcomponents Attached (6):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Field.Label` | **`Label`** | 1 | *none* | *none* |
| `Field.Description` | **`Description`** | 1 | *none* | *none* |
| `Field.Error` | **`FieldError`** | 1 | *none* | *none* |
| `Field.Group` | **`FieldGroup`** | 1 | *none* | *none* |
| `Field.Set` | **`Fieldset`** | 1 | *none* | *none* |
| `Field.Legend` | **`Legend`** | 1 | *none* | *none* |

### 📦 `GridList` — [src/modules/core/components/grid-list/grid-list.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/grid-list/grid-list.tsx#L65)

- **Root Slots (1):** `emptyState`
- **Subcomponents Attached (8):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `GridList.Section` | **`GridListSection`** | 1 | *none* | *none* |
| `GridList.Header` | **`GridListHeader`** | 1 | *none* | *none* |
| `GridList.Item` | **`GridListItem`** | 2 | `dragButton`, `dragIcon`, `selectionCheckbox` | `dragButton`, `dragIcon`, `selectionCheckbox` |
| `GridList.EmptyState` | **`GridListEmptyState`** | 1 | *none* | *none* |
| `GridList.Spacer` | **`GridListSpacer`** | 1 | *none* | *none* |
| `GridList.Start` | **`GridListStart`** | 1 | *none* | *none* |
| `GridList.Label` | **`GridListLabel`** | 1 | *none* | *none* |
| `GridList.Description` | **`GridListDescription`** | 1 | *none* | *none* |

### 📦 `Input` — [src/modules/core/components/input/input.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/input/input.tsx#L67)

- **Root Slots (0):** *none*
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Input.Group` | **`InputGroup`** | 1 | *none* | *none* |
| `Input.Field` | **`TextField`** | 1 | *none* | *none* |

### 📦 `InputOTP` — [src/modules/core/components/input-otp/input-otp.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/input-otp/input-otp.tsx#L64)

- **Root Slots (1):** `separator`
- **Subcomponents Attached (5):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `InputOTP.Control` | **`InputOTPControl`** | 1 | *none* | *none* |
| `InputOTP.Group` | **`InputOTPGroup`** | 1 | *none* | *none* |
| `InputOTP.Slot` | **`InputOTPSlot`** | 1 | *none* | *none* |
| `InputOTP.Separator` | **`InputOTPSeparator`** | 2 | `separator` | `separator` |
| `InputOTP.Label` | **`InputOTPLabel`** | 1 | *none* | *none* |

### 📦 `JsonViewer` — [src/modules/core/components/json-viewer/json-viewer.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/json-viewer/json-viewer.tsx#L948)

- **Root Slots (3):** `searchIcon`, `copyButton`, `tree`
- **Subcomponents Attached (3):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `JsonViewer.Toolbar` | **`JsonViewerToolbar`** | 2 | `searchIcon`, `copyButton` | `searchIcon`, `copyButton` |
| `JsonViewer.Tree` | **`JsonViewerTree`** | 2 | `node` | `node` |
| `JsonViewer.Copy` | **`JsonViewerCopyButton`** | 1 | *none* | *none* |

### 📦 `Kbd` — [src/modules/core/components/kbd/kbd.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/kbd/kbd.tsx#L32)

- **Root Slots (0):** *none*
- **Subcomponents Attached (1):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Kbd.Keyboard` | **`Keyboard`** | 0 | *none* | *none* |

### 📦 `Loader` — [src/modules/core/components/loader/loader.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/loader/loader.tsx#L763)

- **Root Slots (0):** *none*
- **Subcomponents Attached (13):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Loader.Ring` | **`LoaderRing`** | 1 | *none* | *none* |
| `Loader.Spin` | **`LoaderSpin`** | 1 | *none* | *none* |
| `Loader.Dash` | **`LoaderDash`** | 1 | *none* | *none* |
| `Loader.Dots` | **`LoaderDots`** | 1 | *none* | *none* |
| `Loader.Pulse` | **`LoaderPulse`** | 1 | *none* | *none* |
| `Loader.Bars` | **`LoaderBars`** | 1 | *none* | *none* |
| `Loader.Grid` | **`LoaderGrid`** | 1 | *none* | *none* |
| `Loader.DualRing` | **`LoaderDualRing`** | 1 | *none* | *none* |
| `Loader.Gradient` | **`LoaderGradient`** | 1 | *none* | *none* |
| `Loader.CornerBlob` | **`LoaderCornerBlob`** | 1 | *none* | *none* |
| `Loader.Spiral` | **`LoaderSpiral`** | 1 | *none* | *none* |
| `Loader.Diamond` | **`LoaderDiamond`** | 1 | *none* | *none* |
| `Loader.Squares` | **`LoaderSquares`** | 1 | *none* | *none* |

### 📦 `Menu` — [src/modules/core/components/menu/menu.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/menu/menu.tsx#L99)

- **Root Slots (0):** *none*
- **Subcomponents Attached (8):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Menu.Trigger` | **`MenuTrigger`** | 1 | *none* | *none* |
| `Menu.Popover` | **`MenuPopover`** | 1 | *none* | *none* |
| `Menu.Item` | **`MenuItem`** | 2 | `icon`, `shortcut` | `icon`, `shortcut` |
| `Menu.Section` | **`MenuSection`** | 1 | *none* | *none* |
| `Menu.Header` | **`MenuHeader`** | 1 | *none* | *none* |
| `Menu.Separator` | **`MenuSeparator`** | 1 | *none* | *none* |
| `Menu.Submenu` | **`MenuSubmenuTrigger`** | 1 | *none* | *none* |
| `Menu.Shortcut` | **`MenuKeyboardShortcut`** | 1 | *none* | *none* |

### 📦 `Meter` — [src/modules/core/components/meter/meter.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/meter/meter.tsx#L190)

- **Root Slots (3):** `header`, `track`, `value`
- **Subcomponents Attached (4):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Meter.Header` | **`MeterHeader`** | 1 | *none* | *none* |
| `Meter.Value` | **`MeterValue`** | 1 | *none* | *none* |
| `Meter.Track` | **`MeterTrack`** | 1 | *none* | *none* |
| `Meter.Provider` | **`MeterProvider`** | 0 | *none* | *none* |

### 📦 `Modal` — [src/modules/core/components/modal/modal.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/modal/modal.tsx#L171)

- **Root Slots (3):** `header`, `footer`, `closeButton`
- **Subcomponents Attached (8):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Modal.Trigger` | **`ModalTrigger`** | 1 | *none* | *none* |
| `Modal.Header` | **`ModalHeader`** | 1 | *none* | *none* |
| `Modal.Title` | **`ModalTitle`** | 1 | *none* | *none* |
| `Modal.Description` | **`ModalDescription`** | 1 | *none* | *none* |
| `Modal.Body` | **`ModalBody`** | 1 | *none* | *none* |
| `Modal.Footer` | **`ModalFooter`** | 1 | *none* | *none* |
| `Modal.Close` | **`ModalCloseButton`** | 1 | *none* | *none* |
| `Modal.CloseButton` | **`ModalCloseButton`** | 1 | *none* | *none* |

### 📦 `MultipleSelect` — [src/modules/core/components/multiple-select/multiple-select.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/multiple-select/multiple-select.tsx#L351)

- **Root Slots (3):** `searchIcon`, `tag`, `item`
- **Subcomponents Attached (4):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `MultipleSelect.Trigger` | **`MultipleSelectTrigger`** | 2 | *none* | *none* |
| `MultipleSelect.Tag` | **`MultipleSelectTag`** | 2 | *none* | *none* |
| `MultipleSelect.Content` | **`MultipleSelectContent`** | 2 | *none* | *none* |
| `MultipleSelect.Item` | **`MultipleSelectItem`** | 2 | *none* | *none* |

### 📦 `NativeSelect` — [src/modules/core/components/native-select/native-select.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/native-select/native-select.tsx#L82)

- **Root Slots (1):** `chevron`
- **Subcomponents Attached (3):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `NativeSelect.Content` | **`NativeSelectContent`** | 2 | `chevron` | `chevron` |
| `NativeSelect.Option` | **`NativeSelectOption`** | 2 | *none* | *none* |
| `NativeSelect.OptGroup` | **`NativeSelectOptGroup`** | 2 | *none* | *none* |

### 📦 `Nav` — [src/modules/core/components/nav/nav.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/nav/nav.tsx#L518)

- **Root Slots (3):** `list`, `viewport`, `indicator`
- **Subcomponents Attached (8):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Nav.List` | **`NavList`** | 2 | `item` | `item` |
| `Nav.Item` | **`NavItem`** | 2 | *none* | *none* |
| `Nav.Trigger` | **`NavTrigger`** | 2 | `icon`, `chevron`, `badge` | `icon`, `badge`, `chevron` |
| `Nav.Menu` | **`NavMenu`** | 2 | `header`, `footer` | `header`, `footer` |
| `Nav.Content` | **`NavContent`** | 0 | *none* | *none* |
| `Nav.Link` | **`NavbarLink`** | 2 | `icon`, `badge`, `arrow` | `icon`, `badge`, `badge`, `arrow` |
| `Nav.Viewport` | **`NavViewport`** | 2 | *none* | *none* |
| `Nav.Indicator` | **`NavIndicator`** | 2 | *none* | *none* |

### 📦 `Note` — [src/modules/core/components/note/note.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/note/note.tsx#L207)

- **Root Slots (2):** `icon`, `close`
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Note.Alert` | **`Alert`** | 0 | *none* | *none* |
| `Note.Callout` | **`Callout`** | 0 | *none* | *none* |

### 📦 `NumberField` — [src/modules/core/components/number-field/number-field.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/number-field/number-field.tsx#L88)

- **Root Slots (0):** *none*
- **Subcomponents Attached (3):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `NumberField.Input` | **`NumberInput`** | 2 | `steppers` | `steppers` |
| `NumberField.Stepper` | **`StepperButton`** | 2 | `icon` | `icon` |
| `NumberField.StepperButton` | **`StepperButton`** | 2 | `icon` | `icon` |

### 📦 `OtpField` — [src/modules/core/components/otp-field/otp-field.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/otp-field/otp-field.tsx#L207)

- **Root Slots (5):** `label`, `description`, `error`, `otp`, `status`
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `OtpField.Status` | **`OtpFieldStatus`** | 1 | *none* | *none* |
| `OtpField.Input` | **`InputOTP`** | 2 | `separator` | *none* |

### 📦 `Pagination` — [src/modules/core/components/pagination/pagination.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/pagination/pagination.tsx#L123)

- **Root Slots (1):** `list`
- **Subcomponents Attached (13):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Pagination.List` | **`PaginationList`** | 2 | `first`, `previous`, `pages`, `next`, `last`, `start`, `end`, `gap`, `item`, `section`, `spacer`, `label` | `first`, `previous`, `start`, `pages`, `gap`, `item`, `section`, `end`, `next`, `last`, `spacer`, `label` |
| `Pagination.Section` | **`PaginationSection`** | 1 | *none* | *none* |
| `Pagination.Item` | **`PaginationItem`** | 1 | *none* | *none* |
| `Pagination.First` | **`PaginationFirst`** | 1 | *none* | *none* |
| `Pagination.Previous` | **`PaginationPrevious`** | 1 | *none* | *none* |
| `Pagination.Next` | **`PaginationNext`** | 1 | *none* | *none* |
| `Pagination.Last` | **`PaginationLast`** | 1 | *none* | *none* |
| `Pagination.Start` | **`PaginationStart`** | 1 | *none* | *none* |
| `Pagination.End` | **`PaginationEnd`** | 1 | *none* | *none* |
| `Pagination.Gap` | **`PaginationGap`** | 1 | *none* | *none* |
| `Pagination.Pages` | **`PaginationPages`** | 2 | `item`, `gap` | `gap`, `item` |
| `Pagination.Spacer` | **`PaginationSpacer`** | 1 | *none* | *none* |
| `Pagination.Label` | **`PaginationLabel`** | 1 | *none* | *none* |

### 📦 `PasswordField` — [src/modules/core/components/password-field/password-field.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/password-field/password-field.tsx#L326)

- **Root Slots (7):** `label`, `description`, `error`, `input`, `strength`, `requirements`, `suggestor`
- **Subcomponents Attached (4):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `PasswordField.Strength` | **`PasswordStrength`** | 1 | *none* | *none* |
| `PasswordField.Requirements` | **`PasswordRequirements`** | 1 | *none* | *none* |
| `PasswordField.Suggestor` | **`PasswordSuggestor`** | 1 | *none* | *none* |
| `PasswordField.Input` | **`PasswordInput`** | 2 | `icon`, `revealIcon`, `hideIcon` | `icon`, `hideIcon`, `revealIcon` |

### 📦 `PhoneField` — [src/modules/core/components/phone-field/phone-field.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/phone-field/phone-field.tsx#L275)

- **Root Slots (5):** `label`, `description`, `error`, `input`, `country`
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `PhoneField.Country` | **`PhoneCountrySelect`** | 1 | *none* | *none* |
| `PhoneField.Input` | **`PhoneInput`** | 2 | `icon`, `country` | `country`, `icon` |

### 📦 `Popover` — [src/modules/core/components/popover/popover.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/popover/popover.tsx#L176)

- **Root Slots (3):** `arrow`, `header`, `footer`
- **Subcomponents Attached (7):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Popover.Trigger` | **`PopoverTrigger`** | 1 | *none* | *none* |
| `Popover.Arrow` | **`PopoverArrow`** | 1 | *none* | *none* |
| `Popover.Header` | **`PopoverHeader`** | 1 | *none* | *none* |
| `Popover.Title` | **`PopoverTitle`** | 1 | *none* | *none* |
| `Popover.Description` | **`PopoverDescription`** | 1 | *none* | *none* |
| `Popover.Footer` | **`PopoverFooter`** | 1 | *none* | *none* |
| `Popover.Close` | **`PopoverClose`** | 1 | *none* | *none* |

### 📦 `Progress` — [src/modules/core/components/progress/progress.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/progress/progress.tsx#L159)

- **Root Slots (3):** `header`, `track`, `value`
- **Subcomponents Attached (5):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Progress.Header` | **`ProgressHeader`** | 1 | *none* | *none* |
| `Progress.Value` | **`ProgressValue`** | 1 | *none* | *none* |
| `Progress.Track` | **`ProgressTrack`** | 1 | *none* | *none* |
| `Progress.Circle` | **`ProgressCircle`** | 2 | `label` | `label` |
| `Progress.Provider` | **`ProgressProvider`** | 0 | *none* | *none* |

### 📦 `RadioGroup` — [src/modules/core/components/radio/radio.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/radio/radio.tsx#L41)

- **Root Slots (0):** *none*
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `RadioGroup.Item` | **`Radio`** | 2 | `dot` | `dot` |
| `RadioGroup.Field` | **`RadioField`** | 1 | *none* | *none* |

### 📦 `Radio` — [src/modules/core/components/radio/radio.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/radio/radio.tsx#L147)

- **Root Slots (1):** `dot`
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Radio.Group` | **`RadioGroup`** | 1 | *none* | *none* |
| `Radio.Field` | **`RadioField`** | 1 | *none* | *none* |

### 📦 `ScrollArea` — [src/modules/core/components/scroll-area/scroll-area.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/scroll-area/scroll-area.tsx#L143)

- **Root Slots (2):** `scrollbar`, `viewport`
- **Subcomponents Attached (4):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `ScrollArea.Bar` | **`ScrollBar`** | 1 | *none* | *none* |
| `ScrollArea.Viewport` | **`ScrollAreaViewport`** | 1 | *none* | *none* |
| `ScrollArea.Thumb` | **`ScrollAreaThumb`** | 1 | *none* | *none* |
| `ScrollArea.Corner` | **`ScrollAreaCorner`** | 1 | *none* | *none* |

### 📦 `SearchField` — [src/modules/core/components/search-field/search-field.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/search-field/search-field.tsx#L96)

- **Root Slots (4):** `searchIcon`, `clearIcon`, `loader`, `shortcut`
- **Subcomponents Attached (1):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `SearchField.Input` | **`SearchInput`** | 2 | `searchIcon`, `clearIcon`, `loader`, `shortcut` | `loader`, `searchIcon`, `clearIcon`, `shortcut` |

### 📦 `Select` — [src/modules/core/components/select/select.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/select/select.tsx#L201)

- **Root Slots (4):** `trigger`, `value`, `popover`, `listBox`
- **Subcomponents Attached (8):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Select.Trigger` | **`SelectTrigger`** | 1 | *none* | *none* |
| `Select.Value` | **`SelectValue`** | 1 | *none* | *none* |
| `Select.Popover` | **`SelectPopover`** | 1 | *none* | *none* |
| `Select.ListBox` | **`ListBox`** | 1 | *none* | *none* |
| `Select.Item` | **`ListBoxItem`** | 1 | *none* | *none* |
| `Select.Section` | **`ListBoxSection`** | 1 | *none* | *none* |
| `Select.Separator` | **`ListBoxSeparator`** | 1 | *none* | *none* |
| `Select.Field` | **`SelectField`** | 1 | *none* | *none* |

### 📦 `ListBox` — [src/modules/core/components/select/select.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/select/select.tsx#L389)

- **Root Slots (0):** *none*
- **Subcomponents Attached (3):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `ListBox.Item` | **`ListBoxItem`** | 1 | *none* | *none* |
| `ListBox.Section` | **`ListBoxSection`** | 1 | *none* | *none* |
| `ListBox.Separator` | **`ListBoxSeparator`** | 1 | *none* | *none* |

### 📦 `Separator` — [src/modules/core/components/separator/separator.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/separator/separator.tsx#L37)

- **Root Slots (0):** *none*
- **Subcomponents Attached (1):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Separator.Divider` | **`Divider`** | 0 | *none* | *none* |

### 📦 `Sidebar` — [src/modules/core/components/sidebar/sidebar.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/sidebar/sidebar.tsx#L557)

- **Root Slots (5):** `header`, `search`, `content`, `footer`, `rail`
- **Subcomponents Attached (10):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Sidebar.Provider` | **`SidebarProvider`** | 1 | *none* | *none* |
| `Sidebar.Header` | **`SidebarHeader`** | 1 | *none* | *none* |
| `Sidebar.Footer` | **`SidebarFooter`** | 1 | *none* | *none* |
| `Sidebar.Content` | **`SidebarContent`** | 2 | *none* | *none* |
| `Sidebar.Section` | **`SidebarSection`** | 2 | *none* | *none* |
| `Sidebar.Item` | **`SidebarItem`** | 1 | *none* | *none* |
| `Sidebar.Trigger` | **`SidebarTrigger`** | 1 | *none* | *none* |
| `Sidebar.Inset` | **`SidebarInset`** | 1 | *none* | *none* |
| `Sidebar.Rail` | **`SidebarRail`** | 1 | *none* | *none* |
| `Sidebar.Separator` | **`SidebarSeparator`** | 1 | *none* | *none* |

### 📦 `Skeleton` — [src/modules/core/components/skeleton/skeleton.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/skeleton/skeleton.tsx#L142)

- **Root Slots (0):** *none*
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Skeleton.Text` | **`SkeletonText`** | 1 | *none* | *none* |
| `Skeleton.Avatar` | **`SkeletonAvatar`** | 1 | *none* | *none* |

### 📦 `Slider` — [src/modules/core/components/slider/slider.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/slider/slider.tsx#L315)

- **Root Slots (4):** `track`, `thumb`, `fill`, `output`
- **Subcomponents Attached (8):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Slider.Track` | **`SliderTrack`** | 2 | `fill`, `thumb` | `fill`, `thumb` |
| `Slider.Thumb` | **`SliderThumb`** | 1 | *none* | *none* |
| `Slider.Fill` | **`SliderFill`** | 1 | *none* | *none* |
| `Slider.Output` | **`SliderOutput`** | 1 | *none* | *none* |
| `Slider.Group` | **`SliderGroup`** | 1 | *none* | *none* |
| `Slider.Provider` | **`SliderProvider`** | 0 | *none* | *none* |
| `Slider.Range` | **`RangeSlider`** | 2 | `track`, `thumb`, `fill`, `output` | `output`, `track` |
| `Slider.Adaptive` | **`AdaptiveSlider`** | 1 | *none* | *none* |

### 📦 `Snippet` — [src/modules/core/components/snippet/snippet.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/snippet/snippet.tsx#L252)

- **Root Slots (2):** `copy`, `highlight`
- **Subcomponents Attached (7):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Snippet.Copy` | **`SnippetCopyButton`** | 1 | *none* | *none* |
| `Snippet.Highlight` | **`SnippetHighlight`** | 1 | *none* | *none* |
| `Snippet.Tabs` | **`SnippetTabs`** | 1 | *none* | *none* |
| `Snippet.List` | **`SnippetTabList`** | 1 | *none* | *none* |
| `Snippet.Tab` | **`SnippetTab`** | 1 | *none* | *none* |
| `Snippet.Panel` | **`SnippetTabPanel`** | 1 | *none* | *none* |
| `Snippet.Code` | **`CodeSnippet`** | 0 | *none* | *none* |

### 📦 `SplitPane` — [src/modules/core/components/split-pane/split-pane.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/split-pane/split-pane.tsx#L573)

- **Root Slots (3):** `handle`, `first`, `second`
- **Subcomponents Attached (5):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `SplitPane.Panel` | **`SplitPanePanel`** | 2 | *none* | *none* |
| `SplitPane.Handle` | **`SplitPaneHandle`** | 2 | *none* | *none* |
| `SplitPane.Divider` | **`SplitPaneDivider`** | 0 | *none* | *none* |
| `SplitPane.First` | **`SplitPaneFirst`** | 1 | *none* | *none* |
| `SplitPane.Second` | **`SplitPaneSecond`** | 1 | *none* | *none* |

### 📦 `Stepper` — [src/modules/core/components/stepper/stepper.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/stepper/stepper.tsx#L791)

- **Root Slots (0):** *none*
- **Subcomponents Attached (6):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Stepper.Item` | **`StepItem`** | 2 | `icon` | `icon` |
| `Stepper.Icon` | **`StepIcon`** | 2 | *none* | *none* |
| `Stepper.Content` | **`StepContent`** | 2 | *none* | *none* |
| `Stepper.Connector` | **`StepConnector`** | 2 | *none* | *none* |
| `Stepper.Separator` | **`StepSeparator`** | 2 | *none* | *none* |
| `Stepper.Provider` | **`StepperProvider`** | 0 | *none* | *none* |

### 📦 `Steps` — [src/modules/core/components/steps/steps.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/steps/steps.tsx#L1107)

- **Root Slots (2):** `navigator`, `indicator`
- **Subcomponents Attached (7):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Steps.Navigator` | **`StepsNavigator`** | 2 | `prevButton`, `nextButton`, `indicator`, `prevIcon`, `nextIcon` | `prevButton`, `prevIcon`, `indicator`, `nextButton`, `nextIcon` |
| `Steps.NavigatorArrow` | **`StepsNavigatorArrow`** | 1 | *none* | *none* |
| `Steps.NavigatorPill` | **`StepsNavigatorPill`** | 1 | *none* | *none* |
| `Steps.Indicator` | **`StepsIndicator`** | 2 | `track`, `step`, `tooltip` | `tooltip`, `track`, `step`, `tooltip` |
| `Steps.IndicatorTrack` | **`StepsIndicatorTrack`** | 1 | *none* | *none* |
| `Steps.IndicatorItem` | **`StepsIndicatorItem`** | 1 | *none* | *none* |
| `Steps.IndicatorTooltip` | **`StepsIndicatorTooltip`** | 1 | *none* | *none* |

### 📦 `Switch` — [src/modules/core/components/switch/switch.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/switch/switch.tsx#L200)

- **Root Slots (1):** `thumb`
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Switch.Field` | **`SwitchField`** | 1 | *none* | *none* |
| `Switch.Button` | **`SwitchButton`** | 1 | *none* | *none* |

### 📦 `Table` — [src/modules/core/components/table/table.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/table/table.tsx#L134)

- **Root Slots (2):** `emptyState`, `resizer`
- **Subcomponents Attached (9):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Table.Header` | **`TableHeader`** | 2 | `selectionCheckbox` | *none* |
| `Table.Column` | **`TableColumn`** | 2 | `sortIcon`, `resizer` | `sortIcon`, `resizer` |
| `Table.Body` | **`TableBody`** | 2 | `emptyState` | *none* |
| `Table.Row` | **`TableRow`** | 2 | `dragButton`, `selectionCheckbox` | *none* |
| `Table.Cell` | **`TableCell`** | 2 | `chevronButton` | `chevronButton` |
| `Table.Footer` | **`TableFooter`** | 1 | *none* | *none* |
| `Table.ColumnResizer` | **`ColumnResizer`** | 2 | `divider` | `divider` |
| `Table.Resizer` | **`ColumnResizer`** | 2 | `divider` | `divider` |
| `Table.Provider` | **`TableProvider`** | 0 | *none* | *none* |

### 📦 `Tabs` — [src/modules/core/components/tabs/tabs.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/tabs/tabs.tsx#L333)

- **Root Slots (0):** *none*
- **Subcomponents Attached (4):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Tabs.List` | **`TabList`** | 1 | *none* | *none* |
| `Tabs.Tab` | **`Tab`** | 2 | `icon`, `badge` | `icon`, `badge` |
| `Tabs.Panel` | **`TabPanel`** | 1 | *none* | *none* |
| `Tabs.Segmented` | **`SegmentedControl`** | 0 | *none* | *none* |

### 📦 `Text` — [src/modules/core/components/text/text.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/text/text.tsx#L1087)

- **Root Slots (2):** `caret`, `char`
- **Subcomponents Attached (5):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Text.Heading` | **`Heading`** | 2 | `caret`, `char` | *none* |
| `Text.Strong` | **`Strong`** | 2 | `caret`, `char` | *none* |
| `Text.Code` | **`Code`** | 2 | `caret`, `char` | *none* |
| `Text.Blockquote` | **`Blockquote`** | 2 | `caret`, `char` | *none* |
| `Text.Lead` | **`Lead`** | 2 | `caret`, `char` | *none* |

### 📦 `TextArea` — [src/modules/core/components/textarea/textarea.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/textarea/textarea.tsx#L81)

- **Root Slots (2):** `charCount`, `footer`
- **Subcomponents Attached (1):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `TextArea.Textarea` | **`Textarea`** | 0 | *none* | *none* |

### 📦 `ThemeEditor` — [src/modules/core/components/theme-editor/theme-editor.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/theme-editor/theme-editor.tsx#L1904)

- **Root Slots (9):** `header`, `nav`, `modeToggle`, `presets`, `knobs`, `colors`, `typography`, `preview`, `footer`
- **Subcomponents Attached (10):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `ThemeEditor.Header` | **`ThemeEditorHeader`** | 2 | `icon`, `resetButton`, `closeButton` | `icon`, `resetButton`, `closeButton` |
| `ThemeEditor.Nav` | **`ThemeEditorNav`** | 2 | `item` | `item` |
| `ThemeEditor.ModeToggle` | **`ThemeEditorModeToggle`** | 1 | *none* | *none* |
| `ThemeEditor.Presets` | **`ThemeEditorPresets`** | 2 | `intro` | `intro` |
| `ThemeEditor.Knobs` | **`ThemeEditorKnobs`** | 2 | `intro` | *none* |
| `ThemeEditor.Colors` | **`ThemeEditorColors`** | 2 | `intro` | `intro` |
| `ThemeEditor.Typography` | **`ThemeEditorTypography`** | 2 | `intro` | *none* |
| `ThemeEditor.Preview` | **`ThemeEditorPreview`** | 2 | `intro` | *none* |
| `ThemeEditor.Footer` | **`ThemeEditorFooter`** | 2 | `copyButton`, `doneButton` | `copyButton`, `doneButton` |
| `ThemeEditor.Modal` | **`ThemeEditorModal`** | 2 | `editor` | `editor` |

### 📦 `TimeField` — [src/modules/core/components/time-field/time-field.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/time-field/time-field.tsx#L103)

- **Root Slots (3):** `input`, `segment`, `remaining`
- **Subcomponents Attached (3):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `TimeField.Input` | **`TimeInput`** | 0 | *none* | *none* |
| `TimeField.Segment` | **`TimeSegment`** | 0 | *none* | *none* |
| `TimeField.Remaining` | **`CalendarRemaining`** | 1 | *none* | *none* |

### 📦 `InteractiveTimeWheel` — [src/modules/core/components/time-wheel/time-wheel.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/time-wheel/time-wheel.tsx#L450)

- **Root Slots (8):** `hourColumn`, `minuteColumn`, `secondColumn`, `periodColumn`, `modeToggle`, `selectionBar`, `separator`, `remaining`
- **Subcomponents Attached (5):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `InteractiveTimeWheel.Column` | **`DrumColumn`** | 1 | *none* | *none* |
| `InteractiveTimeWheel.Toggle` | **`TimeWheelModeToggle`** | 1 | *none* | *none* |
| `InteractiveTimeWheel.SelectionBar` | **`TimeWheelSelectionBar`** | 1 | *none* | *none* |
| `InteractiveTimeWheel.Separator` | **`TimeWheelSeparator`** | 1 | *none* | *none* |
| `InteractiveTimeWheel.Remaining` | **`CalendarRemaining`** | 1 | *none* | *none* |

### 📦 `Timer` — [src/modules/core/components/timer/timer.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/timer/timer.tsx#L845)

- **Root Slots (9):** `display`, `ring`, `controls`, `laps`, `startButton`, `pauseButton`, `resetButton`, `lapButton`, `endButton`
- **Subcomponents Attached (5):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Timer.Display` | **`TimerDisplay`** | 1 | *none* | *none* |
| `Timer.Ring` | **`TimerProgressRing`** | 1 | *none* | *none* |
| `Timer.Controls` | **`TimerControls`** | 2 | `startButton`, `pauseButton`, `lapButton`, `endButton`, `resetButton` | `startButton`, `pauseButton`, `lapButton`, `endButton`, `resetButton` |
| `Timer.Laps` | **`TimerLaps`** | 2 | `item` | `item` |
| `Timer.LapItem` | **`TimerLapItem`** | 1 | *none* | *none* |

### 📦 `Toast` — [src/modules/core/components/toast/toast.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/toast/toast.tsx#L200)

- **Root Slots (0):** *none*
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Toast.Provider` | **`ToastProvider`** | 0 | *none* | *none* |
| `Toast.Queue` | **`ToastQueue`** | 0 | *none* | *none* |

### 📦 `Toolbar` — [src/modules/core/components/toolbar/toolbar.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/toolbar/toolbar.tsx#L309)

- **Root Slots (0):** *none*
- **Subcomponents Attached (4):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Toolbar.Provider` | **`ToolbarProvider`** | 0 | *none* | *none* |
| `Toolbar.Group` | **`ToolbarGroup`** | 2 | *none* | *none* |
| `Toolbar.Item` | **`ToolbarItem`** | 2 | *none* | *none* |
| `Toolbar.Separator` | **`ToolbarSeparator`** | 2 | *none* | *none* |

### 📦 `Tooltip` — [src/modules/core/components/tooltip/tooltip.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/tooltip/tooltip.tsx#L129)

- **Root Slots (1):** `arrow`
- **Subcomponents Attached (3):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Tooltip.Trigger` | **`TooltipTrigger`** | 1 | *none* | *none* |
| `Tooltip.Arrow` | **`TooltipArrow`** | 1 | *none* | *none* |
| `Tooltip.Content` | **`TooltipContent`** | 1 | *none* | *none* |

### 📦 `Tree` — [src/modules/core/components/tree/tree.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/tree/tree.tsx#L57)

- **Root Slots (0):** *none*
- **Subcomponents Attached (3):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Tree.Item` | **`TreeItem`** | 2 | *none* | *none* |
| `Tree.Content` | **`TreeContent`** | 2 | `dragButton`, `selectionCheckbox`, `indicator` | `dragButton`, `selectionCheckbox`, `indicator` |
| `Tree.Indicator` | **`TreeIndicator`** | 2 | `chevron` | `chevron` |

### 📦 `UsernameField` — [src/modules/core/components/username-field/username-field.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/username-field/username-field.tsx#L208)

- **Root Slots (5):** `label`, `description`, `error`, `input`, `status`
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `UsernameField.Status` | **`UsernameFieldStatus`** | 1 | *none* | *none* |
| `UsernameField.Input` | **`UsernameInput`** | 2 | `at`, `loader` | `loader`, `at` |

### 📦 `UsernameInput` — [src/modules/core/components/username-input/username-input.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/core/components/username-input/username-input.tsx#L90)

- **Root Slots (2):** `at`, `loader`
- **Subcomponents Attached (1):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `UsernameInput.At` | **`UsernameAtMark`** | 1 | *none* | *none* |

### 📦 `DndBoard` — [src/modules/dnd/components/dnd-board/dnd-board.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/dnd/components/dnd-board/dnd-board.tsx#L1580)

- **Root Slots (2):** `column`, `overlay`
- **Subcomponents Attached (5):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `DndBoard.Column` | **`DndBoardColumn`** | 2 | `header`, `handle`, `options`, `collapseButton`, `empty` | `empty`, `header` |
| `DndBoard.Item` | **`DndBoardItem`** | 2 | `handle` | `handle` |
| `DndBoard.Header` | **`DndBoardHeader`** | 2 | `handle`, `options`, `collapseButton` | `collapseButton`, `handle`, `options`, `handle`, `options`, `collapseButton` |
| `DndBoard.Handle` | **`DraggableHandle`** | 2 | `icon` | `icon` |
| `DndBoard.Overlay` | **`DragOverlay`** | 2 | *none* | *none* |

### 📦 `Draggable` — [src/modules/dnd/components/draggable/draggable.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/dnd/components/draggable/draggable.tsx#L190)

- **Root Slots (1):** `handle`
- **Subcomponents Attached (1):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Draggable.Handle` | **`DraggableHandle`** | 2 | `icon` | `icon` |

### 📦 `Droppable` — [src/modules/dnd/components/droppable/droppable.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/dnd/components/droppable/droppable.tsx#L263)

- **Root Slots (1):** `zone`
- **Subcomponents Attached (1):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Droppable.Zone` | **`DroppableZone`** | 2 | `icon`, `title`, `description` | `title`, `description`, `icon` |

### 📦 `Positionable` — [src/modules/dnd/components/positionable/positionable.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/dnd/components/positionable/positionable.tsx#L147)

- **Root Slots (1):** `handle`
- **Subcomponents Attached (1):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Positionable.Handle` | **`DraggableHandle`** | 2 | `icon` | `icon` |

### 📦 `Sortable` — [src/modules/dnd/components/sortable/sortable.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/dnd/components/sortable/sortable.tsx#L129)

- **Root Slots (1):** `handle`
- **Subcomponents Attached (1):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Sortable.Handle` | **`DraggableHandle`** | 2 | `icon` | `icon` |

### 📦 `SortableGrid` — [src/modules/dnd/components/sortable-grid/sortable-grid.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/dnd/components/sortable-grid/sortable-grid.tsx#L488)

- **Root Slots (3):** `item`, `empty`, `overlay`
- **Subcomponents Attached (3):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `SortableGrid.Item` | **`SortableGridItem`** | 2 | *none* | *none* |
| `SortableGrid.Empty` | **`SortableListEmpty`** | 2 | `icon` | `icon` |
| `SortableGrid.Overlay` | **`DragOverlay`** | 2 | *none* | *none* |

### 📦 `SortableList` — [src/modules/dnd/components/sortable-list/sortable-list.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/dnd/components/sortable-list/sortable-list.tsx#L549)

- **Root Slots (3):** `item`, `empty`, `overlay`
- **Subcomponents Attached (4):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `SortableList.Item` | **`SortableListItem`** | 2 | `handle` | `handle` |
| `SortableList.Handle` | **`DraggableHandle`** | 2 | `icon` | `icon` |
| `SortableList.Empty` | **`SortableListEmpty`** | 2 | `icon` | `icon` |
| `SortableList.Overlay` | **`DragOverlay`** | 2 | *none* | *none* |

### 📦 `Gantt` — [src/modules/gantt/components/gantt/gantt.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/gantt/components/gantt/gantt.tsx#L494)

- **Root Slots (9):** `toolbar`, `header`, `railCollapse`, `rail`, `row`, `grid`, `nowLine`, `dependencies`, `createStrip`
- **Subcomponents Attached (10):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Gantt.Toolbar` | **`GanttToolbar`** | 2 | `viewRange`, `search`, `filterTrigger`, `filterPopover` | `search`, `filterTrigger`, `filterPopover`, `viewRange` |
| `Gantt.Header` | **`GanttHeader`** | 2 | `railCollapse` | `railCollapse` |
| `Gantt.Rail` | **`GanttRail`** | 2 | `label`, `overflow` | `label`, `overflow` |
| `Gantt.Row` | **`GanttRow`** | 2 | `bar`, `startChip`, `endChip` | `bar`, `startChip`, `endChip` |
| `Gantt.Bar` | **`GanttBar`** | 2 | `label`, `datetimeStart`, `datetimeEnd`, `depDotStart`, `depDotEnd` | `datetimeStart`, `datetimeEnd`, `label`, `depDotStart`, `depDotEnd` |
| `Gantt.Grid` | **`GanttGrid`** | 2 | *none* | *none* |
| `Gantt.NowLine` | **`GanttNowLine`** | 2 | *none* | *none* |
| `Gantt.Dependencies` | **`GanttDependencies`** | 2 | *none* | *none* |
| `Gantt.EdgeChip` | **`GanttEdgeChip`** | 2 | *none* | *none* |
| `Gantt.CreateStrip` | **`GanttCreateStrip`** | 2 | *none* | *none* |

### 📦 `GanttToolbar` — [src/modules/gantt/components/gantt-toolbar/gantt-toolbar.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/gantt/components/gantt-toolbar/gantt-toolbar.tsx#L629)

- **Root Slots (4):** `viewRange`, `search`, `filterTrigger`, `filterPopover`
- **Subcomponents Attached (4):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `GanttToolbar.ViewRange` | **`GanttToolbarViewRange`** | 2 | `option` | `option` |
| `GanttToolbar.Search` | **`GanttToolbarSearch`** | 1 | *none* | *none* |
| `GanttToolbar.FilterTrigger` | **`GanttToolbarFilterTrigger`** | 1 | *none* | *none* |
| `GanttToolbar.FilterPopover` | **`GanttToolbarFilterPopover`** | 1 | *none* | *none* |

### 📦 `Map` — [src/modules/map/components/map/map.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/map/components/map/map.tsx#L549)

- **Root Slots (2):** `controls`, `loader`
- **Subcomponents Attached (21):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `Map.Globe` | **`GlobeMap`** | 2 | *none* | *none* |
| `Map.Controls` | **`MapControls`** | 2 | `zoomInIcon`, `zoomOutIcon`, `compassIcon`, `locateIcon`, `fullscreenIcon`, `autoRotateIcon`, `loader` | `zoomInIcon`, `zoomOutIcon`, `compassIcon`, `locateIcon`, `fullscreenIcon`, `autoRotateIcon`, `loader` |
| `Map.Legend` | **`MapLegend`** | 2 | `title`, `content`, `toggleIcon`, `icon` | `toggleIcon`, `icon`, `title`, `content` |
| `Map.Marker` | **`MapMarker`** | 2 | `content`, `pin` | `pin`, `content` |
| `Map.MarkerContent` | **`MarkerContent`** | 2 | `content` | `content` |
| `Map.MarkerPin` | **`MarkerPin`** | 2 | `icon` | `icon` |
| `Map.MarkerDot` | **`MarkerDot`** | 2 | `content` | `content` |
| `Map.MarkerPopup` | **`MarkerPopup`** | 2 | `closeIcon`, `content` | `closeIcon`, `content` |
| `Map.MarkerTooltip` | **`MarkerTooltip`** | 2 | `content` | `content` |
| `Map.MarkerLabel` | **`MarkerLabel`** | 2 | `content` | `content` |
| `Map.Popup` | **`MapPopup`** | 2 | `closeIcon`, `content` | `closeIcon`, `content` |
| `Map.Hover` | **`MapHover`** | 2 | `content` | `content` |
| `Map.Search` | **`MapSearch`** | 2 | `loader`, `marker` | `marker`, `loader` |
| `Map.Route` | **`MapRoute`** | 2 | `progress` | `progress` |
| `Map.RouteProgress` | **`RouteProgress`** | 2 | *none* | *none* |
| `Map.RouteMarker` | **`RouteMarker`** | 2 | `content` | `content` |
| `Map.Path` | **`MapPath`** | 2 | `route`, `marker` | `marker`, `route` |
| `Map.GeoJSON` | **`MapGeoJSON`** | 2 | *none* | *none* |
| `Map.Shape` | **`MapShape`** | 2 | `geojson` | `geojson` |
| `Map.Arc` | **`MapArc`** | 2 | `marker` | `marker` |
| `Map.ClusterLayer` | **`MapClusterLayer`** | 2 | `cluster` | `cluster` |

### 📦 `MapMarker` — [src/modules/map/components/map-marker/map-marker.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/map/components/map-marker/map-marker.tsx#L729)

- **Root Slots (2):** `content`, `pin`
- **Subcomponents Attached (6):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `MapMarker.Content` | **`MarkerContent`** | 2 | `content` | `content` |
| `MapMarker.Pin` | **`MarkerPin`** | 2 | `icon` | `icon` |
| `MapMarker.Dot` | **`MarkerDot`** | 2 | `content` | `content` |
| `MapMarker.Popup` | **`MarkerPopup`** | 2 | `closeIcon`, `content` | `closeIcon`, `content` |
| `MapMarker.Tooltip` | **`MarkerTooltip`** | 2 | `content` | `content` |
| `MapMarker.Label` | **`MarkerLabel`** | 2 | `content` | `content` |

### 📦 `MapRoute` — [src/modules/map/components/map-route/map-route.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/map/components/map-route/map-route.tsx#L512)

- **Root Slots (1):** `progress`
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `MapRoute.Progress` | **`RouteProgress`** | 2 | *none* | *none* |
| `MapRoute.Marker` | **`RouteMarker`** | 2 | `content` | `content` |

### 📦 `AudioPlayer` — [src/modules/media/components/audio-player/audio-player.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/media/components/audio-player/audio-player.tsx#L1397)

- **Root Slots (11):** `container`, `artwork`, `trackInfo`, `timeline`, `playButton`, `muteButton`, `volumeSlider`, `speedDropdown`, `importer`, `transcript`, `footer`
- **Subcomponents Attached (14):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `AudioPlayer.Provider` | **`AudioPlayerProvider`** | 0 | *none* | *none* |
| `AudioPlayer.Artwork` | **`AudioPlayerArtwork`** | 2 | `fallbackIcon` | `fallbackIcon` |
| `AudioPlayer.PlayButton` | **`AudioPlayerPlayButton`** | 2 | `playIcon`, `pauseIcon` | `playIcon`, `pauseIcon` |
| `AudioPlayer.Scrubber` | **`AudioPlayerScrubber`** | 2 | `scrubBar` | `scrubBar` |
| `AudioPlayer.Time` | **`AudioPlayerTime`** | 2 | `wrapper` | `wrapper` |
| `AudioPlayer.Duration` | **`AudioPlayerDuration`** | 2 | `wrapper` | `wrapper` |
| `AudioPlayer.MuteButton` | **`AudioPlayerMuteButton`** | 2 | `soundIcon`, `muteIcon` | `muteIcon`, `soundIcon` |
| `AudioPlayer.VolumeSlider` | **`AudioPlayerVolumeSlider`** | 2 | `wrapper` | `wrapper` |
| `AudioPlayer.SpeedButtonGroup` | **`AudioPlayerSpeedButtonGroup`** | 2 | `wrapper` | `wrapper` |
| `AudioPlayer.SpeedDropdown` | **`AudioPlayerSpeedDropdown`** | 2 | `trigger` | `trigger` |
| `AudioPlayer.TrackInfo` | **`AudioPlayerTrackInfo`** | 2 | `wrapper`, `artwork` | `artwork`, `wrapper` |
| `AudioPlayer.WaveformScrubber` | **`AudioPlayerWaveformScrubber`** | 2 | `scrubber` | `scrubber` |
| `AudioPlayer.Timeline` | **`AudioTimeline`** | 2 | `container`, `timestamp` | `timestamp`, `timestamp`, `timestamp`, `timestamp`, `container` |
| `AudioPlayer.Card` | **`AudioPlayerCard`** | 2 | `player`, `playButton` | `player` |

### 📦 `AudioPlayerCard` — [src/modules/media/components/audio-player/audio-player.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/media/components/audio-player/audio-player.tsx#L1583)

- **Root Slots (2):** `player`, `playButton`
- **Subcomponents Attached (1):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `AudioPlayerCard.Artwork` | **`AudioPlayerArtwork`** | 2 | `fallbackIcon` | `fallbackIcon` |

### 📦 `AudioPlayerButton` — [src/modules/media/components/audio-player-button/audio-player-button.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/media/components/audio-player-button/audio-player-button.tsx#L136)

- **Root Slots (2):** `playIcon`, `pauseIcon`
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `AudioPlayerButton.Pill` | **`AudioPlayerPill`** | 2 | `playIcon`, `pauseIcon`, `artwork` | `artwork`, `playIcon`, `pauseIcon`, `artwork`, `playIcon`, `pauseIcon` |
| `AudioPlayerButton.AudioPlayerPill` | **`AudioPlayerPill`** | 2 | `playIcon`, `pauseIcon`, `artwork` | `artwork`, `playIcon`, `pauseIcon`, `artwork`, `playIcon`, `pauseIcon` |

### 📦 `AudioPlayerPill` — [src/modules/media/components/audio-player-button/audio-player-button.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/media/components/audio-player-button/audio-player-button.tsx#L727)

- **Root Slots (3):** `playIcon`, `pauseIcon`, `artwork`
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `AudioPlayerPill.Visualizer` | **`MiniPillVisualizer`** | 2 | *none* | *none* |
| `AudioPlayerPill.AudioPlayerPill` | **`AudioPlayerPill`** | 2 | `playIcon`, `pauseIcon`, `artwork` | `artwork`, `playIcon`, `pauseIcon`, `artwork`, `playIcon`, `pauseIcon` |

### 📦 `AudioRecorder` — [src/modules/media/components/audio-recorder/audio-recorder.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/media/components/audio-recorder/audio-recorder.tsx#L301)

- **Root Slots (5):** `container`, `timer`, `waveform`, `timeline`, `importer`
- **Subcomponents Attached (6):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `AudioRecorder.Provider` | **`AudioRecorderProvider`** | 0 | *none* | *none* |
| `AudioRecorder.Timer` | **`AudioRecorderTimer`** | 2 | `label` | `label` |
| `AudioRecorder.Card` | **`AudioRecorderCard`** | 2 | `recorder`, `timer`, `waveform`, `timeline`, `importer` | `recorder` |
| `AudioRecorder.CardInner` | **`AudioRecorderCardInner`** | 2 | `timer`, `waveform`, `timeline`, `importer` | `timer`, `timeline`, `waveform`, `importer` |
| `AudioRecorder.Controls` | **`AudioRecorderControls`** | 2 | `recordButton` | `recordButton` |
| `AudioRecorder.LiveVisualizer` | **`AudioRecorderLiveVisualizer`** | 2 | `waveform` | `waveform` |

### 📦 `AudioRecorderButton` — [src/modules/media/components/audio-recorder-button/audio-recorder-button.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/media/components/audio-recorder-button/audio-recorder-button.tsx#L214)

- **Root Slots (4):** `micIcon`, `stopIcon`, `playIcon`, `pauseIcon`
- **Subcomponents Attached (3):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `AudioRecorderButton.SpeechInput` | **`SpeechInputButton`** | 2 | `trigger` | `trigger` |
| `AudioRecorderButton.Pill` | **`AudioRecorderPill`** | 2 | `micIcon`, `stopIcon`, `playIcon`, `pauseIcon`, `item` | `stopIcon`, `pauseIcon`, `playIcon`, `micIcon`, `item` |
| `AudioRecorderButton.MiniPillVisualizer` | **`MiniPillVisualizer`** | 2 | *none* | *none* |

### 📦 `AudioRecorderPill` — [src/modules/media/components/audio-recorder-button/audio-recorder-button.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/media/components/audio-recorder-button/audio-recorder-button.tsx#L1261)

- **Root Slots (5):** `micIcon`, `stopIcon`, `playIcon`, `pauseIcon`, `item`
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `AudioRecorderPill.Visualizer` | **`MiniPillVisualizer`** | 2 | *none* | *none* |
| `AudioRecorderPill.MiniPillVisualizer` | **`MiniPillVisualizer`** | 2 | *none* | *none* |

### 📦 `AudioSourcePicker` — [src/modules/media/components/audio-source-picker/audio-source-picker.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/media/components/audio-source-picker/audio-source-picker.tsx#L483)

- **Root Slots (2):** `icon`, `progress`
- **Subcomponents Attached (6):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `AudioSourcePicker.Dropzone` | **`AudioSourcePickerDropzone`** | 1 | *none* | *none* |
| `AudioSourcePicker.Icon` | **`AudioSourcePickerIcon`** | 2 | `icon` | `icon` |
| `AudioSourcePicker.Label` | **`AudioSourcePickerLabel`** | 1 | *none* | *none* |
| `AudioSourcePicker.Hint` | **`AudioSourcePickerHint`** | 1 | *none* | *none* |
| `AudioSourcePicker.Progress` | **`AudioSourcePickerProgress`** | 2 | `progress` | `progress` |
| `AudioSourcePicker.Input` | **`AudioSourcePickerInput`** | 1 | *none* | *none* |

### 📦 `AudioTimeline` — [src/modules/media/components/audio-timeline/audio-timeline.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/media/components/audio-timeline/audio-timeline.tsx#L266)

- **Root Slots (2):** `container`, `timestamp`
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `AudioTimeline.Slider` | **`AudioTimelineSlider`** | 2 | *none* | *none* |
| `AudioTimeline.Timestamp` | **`AudioTimelineTimestamp`** | 2 | *none* | *none* |

### 📦 `BarVisualizer` — [src/modules/media/components/bar-visualizer/bar-visualizer.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/media/components/bar-visualizer/bar-visualizer.tsx#L266)

- **Root Slots (1):** `bar`
- **Subcomponents Attached (1):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `BarVisualizer.Bar` | **`BarVisualizerBar`** | 1 | *none* | *none* |

### 📦 `MediaImage` — [src/modules/media/components/media-image/media-image.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/media/components/media-image/media-image.tsx#L97)

- **Root Slots (1):** `zoomIcon`
- **Subcomponents Attached (2):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `MediaImage.Preview` | **`MediaPreview`** | 2 | `closeIcon` | `closeIcon` |
| `MediaImage.ThumbnailButton` | **`ThumbnailButton`** | 2 | `playIcon` | `playIcon` |

### 📦 `MicSelector` — [src/modules/media/components/mic-selector/mic-selector.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/media/components/mic-selector/mic-selector.tsx#L276)

- **Root Slots (4):** `muteButton`, `icon`, `item`, `preview`
- **Subcomponents Attached (1):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `MicSelector.MuteButton` | **`MicSelectorMuteButton`** | 1 | *none* | *none* |

### 📦 `TranscriptViewer` — [src/modules/media/components/transcript-viewer/transcript-viewer.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/media/components/transcript-viewer/transcript-viewer.tsx#L833)

- **Root Slots (4):** `container`, `words`, `playButton`, `scrubBar`
- **Subcomponents Attached (12):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `TranscriptViewer.Root` | **`TranscriptViewerContainer`** | 2 | `container` | `container` |
| `TranscriptViewer.Container` | **`TranscriptViewerContainer`** | 2 | `container` | `container` |
| `TranscriptViewer.Header` | **`TranscriptViewerHeader`** | 2 | *none* | *none* |
| `TranscriptViewer.Body` | **`TranscriptViewerBody`** | 2 | `words` | `words` |
| `TranscriptViewer.Search` | **`TranscriptViewerSearch`** | 2 | *none* | *none* |
| `TranscriptViewer.Transport` | **`TranscriptViewerTransport`** | 2 | `playButton`, `scrubBar` | `playButton`, `scrubBar` |
| `TranscriptViewer.Word` | **`TranscriptViewerWord`** | 2 | `wrapper` | `wrapper` |
| `TranscriptViewer.Words` | **`TranscriptViewerWords`** | 2 | `glider` | `glider` |
| `TranscriptViewer.PlayPauseButton` | **`TranscriptViewerPlayPauseButton`** | 2 | `playIcon`, `pauseIcon` | `pauseIcon`, `playIcon` |
| `TranscriptViewer.ScrubBar` | **`TranscriptViewerScrubBar`** | 2 | `scrubBar` | *none* |
| `TranscriptViewer.Time` | **`TranscriptViewerTime`** | 2 | `label` | `label` |
| `TranscriptViewer.Duration` | **`TranscriptViewerDuration`** | 2 | `label` | `label` |

### 📦 `VideoPlayer` — [src/modules/media/components/video-player/video-player.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/media/components/video-player/video-player.tsx#L224)

- **Root Slots (10):** `container`, `controls`, `topBar`, `scrubber`, `playButton`, `muteButton`, `volumeSlider`, `time`, `fullscreenButton`, `actionRow`
- **Subcomponents Attached (10):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `VideoPlayer.Controls` | **`VideoPlayerControls`** | 2 | `wrapper` | `wrapper` |
| `VideoPlayer.TopBar` | **`VideoPlayerTopBar`** | 2 | `wrapper` | `wrapper` |
| `VideoPlayer.Scrubber` | **`VideoPlayerScrubber`** | 2 | `track` | `track` |
| `VideoPlayer.PlayButton` | **`VideoPlayerPlayButton`** | 2 | `playIcon`, `pauseIcon` | `pauseIcon`, `playIcon` |
| `VideoPlayer.MuteButton` | **`VideoPlayerMuteButton`** | 2 | `soundIcon`, `muteIcon` | `muteIcon`, `soundIcon` |
| `VideoPlayer.VolumeSlider` | **`VideoPlayerVolumeSlider`** | 2 | `wrapper` | `wrapper` |
| `VideoPlayer.Time` | **`VideoPlayerTime`** | 2 | `label` | `label` |
| `VideoPlayer.FullscreenButton` | **`VideoPlayerFullscreenButton`** | 2 | `enterIcon`, `exitIcon` | `exitIcon`, `enterIcon` |
| `VideoPlayer.ActionRow` | **`VideoPlayerActionRow`** | 2 | `row` | `row` |
| `VideoPlayer.Default` | **`VideoPlayerDefault`** | 2 | `scrubber` | `scrubber` |

### 📦 `TourCard` — [src/modules/onboarding/components/tour-card/tour-card.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/onboarding/components/tour-card/tour-card.tsx#L123)

- **Root Slots (4):** `arrow`, `header`, `body`, `footer`
- **Subcomponents Attached (7):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `TourCard.Header` | **`TourCardHeader`** | 2 | `title`, `description` | `title`, `description` |
| `TourCard.Title` | **`TourCardTitle`** | 2 | *none* | *none* |
| `TourCard.Description` | **`TourCardDescription`** | 2 | *none* | *none* |
| `TourCard.Body` | **`TourCardBody`** | 2 | `description` | `description` |
| `TourCard.Footer` | **`TourCardFooter`** | 2 | `dots`, `progress` | `dots`, `progress` |
| `TourCard.Dots` | **`TourCardDots`** | 2 | *none* | *none* |
| `TourCard.Progress` | **`TourCardProgress`** | 2 | *none* | *none* |

### 📦 `SoundTrigger` — [src/modules/sound/components/sound-trigger/sound-trigger.tsx](file:///Users/tirthkpatel/Desktop/workspace/products/consona/interface/src/modules/sound/components/sound-trigger/sound-trigger.tsx#L341)

- **Root Slots (5):** `icon`, `rightIcon`, `indicator`, `loader`, `label`
- **Subcomponents Attached (5):**

| Static Property | Attached Subcomponent | Generics | Slots Declared | Dispatched |
| :--- | :--- | :---: | :--- | :--- |
| `SoundTrigger.Icon` | **`SoundTriggerIcon`** | 1 | *none* | *none* |
| `SoundTrigger.RightIcon` | **`SoundTriggerRightIcon`** | 1 | *none* | *none* |
| `SoundTrigger.Indicator` | **`SoundTriggerIndicator`** | 1 | *none* | *none* |
| `SoundTrigger.Loader` | **`SoundTriggerLoader`** | 1 | *none* | *none* |
| `SoundTrigger.Label` | **`SoundTriggerLabel`** | 1 | *none* | *none* |

