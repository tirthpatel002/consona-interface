# 🌐 Consona Interface Root Catalog

> **Universal Interface Registry & Architecture Index (v1.0.0)**

**Generated:** 2026-09-23T14:30:52.687Z  
**Overview:** **584** Components | **10** Engines | **93** Hooks | **17** Providers | **8** Plugins

---

## 📊 Module Catalog Index

| Module | Subpath | Components | Engines | Hooks | Providers |
| :--- | :--- | :---: | :---: | :---: | :---: |
| [**`Core`**](#module-@consona/interface) | `@consona/interface` | 461 | 0 | 39 | 6 |
| [**`Registry`**](#module-@consona/interface/registry) | `@consona/interface/registry` | 0 | 0 | 0 | 0 |
| [**`Charts`**](#module-@consona/interface/charts) | `@consona/interface/charts` | 26 | 0 | 4 | 1 |
| [**`Composites`**](#module-@consona/interface/composites) | `@consona/interface/composites` | 0 | 0 | 0 | 0 |
| [**`Glass`**](#module-@consona/interface/glass) | `@consona/interface/glass` | 1 | 1 | 2 | 1 |
| [**`Interaction`**](#module-@consona/interface/interaction) | `@consona/interface/interaction` | 3 | 1 | 3 | 1 |
| [**`Map`**](#module-@consona/interface/map) | `@consona/interface/map` | 22 | 1 | 7 | 0 |
| [**`Media`**](#module-@consona/interface/media) | `@consona/interface/media` | 50 | 3 | 21 | 3 |
| [**`Navigation`**](#module-@consona/interface/navigation) | `@consona/interface/navigation` | 3 | 1 | 1 | 1 |
| [**`Onboarding`**](#module-@consona/interface/onboarding) | `@consona/interface/onboarding` | 13 | 1 | 6 | 2 |
| [**`Orb`**](#module-@consona/interface/orb) | `@consona/interface/orb` | 1 | 1 | 3 | 1 |
| [**`Overlay`**](#module-@consona/interface/overlay) | `@consona/interface/overlay` | 4 | 1 | 7 | 1 |

---

## 📦 Detailed Module Breakdowns

<a id="module-@consona/interface"></a>
### Module: `Core` (`@consona/interface`)

Core module for @consona/interface

#### Components (461)
- **`Accordion`** (layout): Expandable disclosure accordion matrix with bordered, separated, and flush optical variants. (Subcomponents: AccordionItem, AccordionTrigger, AccordionHeading, AccordionContent, Collapsible)
- **`AccordionItem`** (layout): Individual expandable panel item within an accordion group.
- **`AccordionHeading`** (layout): Heading container wrapping accordion triggers.
- **`AccordionTrigger`** (layout): Clickable header trigger toggling accordion expansion state with smooth chevron rotation.
- **`AccordionContent`** (layout): Collapsible content panel container housing child elements.
- **`Collapsible`** (layout): Alias for AccordionItem component.
- **`AspectRatio`** (layout): Container enforcing exact geometric width-to-height proportions across responsive viewports.
- **`Avatar`** (layout): Visual user avatar element with image loading fallbacks, concentric squircle/circle curvature, initials rendering, and status indicator slots. (Subcomponents: AvatarBadge, AvatarGroup)
- **`AvatarBadge`** (layout): Status indicator dot pinned to the corner of an Avatar.
- **`AvatarGroup`** (layout): Stacked group container displaying overlapping avatars with excess counter support.
- **`Badge`** (feedback): Compact status badge indicator with optical geometry and semantic intent ramps. (Subcomponents: Tag, Chip)
- **`Tag`** (feedback): Aliases for Badge
- **`Chip`** (feedback): Alias for Badge component.
- **`BentoCard`** (layout): Spanning card cell within a BentoGrid featuring media header, icon, and CTA slots.
- **`BentoGrid`** (layout): Modern asymmetrical bento grid layout with responsive spanning cards and hover elevation. (Subcomponents: BentoCard)
- **`Breadcrumbs`** (navigation): Hierarchical navigation trail with custom separators, truncating ellipsis, and current page ARIA semantics. (Subcomponents: BreadcrumbItem, BreadcrumbSeparator)
- **`BreadcrumbItem`** (navigation): Individual navigation segment within breadcrumb trails with optional hover level menus.
- **`BreadcrumbSeparator`** (navigation): Divider glyph between consecutive breadcrumb items.
- **`Button`** (form): Accessible interactive button with optical geometry, lifecycle states (idle/loading/success/error), intent ramps, and slot injection. (Subcomponents: ButtonGroup, ToggleButton, ButtonWithIndicator)
- **`ButtonWithIndicator`** (form): Button with real-time status indicator badge dot.
- **`ButtonGroup`** (form): Connected button group with unified optical corner radii.
- **`ToggleButton`** (form): Two-state toggle button with optical geometry and selected state styling.
- **`CalendarHeading`** (typography): Accessible calendar month/year heading for compound header composition.
- **`CalendarNavButton`** (form): Previous/next page button for compound calendar header composition.
- **`CalendarHeaderCell`** (layout): Weekday label cell for compound calendar grid header composition.
- **`CalendarHeader`** (layout): Header container containing month/year pickers and pagination navigation buttons.
- **`CalendarGridHeader`** (layout): Days of week table header inside the calendar grid.
- **`CalendarGridBody`** (layout): Grid body container housing individual calendar cells.
- **`CalendarCellIndicator`** (form): Current-day marker rendered inside a calendar cell. Replace via slots.cellIndicator / slots.indicator.
- **`CalendarRemaining`** (form): Countdown caption showing how much time remains until maxValue or the selected date.
- **`CalendarCell`** (form): Interactive day cell with active selection, today marker slot, and keyboard focus rings.
- **`CalendarMonthPicker`** (form): Accessible month dropdown picker helper for date navigation.
- **`CalendarYearPicker`** (form): Accessible year dropdown picker helper for date navigation.
- **`CalendarGrid`** (layout): Calendar matrix grid displaying monthly day cells.
- **`Calendar`** (form): Accessible single-date calendar grid with month/year navigation and optical geometry. (Subcomponents: CalendarHeader, CalendarHeading, CalendarNavButton, CalendarHeaderCell, CalendarGridHeader, CalendarGrid, CalendarGridBody, CalendarCell, CalendarCellIndicator, CalendarRemaining, CalendarMonthPicker, CalendarYearPicker)
- **`RangeCalendar`** (form): Accessible date range calendar grid supporting multi-month spans and optical cell selection. (Subcomponents: CalendarHeader, CalendarHeading, CalendarNavButton, CalendarHeaderCell, CalendarGrid, CalendarGridHeader, CalendarGridBody, CalendarCell, CalendarCellIndicator, CalendarRemaining)
- **`Card`** (data): Concentric card container with optical macro geometry, surface variants, and composite anatomy. (Subcomponents: CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction)
- **`CardHeader`** (data): Header container organizing card title and description.
- **`CardTitle`** (data): Heading title element for card components.
- **`CardDescription`** (data): Supporting description text for card headers.
- **`CardContent`** (data): Main body content section for cards.
- **`CardFooter`** (data): Action footer container for cards.
- **`CardAction`** (data): Absolute top-right action trigger container within cards.
- **`CarouselContent`** (layout): Viewport and track container for carousel slides.
- **`CarouselItem`** (layout): Individual slide container inside CarouselContent.
- **`CarouselHandler`** (layout): Navigation action container holding previous/next buttons.
- **`CarouselButton`** (form): Previous or next navigation trigger button for Carousel.
- **`CarouselDots`** (feedback): Interactive dot indicators for direct slide jumping in Carousel.
- **`CarouselThumb`** (layout): Single clickable thumbnail card inside CarouselThumbnails.
- **`CarouselThumbnails`** (layout): Horizontal thumbnail strip for previewing and selecting Carousel slides.
- **`CarouselProgress`** (feedback): Smooth animated progress bar for Carousel tracking active slide percentage.
- **`CarouselCounter`** (feedback): Tabular slide number indicator (e.g. 1 / 5) for Carousel.
- **`Carousel`** (layout): Draggable touch and mouse slide carousel with Embla engine, pagination dots, thumbnails, and progress meter. (Subcomponents: CarouselContent, CarouselItem, CarouselHandler, CarouselButton, CarouselDots, CarouselThumb, CarouselThumbnails, CarouselThumbs, CarouselProgress, CarouselCounter)
- **`CarouselThumbs`** (layout): Alias for CarouselThumbnails component.
- **`ChapterScrubberTick`** (navigation): Kinetic tick mark atom with raised-cosine wave magnification for chapter scrubber rails.
- **`ChapterScrubberCard`** (navigation): Floating popover preview card displaying chapter metadata, media thumbnail, and description.
- **`ChapterScrubber`** (navigation): Fluid kinetic timeline scrubber rail with raised-cosine wave magnification, spatial preview cards, and keyboard navigation. (Subcomponents: ChapterScrubberCard, ChapterScrubberTick)
- **`Scrubber`** (navigation): Alias for ChapterScrubber component.
- **`CheckboxGroup`** (form): Accessible group container for multiple related checkboxes.
- **`CheckboxField`** (form): Grid layout container combining checkbox indicator with label and description.
- **`Checkbox`** (form): Accessible checkbox control with concentric optical atom radius and intermediate state. (Subcomponents: CheckboxGroup, CheckboxField)
- **`ChoiceBox`** (form): Selectable card grid container organizing multi-attribute radio or checkbox choice cards. (Subcomponents: ChoiceBoxItem, ChoiceBoxLabel, ChoiceBoxDescription)
- **`ChoiceBoxItem`** (form): Selectable card item within ChoiceBox with title, description, and indicator slots.
- **`ChoiceBoxLabel`** (form): Title heading text within a ChoiceBoxItem.
- **`ChoiceBoxDescription`** (form): Supporting description text within a ChoiceBoxItem.
- **`RadioCards`** (form): Alias for ChoiceBox component.
- **`RadioCard`** (form): Alias for ChoiceBoxItem component.
- **`ClockAnalog`** (data): Analog clock face rendering circular hour/minute tracks and ticking hands.
- **`ClockDigital`** (data): Digital numbers readout displaying hours, minutes, seconds, and AM/PM tag.
- **`ClockTimezone`** (data): Timezone selector badge / dropdown list for switching active world clock location.
- **`Clock`** (data): Analog and digital temporal clock display with live timezones and smooth second sweeping. (Subcomponents: ClockAnalog, ClockDigital, ClockTimezone)
- **`ColorArea`** (form): 2D saturation and brightness picker area for color selection.
- **`ColorField`** (form): Formatted text input field for editing color hexadecimal and channel values.
- **`ColorPicker`** (form): Universal coordinating container managing synchronized state for ColorArea, ColorSlider, ColorField, and EyeDropper. (Subcomponents: ColorArea, ColorSlider, ColorSliderOutput, ColorSliderTrack, ColorThumb, ColorWheel, ColorField, ColorSwatch, ColorSwatchPicker, ColorSwatchPickerItem, EyeDropper)
- **`EyeDropper`** (form): Native browser EyeDropper API button that picks any pixel color from the screen.
- **`ColorSlider`** (form): 1D channel color slider (Hue, Alpha, Saturation, Lightness). (Subcomponents: ColorSliderOutput, ColorSliderTrack, ColorThumb)
- **`ColorSliderOutput`** (form): Value output display for ColorSlider.
- **`ColorSliderTrack`** (form): Track container for ColorSlider.
- **`ColorSwatchPicker`** (form): Palette grid of selectable color swatches. (Subcomponents: ColorSwatchPickerItem)
- **`ColorSwatchPickerItem`** (form): Selectable swatch item within ColorSwatchPicker.
- **`ColorSwatch`** (form): Visual color tile swatch previewing solid or translucent color values.
- **`ColorThumb`** (form): Interactive cursor thumb indicator for color areas, sliders, and wheels.
- **`ColorWheel`** (form): Circular radial color wheel for hue selection.
- **`ComboBox`** (form): Filterable auto-complete dropdown select input with keyboard navigation and listbox selection. (Subcomponents: ComboBoxInput, ComboBoxContent, ComboBoxItem, ComboBoxSection, ComboBoxHeader, ComboBoxSeparator, ComboBoxValue, ComboBoxLabel, ComboBoxDescription)
- **`ComboBoxInput`** (form): Text input triggering the filterable ComboBox popover dropdown.
- **`ComboBoxContent`** (form): Floating popover container with scrollable listbox items for ComboBox.
- **`ComboBoxItem`** (form): Selectable item row inside the ComboBox listbox.
- **`ComboBoxSection`** (form): Grouped section container within ComboBox listbox.
- **`ComboBoxHeader`** (form): Section header label within ComboBox listbox.
- **`ComboBoxSeparator`** (form): Visual dividing separator rule within ComboBox listbox.
- **`ComboBoxValue`** (form): Current selected value presenter within ComboBox.
- **`ComboBoxLabel`** (form): Title heading text within a ComboBox item or dropdown.
- **`ComboBoxDescription`** (form): Secondary description text within a ComboBox item or dropdown.
- **`Autocomplete`** (form): Alias for ComboBox component.
- **`CommandMenu`** (overlay): Spotlight modal command palette with instant search, group headers, and keyboard shortcut execution. (Subcomponents: CommandMenuSearch, CommandMenuList, CommandMenuSection, CommandMenuItem, CommandMenuDescription, CommandMenuSeparator, CommandMenuFooter, CommandMenuLabel, CommandMenuShortcut)
- **`CommandMenuSearch`** (overlay): Header search input field for the CommandMenu with pending loader and Esc badge.
- **`CommandMenuList`** (overlay): Scrollable item list container with built-in empty results feedback.
- **`CommandMenuSection`** (overlay): Categorized group section inside CommandMenuList with section header title.
- **`CommandMenuItem`** (overlay): Selectable command row with keyboard focus indicator, icon slot, and shortcut display.
- **`CommandMenuDescription`** (overlay): Secondary contextual description text aligned alongside a CommandMenuItem.
- **`CommandMenuSeparator`** (overlay): Horizontal divider separating command item categories.
- **`CommandMenuFooter`** (overlay): Bottom footer banner displaying keyboard shortcut helpers and command navigation tips.
- **`CommandMenuLabel`** (overlay): Standalone label or title header within CommandMenu sections.
- **`CommandMenuShortcut`** (overlay): Keyboard shortcut badge right-aligned within a CommandMenuItem.
- **`CommandPalette`** (overlay): Additional CSS class names. */ className?: string } const CommandMenuShortcutPrimitive = ({ className, ...props }: CommandMenuShortcutProps) => ( <span data-slot="command-menu-shortcut" className={cn( 'ml-auto inline-flex items-center gap-0.5 font-mono text-[10px] tracking-widest text-muted-fg', className )} {...props} /> ) export const CommandMenuShortcut = createInterfaceComponent<CommandMenuShortcutProps>( { name: 'CommandMenuShortcut', category: 'overlay', description: 'Keyboard shortcut badge right-aligned within a CommandMenuItem.', version: '1.0.0', }, CommandMenuShortcutPrimitive ) /* ========================================================================== Aliases & Compound Namespace Attachments ==========================================================================
- **`CommandPaletteSearch`** (overlay): Alias for CommandMenuSearch component.
- **`CommandPaletteList`** (overlay): Alias for CommandMenuList component.
- **`CommandPaletteSection`** (overlay): Alias for CommandMenuSection component.
- **`CommandPaletteItem`** (overlay): Alias for CommandMenuItem component.
- **`CommandPaletteDescription`** (overlay): Alias for CommandMenuDescription component.
- **`CommandPaletteSeparator`** (overlay): Alias for CommandMenuSeparator component.
- **`CommandPaletteFooter`** (overlay): Alias for CommandMenuFooter component.
- **`CommandPaletteLabel`** (overlay): Alias for CommandMenuLabel component.
- **`CommandPaletteShortcut`** (overlay): Alias for CommandMenuShortcut component.
- **`ComparePaneHandle`** (layout): Draggable separator handle for ComparePane with slider semantics and circular grip.
- **`ComparePaneFirst`** (layout): First (before/left/top) clipped layer in a ComparePane.
- **`ComparePaneSecond`** (layout): Second (after/right/bottom) base layer in a ComparePane.
- **`ComparePaneLabel`** (layout): Floating status label badge over ComparePane halves.
- **`ComparePane`** (layout): Interactive before-and-after comparison slider driving zero-rerender CSS clip-path transformations. (Subcomponents: ComparePaneHandle, ComparePaneDivider, ComparePaneFirst, ComparePaneSecond, ComparePaneLabel)
- **`ComparePaneDivider`** (layout): Alias for ComparePaneHandle component.
- **`ContextMenu`** (overlay): Right-click contextual action menu anchored to mouse pointer coordinates. (Subcomponents: ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuSection, ContextMenuHeader, ContextMenuLabel, ContextMenuShortcut, ContextMenuSub)
- **`ContextMenuTrigger`** (overlay): Target wrapper element that activates the ContextMenu on secondary/right click.
- **`ContextMenuContent`** (overlay): Floating popover and action menu content container for ContextMenu.
- **`DataSelectionBarSearch`** (data): Context-connected search input with clear trigger for DataSelectionBar.
- **`DataSelectionBarCategorySelect`** (data): Category dropdown switcher for instant faceted data filtering.
- **`DataSelectionBarFilterBuilder`** (data): Interactive condition and operator query rule builder for DataSelectionBar.
- **`DataSelectionBarSortMenu`** (data): Multi-field sorting popover menu with ascending and descending direction indicators.
- **`DataSelectionBarActions`** (data): Custom toolbar action buttons container in DataSelectionBar.
- **`DataSelectionBarFilterBadge`** (data): Removable filter badge token representing an active filter rule.
- **`DataSelectionBarFilterStrip`** (data): Horizontal active filter pills container with clear all trigger.
- **`DataSelectionBar`** (data): Universal data toolbar with search debouncing, structured query filter builder, category pills, and multi-field sorting. (Subcomponents: DataSelectionBarSearch, DataSelectionBarCategorySelect, DataSelectionBarFilterBuilder, DataSelectionBarSortMenu, DataSelectionBarFilterStrip, DataSelectionBarFilterBadge, DataSelectionBarActions)
- **`DataTablePagination`** (data): Dedicated pagination footer with row counts, page size selector, and accessible page buttons for DataTable.
- **`DataTableSearch`** (data): Context-connected global search input for DataTable filtering.
- **`DataTableSelectionBadge`** (data): Counter badge reflecting selected row count in DataTable.
- **`DataTableColumnVisibility`** (data): Popover menu to toggle column visibility dynamically.
- **`DataTableToolbarActions`** (data): Container for custom right-side actions inside DataTableToolbar.
- **`DataTableToolbar`** (data): Top action toolbar housing Search, SelectionBadge, ColumnVisibility, and ToolbarActions.
- **`DataTableLoader`** (data): Animated loader indicator rendered during DataTable loading state.
- **`DataTableEmptyState`** (data): Empty state illustration rendered when table has no data records.
- **`DataTableHeaderCell`** (data): Header column cell with sorting, context menu, and column resizing.
- **`DataTableHeader`** (data): Header container containing all column header cells and select-all trigger.
- **`DataTableCell`** (data): Data cell component with sticky alignment and formatted value rendering.
- **`DataTableRow`** (data): Table row component with selection checkbox and actions dropdown.
- **`DataTableBody`** (data): Table body container rendering rows, loading states, or empty states.
- **`DataTableContainer`** (data): Scrollable container housing table header, column groups, and body.
- **`DataTable`** (data): Enterprise data table with sticky column freezing, interactive column resizing, sorting, row pinning, and pagination. (Subcomponents: DataTableToolbar, DataTableSearch, DataTableSelectionBadge, DataTableColumnVisibility, DataTableToolbarActions, DataTableContainer, DataTableHeader, DataTableHeaderCell, DataTableBody, DataTableRow, DataTableCell, DataTableLoader, DataTableEmptyState, DataTablePagination)
- **`DateSegment`** (form): Individual editable temporal segment inside a date/time input.
- **`DateInput`** (form): Segmented input field container rendering date parts with keyboard and stepper control.
- **`DateField`** (form): Accessible date input field managing date values without a calendar popover. (Subcomponents: DateInput, DateSegment)
- **`DatePickerTrigger`** (form): Input group trigger with embedded calendar button for activating the date picker.
- **`DatePickerOverlay`** (form): Adaptive popover / mobile sheet overlay housing calendar picker components.
- **`DatePicker`** (form): Accessible date picker control combining segmented text input with an interactive calendar popover. (Subcomponents: DatePickerTrigger, DatePickerOverlay, Calendar, RangeCalendar, DateInput, DateSegment, CalendarCellIndicator, CalendarRemaining)
- **`DateRangePickerTrigger`** (form): Segmented start/end date input pair with date range icon trigger button.
- **`DateRangePicker`** (form): Accessible date span picker with start/end input segments and dual-range calendar popover. (Subcomponents: DateRangePickerTrigger, DatePickerOverlay, RangeCalendar, DateInput, DateSegment, CalendarCellIndicator, CalendarRemaining)
- **`DateTime`** (form): Composite form control with formatted label, range markers, and embedded DateTimePicker popup. (Subcomponents: CalendarCellIndicator, CalendarRemaining)
- **`DateTimePresets`** (form): Quick jump preset chips row for rapid temporal range and single date selection.
- **`DateTimeTabs`** (form): Segmented date vs time tab bar switcher.
- **`DateTimeTimeTarget`** (form): Target temporal boundary switcher (Synced, Start, End) for range time selection.
- **`DateTimeFooter`** (form): Action footer bar housing Clear and Done/Next buttons.
- **`DateTimeCalendar`** (form): Context-connected calendar view for DateTimeContent compound composition.
- **`DateTimeTimeWheel`** (form): Context-connected time wheel view for DateTimeContent compound composition.
- **`DateTimeContent`** (form): Internal composite panel housing Calendar, TimeWheel, Presets bar, and Action controls. (Subcomponents: DateTimePresets, DateTimeTabs, DateTimeTimeTarget, DateTimeCalendar, DateTimeTimeWheel, DateTimeFooter, CalendarCellIndicator, CalendarRemaining)
- **`DateTimePicker`** (form): High-precision composite temporal picker composing Calendar, TimeWheel, Presets bar, and Footer actions. (Subcomponents: DateTimeContent, DateTimePresets, DateTimeTabs, DateTimeTimeTarget, DateTimeCalendar, DateTimeTimeWheel, DateTimeFooter, InteractiveTimeWheel, DrumColumn, CalendarCellIndicator, CalendarRemaining)
- **`DescriptionList`** (data): Structured key-value metadata list component with responsive grid alignment. (Subcomponents: DescriptionTerm, DescriptionDetails)
- **`DescriptionTerm`** (data): Label term element inside a DescriptionList.
- **`DescriptionDetails`** (data): Value details element corresponding to a term inside a DescriptionList.
- **`DiffViewer`** (data): Side-by-side or unified code diff viewer with live addition/deletion metrics and draggable comparison split.
- **`DrawerContent`** (overlay): Animated slide-in drawer surface with gesture drag dismissal, backdrop blur, and optical radius.
- **`Drawer`** (overlay): Root trigger container for the Drawer overlay system. Wraps DialogTrigger with slot-based open state. (Subcomponents: DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerBody, DrawerFooter, DrawerClose, DrawerNotch)
- **`DrawerNotch`** (overlay): Drag handle notch affordance displayed at the edge of bottom/top drawers.
- **`DrawerHeader`** (overlay): Structural header container for Drawer title and description.
- **`DrawerTitle`** (overlay): Accessible heading for drawer dialogs with automatic ARIA association.
- **`DrawerDescription`** (overlay): Supporting description text for drawer dialogs.
- **`DrawerBody`** (overlay): Scrollable content body section for drawer dialogs.
- **`DrawerFooter`** (overlay): Action footer container for drawer dialogs.
- **`DrawerClose`** (overlay): Close/dismiss button for drawer dialogs with slot=
- **`Sheet`** (overlay): Callback invoked when the close button is pressed. */ onClose?: () => void } const DrawerClosePrimitive = ({ className, onClose, children, ...props }: DrawerCloseProps) => ( <RACButton slot="close" data-slot="drawer-close" onPress={onClose} className={cn( 'inline-flex items-center justify-center gap-space-xs rounded-base border border-border/60 px-space-md py-space-xs text-sm font-medium', 'bg-secondary text-fg hover:bg-muted transition-colors cursor-pointer outline-none', className )} {...props as any} > {children ?? <XMarkIcon className="size-4" />} </RACButton> ) export const DrawerClose = createInterfaceComponent<DrawerCloseProps>( { name: 'DrawerClose', category: 'overlay', description: 'Close/dismiss button for drawer dialogs with slot="close" aria binding.', version: '1.0.0', }, DrawerClosePrimitive ) /* ========================================================================== Aliases & Compound Namespace Attachments ==========================================================================
- **`SheetContent`** (overlay): Alias for DrawerContent component.
- **`SheetHeader`** (overlay): Alias for DrawerHeader component.
- **`SheetTitle`** (overlay): Alias for DrawerTitle component.
- **`SheetDescription`** (overlay): Alias for DrawerDescription component.
- **`SheetBody`** (overlay): Alias for DrawerBody component.
- **`SheetFooter`** (overlay): Alias for DrawerFooter component.
- **`SheetClose`** (overlay): Alias for DrawerClose component.
- **`DropZone`** (form): Drag-and-drop file upload target zone with drop target indicators.
- **`EmailField`** (form): Email field with format validation, domain allowlist/denylist, and a leading envelope icon. (Subcomponents: EmailInput)
- **`EmailInput`** (form): Single-line email input atom with a leading envelope icon.
- **`EmptyState`** (feedback): Zero-data placeholder with illustration slot, title, description, and primary/secondary actions. (Subcomponents: EmptyStateTitle, EmptyStateDescription, EmptyStateActions)
- **`EmptyStateActions`** (feedback): Action row for empty-state primary and secondary buttons.
- **`Label`** (form): Accessible form field label with auto-required asterisk and disabled state handling.
- **`Description`** (form): Help text description associated with accessible form controls.
- **`FieldError`** (form): Accessible validation error message rendered conditionally upon invalid input.
- **`Field`** (form): Layout container managing vertical rhythm for label, control, and feedback text. (Subcomponents: Label, Description, FieldError, FieldGroup, Fieldset, Legend)
- **`FieldGroup`** (form): Vertical stack layout for multiple related form fields.
- **`Fieldset`** (form): Semantic HTML fieldset wrapper for grouping related controls with legend support.
- **`Legend`** (form): Caption element for a fieldset grouping.
- **`FileTrigger`** (form): Accessible button trigger opening the native OS file upload picker dialog with icon variants.
- **`Font`** (typography): Dynamic kinetic typography atom with fluid Google Font loading, agentic slide transitions, live AI token streaming, and kinetic text animations.
- **`GridList`** (data): Accessible interactive list of items with keyboard navigation, selection, and reorder dragging. (Subcomponents: GridListSection, GridListHeader, GridListItem, GridListEmptyState, GridListSpacer, GridListStart, GridListLabel, GridListDescription)
- **`GridListSection`** (data): Organized grouping section inside a GridList container.
- **`GridListHeader`** (data): Header title element for GridList sections.
- **`GridListItem`** (data): Interactive item row inside GridList with drag handles and selection checkbox support.
- **`GridListEmptyState`** (data): Empty state placeholder when GridList contains zero items.
- **`GridListSpacer`** (data): Flexible spacer separating start and end content inside GridListItem.
- **`GridListStart`** (data): Leading content cluster container inside GridListItem.
- **`GridListLabel`** (data): Primary label text inside GridListItem.
- **`GridListDescription`** (data): Supporting description text inside GridListItem.
- **`InfiniteScrollSection`** (form): InfiniteScrollSection component
- **`Input`** (form): Accessible single-line text input control with optical geometry and focus elevation. (Subcomponents: InputGroup, TextField)
- **`InputGroup`** (form): Composite input wrapper supporting embedded icon, loader, and kbd adornments.
- **`TextField`** (form): Accessible composite text field combining label, input, description, and error messaging.
- **`InputOTP`** (form): Hidden OTP input host that drives grouped character slots and caret state. (Subcomponents: InputOTPControl, InputOTPGroup, InputOTPSlot, InputOTPSeparator, InputOTPLabel)
- **`InputOTPControl`** (form): Horizontal OTP control row wrapping slot groups and separators.
- **`InputOTPGroup`** (form): Joined cluster of adjacent OTP character slots.
- **`InputOTPSlot`** (form): Single OTP character cell with fake caret and active-ring states.
- **`InputOTPSeparator`** (form): Visual divider between OTP slot groups.
- **`InputOTPLabel`** (form): Accessible label associated with an OTP control.
- **`JsonViewer`** (data): Collapsible syntax-colored JSON tree visualizer with key filtering, depth levels, search auto-expansion and navigation, and clipboard copy controls.
- **`Kbd`** (typography): Monospace keyboard shortcut indicator with optical atom radius and subtle elevation. (Subcomponents: Keyboard)
- **`Keyboard`** (typography): Alias for Kbd
- **`Container`** (layout): Centered responsive content container with max-width breakpoints and optical gutters.
- **`Stack`** (layout): Flexible layout container orchestrating linear item flow, alignment, gaps, and inter-item dividers.
- **`Center`** (layout): Layout primitive centering child elements along both horizontal and vertical axes.
- **`Bleed`** (layout): Negative margin wrapper allowing child elements to bleed into surrounding container padding.
- **`Float`** (layout): Fixed-position anchor pinning floating action buttons or widgets to screen coordinates with scroll-trigger thresholds.
- **`BackToTop`** (layout): Floating button smoothly returning scroll position to the top of the viewport.
- **`Link`** (navigation): Accessible hyperlinked navigation primitive with intent variants, external target handling, and optical focus rings.
- **`Menu`** (overlay): Accessible action menu with keyboard navigation, sub-menu nesting, and optical token styling. (Subcomponents: MenuTrigger, MenuPopover, MenuItem, MenuSection, MenuHeader, MenuSeparator, MenuSubmenuTrigger, MenuKeyboardShortcut)
- **`MenuTrigger`** (overlay): Trigger coordinating button interactions with menu open state.
- **`MenuPopover`** (overlay): Floating popover container specifically tailored for menu dropdown items.
- **`MenuItem`** (overlay): Interactive item row within menus with intent variants, icons, and keyboard shortcut slots.
- **`MenuSection`** (overlay): Logical grouping container organizing related menu items.
- **`MenuHeader`** (overlay): Section header title label for menu item categories.
- **`MenuSeparator`** (overlay): Divider line separating menu sections.
- **`MenuSubmenuTrigger`** (overlay): Trigger orchestrating nested cascaded sub-menus.
- **`MenuKeyboardShortcut`** (overlay): Keyboard accelerator badge right-aligned within menu items.
- **`Dropdown`** (overlay): Alias for Menu component.
- **`DropdownTrigger`** (overlay): Alias for MenuTrigger component.
- **`DropdownPopover`** (overlay): Alias for MenuPopover component.
- **`DropdownItem`** (overlay): Alias for MenuItem component.
- **`DropdownSection`** (overlay): Alias for MenuSection component.
- **`DropdownSeparator`** (overlay): Alias for MenuSeparator component.
- **`Meter`** (feedback): Accessible capacity gauge that colors fill by low, optimum, warning, and critical thresholds. (Subcomponents: MeterHeader, MeterValue, MeterTrack)
- **`MeterHeader`** (feedback): Header row for a meter pairing a label with the live value.
- **`MeterValue`** (feedback): Formatted meter value text from the React Aria meter state.
- **`MeterTrack`** (feedback): Meter track with threshold-colored fill representing current capacity.
- **`Modal`** (overlay): Accessible modal dialog system with concentric optical geometry, focus trapping, backdrop blur, and size ramps. (Subcomponents: ModalTrigger, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter, ModalCloseButton)
- **`ModalTrigger`** (overlay): Trigger wrapper connecting activator buttons to modal open state.
- **`ModalHeader`** (overlay): Structured top header container for modal titles and descriptions.
- **`ModalTitle`** (overlay): Accessible heading for modal dialogs with automatic ARIA association.
- **`ModalDescription`** (overlay): Supporting description text for modal dialogs.
- **`ModalBody`** (overlay): Scrollable content body section for modal dialogs.
- **`ModalFooter`** (overlay): Action footer container for modal dialogs.
- **`ModalCloseButton`** (overlay): Dismissal button closing the active modal.
- **`Dialog`** (overlay): Alias for Modal component.
- **`DialogTrigger`** (overlay): Alias for ModalTrigger component.
- **`DialogHeader`** (overlay): Alias for ModalHeader component.
- **`DialogTitle`** (overlay): Alias for ModalTitle component.
- **`DialogDescription`** (overlay): Alias for ModalDescription component.
- **`DialogBody`** (overlay): Alias for ModalBody component.
- **`DialogFooter`** (overlay): Alias for ModalFooter component.
- **`DialogClose`** (overlay): Alias for ModalCloseButton component.
- **`MultipleSelect`** (form): Multiselect input rendering removable pill chips, tag wrapping, search filter, and dropdown list. (Subcomponents: MultipleSelectTrigger, MultipleSelectTag, MultipleSelectContent, MultipleSelectItem)
- **`MultipleSelectTrigger`** (form): Clickable interactive trigger container rendering selected badge tags.
- **`MultipleSelectTag`** (form): Removable pill tag chip inside MultipleSelect.
- **`MultipleSelectContent`** (form): Declarative option list container for MultipleSelect.
- **`MultipleSelectItem`** (form): Declarative option item for MultipleSelect.
- **`TagPicker`** (form): Alias for MultipleSelect component.
- **`NativeSelect`** (form): Styled native HTML select input optimized for mobile operating systems and instant rendering. (Subcomponents: NativeSelectContent, NativeSelectOption, NativeSelectOptGroup)
- **`NativeSelectContent`** (form): Core select element and dropdown indicator for NativeSelect.
- **`NativeSelectOption`** (form): Option item within a NativeSelect element.
- **`NativeSelectOptGroup`** (form): Option group category container within a NativeSelect element.
- **`Navbar`** (navigation): Header navigation shell with sticky placement, floating intent, responsive mobile collapsible, and animated active indicator. (Subcomponents: NavbarProvider, NavbarSection, NavbarItem, NavbarBrand, NavbarContent, NavbarSpacer, NavbarToggle, NavbarTrigger, NavbarMobile)
- **`NavbarSection`** (navigation): Coordinated section within navbars housing navigation links and animated tab pill indicators.
- **`NavbarItem`** (navigation): Interactive navigation link within navbar sections with animated active indicator.
- **`NavbarBrand`** (navigation): Brand identity and logo container for application headers.
- **`NavbarContent`** (navigation): Main body layout section organizing navbar brands and action sections.
- **`NavbarSpacer`** (navigation): Flexible expanding spacer pushing surrounding items to opposite edges.
- **`NavbarTrigger`** (navigation): Menu trigger button for mobile navbar navigation overlay.
- **`NavbarMobile`** (navigation): Collapsible mobile dropdown menu overlay containing navigation links on small viewports.
- **`NavbarToggle`** (navigation): Alias for NavbarTrigger component.
- **`Note`** (feedback): Visual status alert with concentric intent indicators, optional close trigger, and optical macro radius. (Subcomponents: Alert, Callout)
- **`Alert`** (feedback): Alias for Note component.
- **`Callout`** (feedback): Alias for Note component.
- **`NumberField`** (form): Formatted numeric input with increment/decrement steppers, format scaling, and keyboard controls. (Subcomponents: NumberInput, StepperButton)
- **`NumberInput`** (form): Formatted numerical input field with integrated stepper side controls.
- **`StepperButton`** (form): Increment/decrement stepper button for numeric inputs.
- **`StepperInput`** (form): Alias for NumberInput component.
- **`OtpFieldStatus`** (form): Correct/incorrect OTP feedback row.
- **`OtpField`** (form): OTP field with configurable length, alphanumeric mode, and correct/incorrect feedback. (Subcomponents: OtpFieldStatus, InputOTP)
- **`Pagination`** (navigation): Accessible page navigation system with first/last jumps, adjacent steppers, and page number matrices. (Subcomponents: PaginationList, PaginationSection, PaginationItem, PaginationFirst, PaginationPrevious, PaginationNext, PaginationLast, PaginationStart, PaginationEnd, PaginationGap, PaginationPages, PaginationSpacer, PaginationLabel)
- **`PaginationList`** (navigation): Unordered list container wrapping numbered pagination items.
- **`PaginationSection`** (navigation): Logical section grouping within pagination lists.
- **`PaginationItem`** (navigation): Numbered page link button within pagination controls.
- **`PaginationFirst`** (navigation): Jump to first page navigation button.
- **`PaginationPrevious`** (navigation): Step backward to previous page button.
- **`PaginationNext`** (navigation): Step forward to next page button.
- **`PaginationLast`** (navigation): Jump to last page navigation button.
- **`PaginationStart`** (navigation): Pinned first-page number outside the scroll list. Disabled while the start of the list is in view.
- **`PaginationEnd`** (navigation): Pinned last-page number outside the scroll list. Disabled while the end of the list is in view.
- **`PaginationGap`** (navigation): Ellipsis gap indicator representing truncated pages.
- **`PaginationSpacer`** (navigation): Expanding flex spacer separating pagination items from summary labels.
- **`PaginationLabel`** (navigation): Summary label showing current page range and total items.
- **`PaginationPages`** (navigation): Page numbers for the scrollable list. Renders every page unless siblingCount collapses the window.
- **`PaginatedSectionPagination`** (navigation): Dedicated pagination footer controls for PaginatedSection.
- **`PaginatedSection`** (data): Dynamic data section container with automatic viewport-based or fixed page calculations and pagination controls.
- **`PasswordStrength`** (form): Four-segment password strength meter with live level copy.
- **`PasswordRequirements`** (form): Live checklist of password composition rules.
- **`PasswordSuggestor`** (form): Generated password candidate with use and refresh actions.
- **`PasswordField`** (form): Password field with hide/show, live strength feedback, requirement checklist, and a suggestor. (Subcomponents: PasswordStrength, PasswordRequirements, PasswordSuggestor, PasswordInput)
- **`PasswordInput`** (form): Password input atom with optional hide/show toggle and key icon.
- **`PhoneCountrySelect`** (form): Country calling-code dropdown with search, flag, name, and dial code.
- **`PhoneField`** (form): Phone field with country flag/code dropdown and national-number validation. (Subcomponents: PhoneCountrySelect, PhoneInput)
- **`PhoneInput`** (form): Telephone input atom with a leading country-trigger slot or phone icon.
- **`Popover`** (overlay): Anchor-positioned floating container with optical geometry, dialog semantics, and animated placement ramps. (Subcomponents: PopoverTrigger, PopoverArrow, PopoverHeader, PopoverTitle, PopoverDescription, PopoverFooter, PopoverClose)
- **`PopoverTrigger`** (overlay): Anchor wrapper coordinating popover open state with target trigger.
- **`PopoverArrow`** (overlay): Pointing arrow indicator connecting popover container to anchor target.
- **`PopoverHeader`** (overlay): Structured header section for popover content.
- **`PopoverTitle`** (overlay): Accessible title heading for popover content.
- **`PopoverDescription`** (overlay): Supporting description text for popover dialogs.
- **`PopoverFooter`** (overlay): Structured action footer for popover dialogs.
- **`PopoverClose`** (overlay): Dismissal button closing the active popover.
- **`Progress`** (feedback): Accessible determinate and indeterminate linear progress bar with optical fill and percentage labels. (Subcomponents: ProgressHeader, ProgressValue, ProgressTrack, ProgressCircle)
- **`ProgressHeader`** (feedback): Header row for a progress bar pairing a label with the live value.
- **`ProgressValue`** (feedback): Formatted progress percentage or value text from the React Aria progress state.
- **`ProgressTrack`** (feedback): Linear progress track with determinate fill or sliding indeterminate bar.
- **`ProgressCircle`** (feedback): Concentric circular progress indicator with determinate arc and spinning indeterminate state.
- **`RadioGroup`** (form): Accessible radio group container coordinating mutually exclusive selections. (Subcomponents: Radio, RadioField)
- **`RadioField`** (form): Grid layout container combining radio button indicator with label and description.
- **`Radio`** (form): Accessible radio button control with concentric optical circular indicators. (Subcomponents: RadioGroup, RadioField)
- **`Rating`** (form): Interactive star rating input with fractional precision, keyboard navigation, and readonly review support.
- **`StarRating`** (form): Alias for Rating component.
- **`ScrollArea`** (layout): Custom styled scroll area container with non-intrusive scrollbars and optical curve styling. (Subcomponents: ScrollBar, ScrollAreaViewport, ScrollAreaThumb, ScrollAreaCorner)
- **`ScrollAreaViewport`** (layout): Scrollable viewport element housing the child content.
- **`ScrollBar`** (layout): Track container for vertical and horizontal scrollbars.
- **`ScrollAreaThumb`** (layout): Draggable scrollbar thumb indicator with optical curvature.
- **`ScrollAreaCorner`** (layout): Corner intersection element when both horizontal and vertical scrollbars are visible.
- **`SearchField`** (form): Accessible search input with leading search icon, clear button, loading state slot, and shortcut badge. (Subcomponents: SearchInput)
- **`SearchInput`** (form): Search field input box with responsive icon, clear button, and shortcut badge slot.
- **`Select`** (form): Accessible select dropdown system with searchable options, chips, and optical token styling. (Subcomponents: SelectTrigger, SelectValue, SelectPopover, ListBox, ListBoxItem, ListBoxSection, ListBoxSeparator, SelectField)
- **`SelectTrigger`** (form): Dropdown trigger button showing current selection and toggle chevron.
- **`SelectValue`** (form): Rendered text value for the currently selected option.
- **`SelectPopover`** (form): Floating dropdown popover menu anchored to the select trigger.
- **`ListBox`** (form): Accessible list box selection container with keyboard arrow navigation. (Subcomponents: ListBoxItem, ListBoxSection, ListBoxSeparator)
- **`ListBoxItem`** (form): Option row within select list boxes with selection indicator and optional icon.
- **`ListBoxSection`** (form): Logical grouping container organizing related list box items.
- **`ListBoxSeparator`** (form): Divider line separating list box sections.
- **`SelectField`** (form): Composite form field wrapping Select with accessible Label, Description, and ErrorMessage.
- **`Separator`** (layout): Accessible horizontal or vertical rule separator with optical border tokens. (Subcomponents: Divider)
- **`Divider`** (layout): Alias for Separator
- **`ShowMore`** (data): Divided content truncation container with animated height expansion toggle button.
- **`SidebarProvider`** (navigation): Context provider and state manager for responsive sidebar collapse/expand states.
- **`Sidebar`** (navigation): Responsive collapsible application navigation sidebar with dock, mobile drawer modes, and state-aware variant slots. (Subcomponents: SidebarProvider, SidebarHeader, SidebarFooter, SidebarContent, SidebarSection, SidebarItem, SidebarTrigger, SidebarInset, SidebarRail, SidebarSeparator)
- **`SidebarHeader`** (navigation): Header container of the application sidebar with collapse-responsive alignment.
- **`SidebarFooter`** (navigation): Pinned bottom footer region of the application navigation sidebar.
- **`SidebarContent`** (navigation): Scrollable main content zone inside navigation sidebar.
- **`SidebarSection`** (navigation): Grouped navigation subsection with optional header title.
- **`SidebarItem`** (navigation): Accessible interactive sidebar navigation link with active indicators, icon slots, and dock tooltip.
- **`SidebarTrigger`** (navigation): Toggle button that expands or collapses the parent sidebar layout.
- **`SidebarInset`** (navigation): Main view viewport inset area adjacent to the application sidebar.
- **`SidebarRail`** (navigation): Invisible draggable edge rail enabling interactive sidebar expansion and resizing.
- **`SidebarSeparator`** (navigation): Themed horizontal boundary separator styled specifically for sidebar themes.
- **`Skeleton`** (feedback): Shimmering placeholder block or content wrapper using optical radius tokens. (Subcomponents: SkeletonText, SkeletonAvatar)
- **`SkeletonText`** (feedback): Stacked shimmering text lines with a shorter last line for natural copy placeholders.
- **`SkeletonAvatar`** (feedback): Avatar-shaped shimmer placeholder matching Avatar optical radii.
- **`SliderGroup`** (form): Horizontal group container for slider controls, icons, and readout badges.
- **`SliderOutput`** (form): Formatted numerical or custom textual output value for slider component.
- **`SliderThumb`** (form): Interactive draggable circular thumb grip for slider controls.
- **`SliderFill`** (form): Colored active track segment filling up to the current slider thumb value.
- **`SliderTrack`** (form): Linear track container holding slider thumb and active fill bar.
- **`Slider`** (form): Accessible draggable slider control with single or range dual-thumb track. (Subcomponents: SliderTrack, SliderThumb, SliderFill, SliderOutput, SliderGroup)
- **`RangeSlider`** (form): Pre-composed dual-thumb range slider with between-thumb fill. Enforces a [number, number] value tuple and is a drop-in alternative to Slider for range selection.
- **`SnippetCopyButton`** (feedback): Copy-to-clipboard control for snippet contents with a copied confirmation state.
- **`SnippetHighlight`** (feedback): Syntax highlighting slot for snippet source. Swap via slots.highlight for a highlighter.
- **`Snippet`** (feedback): Inline or block code snippet with copy-to-clipboard, highlight slot, and multi-line collapse. (Subcomponents: SnippetCopyButton, SnippetHighlight, SnippetTabs, SnippetTabList, SnippetTab, SnippetTabPanel, CodeSnippet)
- **`SnippetTabs`** (feedback): Tabbed snippet shell for multi-language or multi-file code examples.
- **`SnippetTabList`** (feedback): Language or file tab list for a tabbed snippet.
- **`SnippetTab`** (feedback): Individual language or file tab inside a snippet.
- **`SnippetTabPanel`** (feedback): Snippet tab panel with an inline copy control.
- **`CodeSnippet`** (feedback): Alias for Snippet component.
- **`Loader`** (feedback): Accessible animated SVG loading indicator with discrete and continuous spinning ramps. (Subcomponents: Loader)
- **`Loader`** (feedback): Alias for Loader
- **`SplitPanePanel`** (layout): Individual panel container inside a SplitPane.
- **`SplitPaneHandle`** (layout): Draggable separator handle between split pane panels.
- **`SplitPaneFirst`** (layout): First panel in a SplitPane layout.
- **`SplitPaneSecond`** (layout): Second panel in a SplitPane layout.
- **`SplitPane`** (layout): Horizontal or vertical resizable layout container with draggable splitter handle and keyboard step controls. (Subcomponents: SplitPanePanel, SplitPaneHandle, SplitPaneDivider, SplitPaneFirst, SplitPaneSecond)
- **`SplitPaneDivider`** (layout): Alias for SplitPaneHandle component.
- **`ResizablePanels`** (layout): Alias matching TASKS.md
- **`StepItem`** (layout): Individual step item containing icon, connectors, and label content.
- **`StepIcon`** (layout): Status indicator badge for a StepItem displaying step numbers, checks, or status icons.
- **`StepContent`** (layout): Title, description, and timestamp layout container for StepItem.
- **`StepConnector`** (layout): Connecting line between steps in a Stepper.
- **`StepSeparator`** (layout): Vertical divider line for completed steps.
- **`Stepper`** (layout): Multi-step process workflow stepper supporting horizontal and vertical timelines, status checks, and interactive progression. (Subcomponents: StepItem, StepIcon, StepContent, StepConnector, StepSeparator)
- **`Wizard`** (layout): Alias matching TASKS.md
- **`SwitchField`** (form): Form field container combining switch control, label, and description.
- **`SwitchButton`** (form): Grid layout button combining switch indicator with label and description.
- **`Switch`** (form): Accessible toggle switch control with smooth sliding physics and optical pill curvature. (Subcomponents: SwitchField, SwitchButton)
- **`Table`** (data): Accessible data table root with column resizing, zebra striping, grid lines, and edge-to-edge bleeding. (Subcomponents: TableHeader, TableColumn, TableBody, TableRow, TableCell, TableFooter, ColumnResizer)
- **`ColumnResizer`** (data): Draggable column resizer handle for interactive width adjustments.
- **`TableBody`** (data): Container for table row records with default empty state visualization.
- **`TableColumn`** (data): Table column header cell with sorting affordance, dragging state, and resize handles.
- **`TableHeader`** (data): Header group container rendering column definitions and selection controls.
- **`TableRow`** (data): Interactive data row container with selection highlight, dragging, and focus states.
- **`TableCell`** (data): Data cell primitive with hierarchical tree indentation and expand chevron support.
- **`TableFooter`** (data): Summary footer row container for table totals and footnotes.
- **`Tabs`** (navigation): Accessible tab matrix container with pill, segmented, and underline optical variants. (Subcomponents: TabList, Tab, TabPanel, SegmentedControl)
- **`TabList`** (navigation): Tab list bar coordinating active tabs and keyboard arrow navigation.
- **`Tab`** (navigation): Individual interactive tab element supporting icons and badge count indicators.
- **`TabPanel`** (navigation): Content container associated with the active selected tab.
- **`SegmentedControl`** (navigation): Alias for Tabs component.
- **`TextArea`** (form): Accessible multiline text input with optical radius and auto content sizing. (Subcomponents: Textarea)
- **`Textarea`** (form): Alias for TextArea
- **`ThemeEditorHeader`** (layout): Header landmark for ThemeEditor with studio branding, live preset status, and quick actions.
- **`ThemeEditorModeToggle`** (form): Compact segmented light/dark/system appearance switcher for the theme studio chrome.
- **`ThemeEditorNav`** (navigation): Studio section navigator for ThemeEditor, rendering a vertical rail or compact horizontal strip.
- **`ThemeEditorPresets`** (form): Visual palette gallery with large surface previews for registered theme presets.
- **`ThemeEditorKnobs`** (form): Four-knob optical control panel for curvature, density, elevation, and stroke.
- **`ThemeEditorColors`** (form): Semantic color token studio with canvas picker, swatch rail, and token list.
- **`ThemeEditorTypography`** (form): Typography studio with live specimens and sans/mono Google Font pairings.
- **`ThemeEditorPreview`** (layout): Embedded live canvas demonstrating theme, radius, density, and stroke reactivity.
- **`ThemeEditorFooter`** (layout): Footer action bar for CSS export and dismiss, with a quiet session hint.
- **`ThemeEditor`** (layout): Design-studio theme customizer for palettes, optical knobs, semantic color, typography, and a persistent live canvas. (Subcomponents: ThemeEditorHeader, ThemeEditorNav, ThemeEditorModeToggle, ThemeEditorPresets, ThemeEditorKnobs, ThemeEditorColors, ThemeEditorTypography, ThemeEditorPreview, ThemeEditorFooter, ThemeEditorModal)
- **`TimeField`** (form): Segmented temporal input for hours, minutes, seconds, and AM/PM with keyboard incrementing. (Subcomponents: TimeInput, TimeSegment, CalendarRemaining)
- **`DrumColumn`** (form): 3D cylindrical drum wheel column with direct manipulation momentum gestures.
- **`TimeWheelModeToggle`** (form): 12-Hour vs 24-Hour mode switcher pill for temporal time wheels.
- **`TimeWheelSelectionBar`** (form): Center active selection highlight bar across drum columns.
- **`TimeWheelSeparator`** (form): Typographic colon separator dividing hours, minutes, and seconds drum columns.
- **`InteractiveTimeWheel`** (form): Composite temporal time wheel with synchronized hours, minutes, seconds, and AM/PM columns. (Subcomponents: DrumColumn, TimeWheelModeToggle, TimeWheelSelectionBar, TimeWheelSeparator, CalendarRemaining)
- **`TimeWheel`** (form): Alias for InteractiveTimeWheel component.
- **`TimerDisplay`** (data): Numerical time digits display well with sub-second millisecond fractions.
- **`TimerProgressRing`** (data): Circular SVG progress arc for countdown and target stopwatch ceilings.
- **`TimerControls`** (data): Controls action bar with Start, Pause, Reset, Lap, and Stop buttons.
- **`TimerLapItem`** (data): Individual split lap record row.
- **`TimerLaps`** (data): Split lap records table displaying sequential lap intervals and cumulative times.
- **`Timer`** (data): High-precision countdown and stopwatch timer with split lap tracking and circular progress arcs. (Subcomponents: TimerDisplay, TimerProgressRing, TimerControls, TimerLaps, TimerLapItem)
- **`Toast`** (feedback): Portal toast region with stacked notifications, swipe-to-dismiss, timeouts, and action buttons. (Subcomponents: ToastQueue, ToastProvider)
- **`ToastProvider`** (feedback): Alias for Toast component.
- **`ToolbarGroup`** (layout): Logical grouping container within a Toolbar.
- **`ToolbarItem`** (form): Toggleable button item inside a Toolbar.
- **`ToolbarSeparator`** (layout): Orientation-aware divider line inside a Toolbar.
- **`Toolbar`** (layout): Accessible action toolbar orchestrating button groups, separators, and toggle buttons. (Subcomponents: ToolbarGroup, ToolbarItem, ToolbarSeparator)
- **`Tooltip`** (overlay): Micro-information tooltip container with optical geometry, delay transitions, and placement ramps. (Subcomponents: TooltipTrigger, TooltipArrow, TooltipContent)
- **`TooltipTrigger`** (overlay): Trigger wrapper connecting target elements to hover/focus tooltip state.
- **`TooltipArrow`** (overlay): Pointing arrow connecting tooltip bubble to anchor target.
- **`TooltipContent`** (overlay): Formatted content section inside tooltip bubbles.
- **`Tree`** (data): Hierarchical tree view component with expandable branch nodes, branch lines, and multi-selection. (Subcomponents: TreeItem, TreeContent, TreeIndicator)
- **`TreeItem`** (data): Individual node entry in a hierarchical Tree structure.
- **`TreeContent`** (data): Internal content layout for TreeItem managing indentation guides, chevrons, and labels.
- **`TreeIndicator`** (data): Expand/collapse chevron button indicator for expandable Tree nodes.
- **`Heading`** (typography): Semantic hierarchical heading element with optical tracking and typography scale. (Subcomponents: Strong, Code)
- **`Text`** (typography): Universal paragraph body text atom with optical contrast and weight variants. (Subcomponents: Strong, Code, Blockquote, Lead)
- **`Strong`** (typography): Bold inline emphasis text atom.
- **`Code`** (typography): Monospace code block/inline snippet atom with optical border styling.
- **`Blockquote`** (typography): Semantic blockquote quote callout with border indicator.
- **`Lead`** (typography): Prominent lead-in paragraph text styling for hero and article headers.
- **`UsernameFieldStatus`** (form): Subtle username availability feedback with optional suggested handles.
- **`UsernameField`** (form): Username field with a leading @ mark, format validation, and availability feedback. (Subcomponents: UsernameFieldStatus, UsernameInput)
- **`UsernameAtMark`** (form): Leading @ mark for username inputs.
- **`UsernameInput`** (form): Handle input atom with a leading @ mark and optional availability loader. (Subcomponents: UsernameAtMark)

#### Hooks (39)
- **`useInterface`** (utility): React hook primitive useInterface
- **`useInterfaceOptional`** (utility): React hook primitive useInterfaceOptional
- **`useControllableState`** (engine): React hook primitive useControllableState
- **`useEngineState`** (engine): React Hook primitive that binds any pure TypeScript EngineInstance to a React component using useSyncExternalStore to guarantee zero tearing and optimal rendering performance.
- **`useOverlayDismiss`** (utility): React hook primitive useOverlayDismiss
- **`useOverlayTriggerClose`** (utility): React hook primitive useOverlayTriggerClose
- **`useOpticalSize`** (utility): React hook primitive useOpticalSize
- **`useClipboard`** (utility): React hook primitive useClipboard
- **`useIsMobile`** (utility): React hook primitive useIsMobile
- **`useStableDateValue`** (utility): Keeps a single CalendarDate instance for the same day.
- **`useStableDateRange`** (utility): React hook primitive useStableDateRange
- **`useStableDuration`** (utility): React hook primitive useStableDuration
- **`useCarousel`** (utility): Accesses ambient Embla carousel API, viewport ref, and navigation states.
- **`useComparePane`** (utility): Accesses ambient compare pane state, drag coordinates, and current divider position.
- **`useDataSelectionBar`** (utility): React hook primitive useDataSelectionBar
- **`useDataTable`** (utility): React hook primitive useDataTable
- **`useDateTimeContent`** (utility): React hook primitive useDateTimeContent
- **`useMeterContext`** (utility): React hook primitive useMeterContext
- **`useNavbar`** (utility): React hook primitive useNavbar
- **`useProgressContext`** (utility): React hook primitive useProgressContext
- **`useSidebar`** (utility): React hook primitive useSidebar
- **`useSplitPane`** (utility): Accesses ambient split pane state, drag coordinates, and imperative collapse actions.
- **`useStepperContext`** (utility): React hook primitive useStepperContext
- **`useStepItemContext`** (utility): React hook primitive useStepItemContext
- **`useTableContext`** (utility): React hook primitive useTableContext
- **`useToolbarContext`** (utility): React hook primitive useToolbarContext
- **`useToolbarGroupContext`** (utility): React hook primitive useToolbarGroupContext
- **`useDateTime`** (headless): React hook primitive useDateTime
- **`useDisclosure`** (headless): React hook primitive useDisclosure
- **`useEmailField`** (headless): React hook primitive useEmailField
- **`useOtpField`** (headless): React hook primitive useOtpField
- **`usePagination`** (headless): React hook primitive usePagination
- **`usePasswordField`** (headless): React hook primitive usePasswordField
- **`usePhoneField`** (headless): React hook primitive usePhoneField
- **`useRating`** (headless): React hook primitive useRating
- **`useToast`** (headless): React hook primitive useToast
- **`useUsernameField`** (headless): React hook primitive useUsernameField
- **`useTheme`** (utility): React hook primitive useTheme
- **`useThemeOptional`** (utility): React hook primitive useThemeOptional

#### Providers (6)
- **`InterfaceProvider`** (global): Context and state management provider InterfaceProvider.
- **`SizeProvider`** (global): Context and state management provider SizeProvider.
- **`NavbarProvider`** (scoped): Context and state management provider NavbarProvider.
- **`SidebarProvider`** (scoped): Context and state management provider SidebarProvider.
- **`ToastProvider`** (scoped): Context and state management provider ToastProvider.
- **`ThemeProvider`** (global): Context and state management provider ThemeProvider.

---

<a id="module-@consona/interface/registry"></a>
### Module: `Registry` (`@consona/interface/registry`)

Registry module for @consona/interface

---

<a id="module-@consona/interface/charts"></a>
### Module: `Charts` (`@consona/interface/charts`)

Charts module for @consona/interface

#### Components (26)
- **`AreaChart`** (data): High-performance area visualizer supporting gradient fills, multi-series curves, and dynamic token theming. (Subcomponents: ChartContainer, ChartHeader, ChartToolbar, ChartLegend, ChartCanvas, ChartTooltip, ChartEmptyState, ChartLoadingState, ChartFooter)
- **`BarChart`** (data): Enterprise bar visualizer with grouped, stacked, vertical, and horizontal configurations. (Subcomponents: ChartContainer, ChartHeader, ChartToolbar, ChartLegend, ChartCanvas, ChartTooltip, ChartEmptyState, ChartLoadingState, ChartFooter, BarChartItem, TopRoundedBarItem, RightRoundedBarItem)
- **`BumpChart`** (data): Ranking change visualizer mapping relative position movements across sequential time steps. (Subcomponents: ChartContainer, ChartHeader, ChartToolbar, ChartLegend, ChartCanvas, ChartTooltip, ChartEmptyState, ChartLoadingState, ChartFooter)
- **`CandlestickChart`** (data): Financial OHLC candlestick visualizer with Moving Average overlays, volume histograms, and precision crosshairs. (Subcomponents: ChartContainer, ChartHeader, ChartToolbar, ChartLegend, ChartCanvas, ChartTooltip, ChartEmptyState, ChartLoadingState, ChartFooter)
- **`ChartContainer`** (data): Concentric card container designed for hosting interactive SaaS visualizers and Nivo charts. (Subcomponents: ChartHeader, ChartToolbar, ChartLegend, ChartCanvas, ChartTooltip, ChartEmptyState, ChartLoadingState, ChartFooter)
- **`ChartHeader`** (data): Header container organizing chart titles, descriptions, and KPI trend badges.
- **`ChartToolbar`** (data): Time range switcher and quick action bar for chart visualizers.
- **`ChartLegend`** (data): Interactive legend component supporting series toggle and color identification.
- **`ChartTooltip`** (data): Glassmorphism tooltip container rendering rich metric hovercards. (Subcomponents: ChartTooltipHeader, ChartTooltipRow, ChartTooltipIndicator, ChartTooltipValue, ChartTooltipBadge)
- **`ChartCanvas`** (data): Responsive canvas viewport managing chart dimensions, loading pulses, and empty state fallbacks.
- **`ChartEmptyState`** (data): Graceful empty state for empty chart datasets.
- **`ChartLoadingState`** (data): Optical skeleton pulse shimmer state for loading visualizers.
- **`ChartFooter`** (data): Bottom summary and footnote container for charts.
- **`ChordChart`** (data): Circular matrix visualizer illustrating bidirectional flows between grouped entities. (Subcomponents: ChartContainer, ChartHeader, ChartToolbar, ChartLegend, ChartCanvas, ChartTooltip, ChartEmptyState, ChartLoadingState, ChartFooter)
- **`FunnelChart`** (data): Stage-by-stage pipeline conversion visualizer measuring drop-off rates. (Subcomponents: ChartContainer, ChartHeader, ChartToolbar, ChartLegend, ChartCanvas, ChartTooltip, ChartEmptyState, ChartLoadingState, ChartFooter)
- **`HeatmapChart`** (data): High-density categorical intensity matrix with quantized color scales. (Subcomponents: ChartContainer, ChartHeader, ChartToolbar, ChartLegend, ChartCanvas, ChartTooltip, ChartEmptyState, ChartLoadingState, ChartFooter)
- **`LineChart`** (data): Continuous multi-series time-series and relationship graph with responsive tooltips. (Subcomponents: ChartContainer, ChartHeader, ChartToolbar, ChartLegend, ChartCanvas, ChartTooltip, ChartEmptyState, ChartLoadingState, ChartFooter)
- **`PieCenterMetric`** (data): Centered metric readout for donut pie charts.
- **`PieChart`** (data): Precision radial partition and donut chart visualizing proportional metrics. (Subcomponents: ChartContainer, ChartHeader, ChartToolbar, ChartLegend, ChartCanvas, PieCenterMetric, ChartTooltip, ChartEmptyState, ChartLoadingState, ChartFooter)
- **`RadarChart`** (data): Multi-axis radar and spider polygon chart for evaluating comparative scores. (Subcomponents: ChartContainer, ChartHeader, ChartToolbar, ChartLegend, ChartCanvas, ChartTooltip, ChartEmptyState, ChartLoadingState, ChartFooter)
- **`RadialBarChart`** (data): Concentric ring visualizer illustrating multi-metric goal progression and radial volume. (Subcomponents: ChartContainer, ChartHeader, ChartToolbar, ChartLegend, ChartCanvas, ChartTooltip, ChartEmptyState, ChartLoadingState, ChartFooter)
- **`SankeyChart`** (data): Directed flow visualizer tracing node-to-link volume transformations. (Subcomponents: ChartContainer, ChartHeader, ChartToolbar, ChartLegend, ChartCanvas, ChartTooltip, ChartEmptyState, ChartLoadingState, ChartFooter)
- **`ScatterChart`** (data): Multi-dimensional correlation plot placing point clusters across continuous axes. (Subcomponents: ChartContainer, ChartHeader, ChartToolbar, ChartLegend, ChartCanvas, ChartTooltip, ChartEmptyState, ChartLoadingState, ChartFooter)
- **`StreamChart`** (data): Continuous organic flowing streamgraph visualizing multi-series displacement over time. (Subcomponents: ChartContainer, ChartHeader, ChartToolbar, ChartLegend, ChartCanvas, ChartTooltip, ChartEmptyState, ChartLoadingState, ChartFooter)
- **`SunburstChart`** (data): Radial hierarchical multi-ring visualizer tracing tree depths outwards. (Subcomponents: ChartContainer, ChartHeader, ChartToolbar, ChartLegend, ChartCanvas, ChartTooltip, ChartEmptyState, ChartLoadingState, ChartFooter)
- **`TreemapChart`** (data): Hierarchical proportional tiling visualizer for inspecting multi-level category weights. (Subcomponents: ChartContainer, ChartHeader, ChartToolbar, ChartLegend, ChartCanvas, ChartTooltip, ChartEmptyState, ChartLoadingState, ChartFooter)

#### Hooks (4)
- **`useChartContext`** (utility): Hook to access current chart context inside compound child components.
- **`useChartDimensions`** (utility): Precision responsive dimension detector with ResizeObserver support.
- **`useChartTheme`** (utility): Hook to dynamically compute Nivo-compliant themes and color palettes synced with Consona Interface styles.
- **`useChartTooltip`** (utility): Hook providing direct, fail-safe access to the underlying chart tooltip engine. Eliminates the need for downstream components to import low-level @nivo/tooltip packages.

#### Providers (1)
- **`ChartProvider`** (plugin): Context and state management provider ChartProvider.

---

<a id="module-@consona/interface/composites"></a>
### Module: `Composites` (`@consona/interface/composites`)

Composites module for @consona/interface

---

<a id="module-@consona/interface/glass"></a>
### Module: `Glass` (`@consona/interface/glass`)

Glass module for @consona/interface

#### Components (1)
- **`Glass`** (media): Real-time physics-based liquid glass surface with procedural Snell

#### Engines (1)
- **`GlassPhysicsEngine`**: Pure TypeScript engine managing GlassPhysics physics and state.

#### Hooks (2)
- **`useGlassEngine`** (engine): React hook primitive useGlassEngine
- **`useGlassPhysics`** (engine): React hook primitive useGlassPhysics

#### Providers (1)
- **`GlassProvider`** (plugin): Context and state management provider GlassProvider.

---

<a id="module-@consona/interface/interaction"></a>
### Module: `Interaction` (`@consona/interface/interaction`)

Interaction module for @consona/interface

#### Components (3)
- **`InteractionLogger`** (feedback): Real-time floating DevTools inspector HUD for interaction engine events, rules, and key chords.
- **`InteractionTrigger`** (utility): Declarative interactive action trigger that dispatches orchestrated events through the interaction engine.
- **`InteractionZone`** (layout): Scoped boundary container that isolates and orchestrates delegated interaction rules within a DOM sub-tree.

#### Engines (1)
- **`InteractionEngine`**: Pure TypeScript engine managing Interaction physics and state.

#### Hooks (3)
- **`useInteraction`** (utility): Access the active Interaction Engine context and state.
- **`useInteractionRule`** (utility): Registers a declarative interaction rule with the active InteractionEngine. Automatically adds the rule on mount and cleans it up on unmount.
- **`useKeyChord`** (utility): High-level hook for listening to single keys or keyboard chords (e.g. 'Meta+k', 'Ctrl+Shift+p').

#### Providers (1)
- **`InteractionProvider`** (plugin): High-performance global interaction rule engine & delegated event listener provider.

---

<a id="module-@consona/interface/map"></a>
### Module: `Map` (`@consona/interface/map`)

Map module for @consona/interface

#### Components (22)
- **`GlobeMap`** (data): 3D spherical globe visualizer with dynamic atmospheric sky gradient, horizon fog, and orbital projection.
- **`Map`** (data): Interactive WebGL vector map container supporting dynamic themes, routes, flight arcs, GeoJSON shapes, and clustering. (Subcomponents: GlobeMap, MapControls, MapLegend, MapMarker, MarkerContent, MarkerPin, MarkerDot, MarkerPopup, MarkerTooltip, MarkerLabel, MapPopup, MapHover, MapSearch, MapRoute, RouteProgress, RouteMarker, MapPath, MapGeoJSON, MapShape, MapArc, MapClusterLayer)
- **`MapArc`** (data): Spherical geodesic great-circle flight and connection arcs across 2D maps and 3D globes.
- **`MapClusterLayer`** (data): Dynamic geographic point clustering with tiered color thresholds, expansion zoom, and 3D globe fallbacks.
- **`MapControls`** (navigation): Floating on-map navigation control stack for zooming, compass orientation, auto-rotation, geolocation, and fullscreen.
- **`MapGeoJSON`** (data): Renders GeoJSON polygons, lines, points, and SVG shapes with interactive hovering, stroke styling, and fills.
- **`MapHover`** (feedback): Floating micro-tooltip anchored dynamically to cursor or vector geometry coordinates.
- **`MapLegend`** (data): Collapsible on-map legend overlay for categorical, threshold, or thematic color keys with persistent context.
- **`MarkerContent`** (data): Portal container mounting custom React elements directly into MapLibre DOM marker shells.
- **`MarkerPin`** (data): Standard circular / teardrop map pin icon badge with custom intent colors and sizes.
- **`MarkerDot`** (data): Compact circular indicator dot for high-density geographic waypoint display.
- **`MarkerPopup`** (overlay): Popup card anchored directly to its parent MapMarker element.
- **`MarkerTooltip`** (feedback): Micro-tooltip card anchored directly to its parent MapMarker element on hover.
- **`MarkerLabel`** (data): Positioned typography label placed directly above or below a marker pin.
- **`MapMarker`** (data): Interactive HTML DOM marker attached to map coordinates with drag, hover tooltip, and click popup support. (Subcomponents: MarkerContent, MarkerPin, MarkerDot, MarkerPopup, MarkerTooltip, MarkerLabel)
- **`MapPath`** (data): Calculates and renders multi-point road itineraries or straight paths with interactive checkpoints.
- **`MapPopup`** (overlay): Floating modal / card popover attached to specific longitude and latitude coordinates.
- **`RouteProgress`** (data): Renders the active traveled segment along a parent MapRoute path.
- **`RouteMarker`** (data): Dynamic marker positioned along a MapRoute path by anchor or progress percentage.
- **`MapRoute`** (data): Vector line string path with dynamic progress animation, casing border, and hit testing. (Subcomponents: RouteProgress, RouteMarker)
- **`MapSearch`** (navigation): Floating search and autocomplete input with live reverse geocoding and marker drop.
- **`MapShape`** (data): Projects arbitrary SVG vector path geometry onto real-world geographic coordinates.

#### Engines (1)
- **`MapEngine`**: Pure TypeScript Engine managing map state, camera tracking, and geospatial events. Zero React dependencies.

#### Hooks (7)
- **`useMap`** (utility): React hook primitive useMap
- **`useMapLegend`** (utility): React hook primitive useMapLegend
- **`useMarker`** (utility): React hook primitive useMarker
- **`useRoute`** (utility): React hook primitive useRoute
- **`useMapPlaces`** (headless): Headless places geocoding hook with query debouncing, abort controller, and keyboard selection.
- **`useMapRoute`** (headless): Headless route analysis and travel progression hook.
- **`useMapViewport`** (headless): Headless camera viewport hook managing pan, zoom, pitch, and bearing interactions.

---

<a id="module-@consona/interface/media"></a>
### Module: `Media` (`@consona/interface/media`)

Media module for @consona/interface

#### Components (50)
- **`AudioPlayerPlayButton`** (media): Play and pause toggle button with loading and buffering states.
- **`AudioPlayerScrubber`** (media): Interactive timeline scrubber with current time and duration labels.
- **`AudioPlayerTime`** (media): Displays current playback elapsed timestamp.
- **`AudioPlayerDuration`** (media): Displays total duration timestamp of active audio track.
- **`AudioPlayerMuteButton`** (media): Mute and unmute toggle button with volume icons.
- **`AudioPlayerVolumeSlider`** (media): Slider track adjusting playback audio volume level.
- **`AudioPlayerSpeedButtonGroup`** (media): Group of speed multiplier buttons (0.5x to 2x).
- **`AudioPlayerSpeedDropdown`** (media): Compact popover dropdown menu for selecting audio speed.
- **`AudioPlayerTrackInfo`** (media): Displays current active track title, artist and metadata.
- **`AudioPlayerWaveformScrubber`** (media): Audio timeline scrubber synchronized with active playback.
- **`AudioPlayer`** (media): Universal container and complete workstation for audio playback transport controls and visualizers. (Subcomponents: AudioPlayerProvider, AudioPlayerPlayButton, AudioPlayerScrubber, AudioPlayerTime, AudioPlayerDuration, AudioPlayerMuteButton, AudioPlayerVolumeSlider, AudioPlayerSpeedButtonGroup, AudioPlayerSpeedDropdown, AudioPlayerTrackInfo, AudioPlayerWaveformScrubber, AudioTimeline, AudioPlayerCard)
- **`AudioPlayerCard`** (media): Full featured audio player card with timeline, track info, speed, volume and transcript support.
- **`AudioPlayerButton`** (media): Compact standalone audio player button that triggers or pauses playback of a track.
- **`AudioPlayerPill`** (media): Modern pill-shaped audio player featuring edge-to-edge controls and morphing progress fill.
- **`AudioRecorderTimer`** (media): Displays current recording duration or length of finished recording.
- **`AudioRecorder`** (media): Universal container and complete workstation for voice recording controls, live waveforms, and playback review. (Subcomponents: AudioRecorderProvider, AudioRecorderTimer, AudioRecorderCard)
- **`AudioRecorderCard`** (media): Pre-composed voice recording workstation card with live waveform and playback scrubber.
- **`AudioRecorderButton`** (media): Compact voice recording trigger button with live inline waveform and instant review.
- **`SpeechInputButton`** (media): Expandable dictation pill trigger with real-time speech waveform preview.
- **`AudioRecorderPill`** (media): Modern pill audio recorder with edge-to-edge controls, 60fps morphing timeline fill, and device switching.
- **`AudioSourcePicker`** (media): Accessible drag-and-drop audio file importer with validation and progress feedback.
- **`AudioTimeline`** (media): Universal interactive audio playback timeline using standard slider.
- **`BarVisualizerBar`** (media): Individual animated equalizer bar in BarVisualizer.
- **`BarVisualizer`** (media): Multiband equalizer bar visualizer with AI assistant state reactivity. (Subcomponents: BarVisualizerBar)
- **`LiveWaveform`** (media): Ultra-crisp real-time audio visualizer with multi-band frequency analysis and smooth streaming modes.
- **`MediaImage`** (media): Responsive media image with aspect-ratio handling, zoom hover overlays and captions. (Subcomponents: MediaPreview, ThumbnailButton)
- **`MediaPreview`** (media): Lightbox preview modal supporting images, MP4 videos and YouTube embeds.
- **`ThumbnailButton`** (media): Compact interactive thumbnail card button triggering full media lightboxes.
- **`MicSelectorMuteButton`** (media): Toggle button for muting or unmuting the selected microphone.
- **`MicSelector`** (media): Microphone selector dropdown with live input test waveform and mute toggle. (Subcomponents: MicSelectorMuteButton)
- **`TranscriptViewerContainer`** (media): Root container establishing transcript synchronization context.
- **`TranscriptViewerWord`** (media): Individual interactive transcript word unit.
- **`TranscriptViewerWords`** (media): Continuous synchronized transcript word stream with active glider highlight.
- **`TranscriptViewerPlayPauseButton`** (media): Toggle play/pause button for transcript synchronized audio.
- **`TranscriptViewerScrubBar`** (media): Timeline progress scrubber attached to transcript audio playback.
- **`TranscriptViewerTime`** (media): Current playback elapsed timestamp.
- **`TranscriptViewerDuration`** (media): Total media playback duration timestamp.
- **`TranscriptViewer`** (media): Synchronized audio transcript reader with active word tracking and timeline seeking. (Subcomponents: TranscriptViewerContainer, TranscriptViewerWord, TranscriptViewerWords, TranscriptViewerPlayPauseButton, TranscriptViewerScrubBar, TranscriptViewerTime, TranscriptViewerDuration)
- **`VideoPlayer`** (media): Accessible, responsive HTML5 video playback framework with customizable chrome. (Subcomponents: VideoPlayerControls, VideoPlayerTopBar, VideoPlayerScrubber, VideoPlayerPlayButton, VideoPlayerMuteButton, VideoPlayerVolumeSlider, VideoPlayerTime, VideoPlayerFullscreenButton, VideoPlayerActionRow, VideoPlayerDefault)
- **`VideoPlayerControls`** (media): Bottom gradient bar container holding playback scrubbers and action buttons.
- **`VideoPlayerTopBar`** (media): Top overlay header displaying video titles and metadata.
- **`VideoPlayerScrubber`** (media): Timeline progress bar with hover thumbnail and scrubbing drag interaction.
- **`VideoPlayerPlayButton`** (media): Toggle play/pause action button for video playback.
- **`VideoPlayerMuteButton`** (media): Toggle mute audio button for video player.
- **`VideoPlayerVolumeSlider`** (media): Horizontal range slider controlling video volume output.
- **`VideoPlayerTime`** (media): Displays current playback time and total video length.
- **`VideoPlayerFullscreenButton`** (media): Toggle full screen mode button for video player.
- **`VideoPlayerActionRow`** (media): Horizontal row arranging media playback controls.
- **`VideoPlayerDefault`** (media): Pre-composed ready-to-use video player with scrubber, time, volume and fullscreen controls.
- **`VoiceButton`** (media): AI voice assistant interactive button with reactive audio waveform states.

#### Engines (3)
- **`AudioEngine`**: Pure TypeScript engine managing Audio physics and state.
- **`AudioPlayerEngine`**: Pure TypeScript engine managing AudioPlayer physics and state.
- **`AudioRecorderEngine`**: Pure TypeScript engine managing AudioRecorder physics and state.

#### Hooks (21)
- **`usePlayerEngine`** (engine): React hook primitive usePlayerEngine
- **`useOptionalAudioPlayerEngine`** (engine): React hook primitive useOptionalAudioPlayerEngine
- **`useOptionalAudioPlayerSlice`** (utility): React hook primitive useOptionalAudioPlayerSlice
- **`useAudioPlayerSlice`** (utility): React hook primitive useAudioPlayerSlice
- **`useAudioPlayerContext`** (utility): React hook primitive useAudioPlayerContext
- **`useAudioRecorderContext`** (utility): React hook primitive useAudioRecorderContext
- **`useBarAnimator`** (utility): React hook primitive useBarAnimator
- **`useTranscriptViewerContext`** (utility): React hook primitive useTranscriptViewerContext
- **`useVideoPlayerContext`** (utility): React hook primitive useVideoPlayerContext
- **`useAudioEngine`** (engine): React hook primitive useAudioEngine
- **`useAudioVolume`** (utility): Hook for tracking the real-time RMS volume of an audio stream or element.
- **`useMultibandVolume`** (utility): Hook for tracking volume levels partitioned into multi-band frequency spectrum chunks.
- **`useLiveAudioBands`** (utility): Unified live audio bands hook returning full frequency spectrum, RMS volume, peak decibels, and built-in fallback to synthetic traveling sine waves for voice agent states or demo mode.
- **`useAudioDevices`** (utility): React hook primitive useAudioDevices
- **`useAudioEditor`** (utility): Hook for audio editing, DSP operations (trim, fade, normalize, gain, reverse), and WAV export.
- **`useAudioPlayer`** (utility): React hook primitive useAudioPlayer
- **`useAudioRecorder`** (utility): React hook primitive useAudioRecorder
- **`useAudioUpload`** (utility): React hook primitive useAudioUpload
- **`useAudio`** (utility): React hook primitive useAudio
- **`useTranscriptEngine`** (engine): React hook primitive useTranscriptEngine
- **`useVideoPlayer`** (headless): React hook primitive useVideoPlayer

#### Providers (3)
- **`AudioPlayerProvider`** (scoped): Context and state management provider AudioPlayerProvider.
- **`AudioRecorderProvider`** (scoped): Context and state management provider AudioRecorderProvider.
- **`AudioProvider`** (plugin): Context and state management provider AudioProvider.

---

<a id="module-@consona/interface/navigation"></a>
### Module: `Navigation` (`@consona/interface/navigation`)

Navigation module for @consona/interface

#### Components (3)
- **`NavBreadcrumbs`** (navigation): Tree-connected hierarchical breadcrumbs trail with single-container gliding hover flyout menus.
- **`NavLevelMenu`** (navigation): Flyout menu listing sibling options, categories, and child branches for a navigation level with smooth gliding coordinated sub-menus.
- **`NavOutlet`** (navigation): Dynamic navigation route outlet rendering active nodes or custom renderers.

#### Engines (1)
- **`NavigationEngine`**: Pure TypeScript engine managing Navigation physics and state.

#### Hooks (1)
- **`useNavigation`** (engine): React hook primitive useNavigation

#### Providers (1)
- **`NavigationProvider`** (plugin): Context and state management provider NavigationProvider.

---

<a id="module-@consona/interface/onboarding"></a>
### Module: `Onboarding` (`@consona/interface/onboarding`)

Onboarding module for @consona/interface

#### Components (13)
- **`OnboardingFocus`** (onboarding): Onboarding focus layer spotlighting specific DOM nodes with optional anchored popover content.
- **`Tour`** (onboarding): Complete guided product tour orchestrating step-by-step spotlights and floating cards.
- **`TourBeacon`** (onboarding): Hotspot radar beacon launching interactive product tours on click.
- **`TourCard`** (onboarding): Floating modal card container for step-by-step onboarding walkthroughs. (Subcomponents: TourCardHeader, TourCardTitle, TourCardDescription, TourCardBody, TourCardFooter, TourCardDots, TourCardProgress)
- **`TourCardHeader`** (onboarding): Header container of a tour card containing title and close actions.
- **`TourCardTitle`** (onboarding): Title heading for the active tour step.
- **`TourCardDescription`** (onboarding): Description paragraph text explaining the highlighted feature.
- **`TourCardBody`** (onboarding): Main body content wrapper inside a tour card.
- **`TourCardFooter`** (onboarding): Footer container for tour progression controls and action buttons.
- **`TourCardDots`** (onboarding): Dot step indicator for navigating between walkthrough steps.
- **`TourCardProgress`** (onboarding): Fractional or progress bar step indicator.
- **`TourChecklist`** (onboarding): Gamified milestone checklist container with weighted progress tracking and tour integration.
- **`TourSpotlight`** (onboarding): Dynamic backdrop overlay and cutout spotlight for focusing on active tour steps.

#### Engines (1)
- **`OnboardingEngine`**: Pure TypeScript engine managing Onboarding physics and state.

#### Hooks (6)
- **`useTour`** (utility): React hook primitive useTour
- **`useChecklist`** (utility): React hook primitive useChecklist
- **`useOnboardingEngine`** (engine): Hook to initialize and manage an OnboardingEngine instance.
- **`useOnboardingState`** (utility): Hook to subscribe to an OnboardingEngine's state with useSyncExternalStore.
- **`useChecklistProgress`** (utility): Hook for subscribing to a specific checklist's progress.
- **`useTourEngine`** (engine): Hook for controlling a specific tour through the engine.

#### Providers (2)
- **`OnboardingProvider`** (plugin): Context and state management provider OnboardingProvider.
- **`TourProvider`** (plugin): Context and state management provider TourProvider.

---

<a id="module-@consona/interface/orb"></a>
### Module: `Orb` (`@consona/interface/orb`)

Orb module for @consona/interface

#### Components (1)
- **`Orb`** (media): Real-time procedural WebGPU liquid glass orb with curated optical flow programs, signed-distance boundary refraction, spectral chromatic dispersion, and fluid caustics.

#### Engines (1)
- **`OrbPhysicsEngine`**: Pure TypeScript engine managing OrbPhysics physics and state.

#### Hooks (3)
- **`useOrbEngine`** (engine): React hook primitive useOrbEngine
- **`useOrbPhysics`** (engine): React hook primitive useOrbPhysics
- **`useShaderMaterial`** (utility): React hook primitive useShaderMaterial

#### Providers (1)
- **`OrbProvider`** (plugin): Context and state management provider OrbProvider.

---

<a id="module-@consona/interface/overlay"></a>
### Module: `Overlay` (`@consona/interface/overlay`)

Overlay module for @consona/interface

#### Components (4)
- **`AnchoredCallout`** (overlay): 12-placement floating callout card anchored to target coordinates with auto-flip collision detection.
- **`FeatureBeacon`** (overlay): Animated hotspot radar beacon indicator anchored to target coordinates or rendered inline.
- **`OverlayFocus`** (overlay): Composite focus spotlight orchestrating dynamic SVG mask cutout and anchored callout.
- **`SpotlightOverlay`** (overlay): Dynamic SVG cutout spotlight overlay with precise backdrop blur clipping and collision tracking.

#### Engines (1)
- **`OverlayEngine`**: Pure TypeScript engine managing Overlay physics and state.

#### Hooks (7)
- **`useOverlay`** (utility): React hook primitive useOverlay
- **`useOverlayEngine`** (engine): Hook to manage an OverlayEngine instance.
- **`useOverlayState`** (utility): Reactive subscription to OverlayEngine state via useSyncExternalStore.
- **`useTargetGeometry`** (utility): Hook to continuously track single or multi target elements with ResizeObserver and RAF loop.
- **`useFloatingPosition`** (utility): Hook to dynamically calculate floating anchor positioning relative to a target element.
- **`useScrollLock`** (utility): Hook to lock body scrolling during modal/spotlight presentation with layout shift compensation.
- **`useSpotlight`** (headless): Headless spotlight hook conforming to the 4-part contract.

#### Providers (1)
- **`OverlayProvider`** (plugin): Context and state management provider OverlayProvider.

---

