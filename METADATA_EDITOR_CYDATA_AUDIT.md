# MetadataEditor Plugin - data-ms-id Audit Report

**Report Date**: 2026-06-23  
**Scope**: geonode-mapstore-client MetadataEditor plugin and related components  
**Status**: Complete - 19+ missing data-ms-id attributes identified

---

## Executive Summary

The MetadataEditor plugin and related components have **incomplete data-ms-id attribute coverage**. While the main form container and field labels have data-ms-id attributes applied via `applyMetadataMsIdTags()`, **interactive elements** (buttons, form controls, dropdown options, array operations) lack data-ms-id attributes. This audit identifies **19+ missing data-ms-id attributes** across 13 files.

---

## Missing data-ms-id Attributes by Location

### 1. ⛔ **CRITICAL - SelectInfiniteScroll Component**

**File**: `geonode_mapstore_client/client/js/components/SelectInfiniteScroll/SelectInfiniteScroll.jsx`  
**Lines**: 145-163 (SelectSync component rendering)  
**Priority**: HIGH  

**Issue**: The react-select dropdown renders options without data-ms-id attributes.

**Missing data-ms-id**:
- Container/Control element
- Menu/dropdown wrapper
- Individual option list items
- Option elements

**Recommended Solution**:
```jsx
// Add custom components to SelectSync
const customComponents = {
  Control: (props) => <div data-ms-id="metadata-autocomplete-control" {...props} />,
  Menu: (props) => <div data-ms-id="metadata-autocomplete-menu" {...props} />,
  Option: (props) => (
    <div data-ms-id={`metadata-autocomplete-option-${props.data.value}`} {...props}>
      {props.children}
    </div>
  )
};

// Pass to SelectSync:
<SelectSync {...props} components={customComponents} />
```

**Impact**: Cypress/automation tests cannot reliably target dropdown options.

---

### 2. ⛔ **CRITICAL - Form Submit Button (rjsf)**

**File**: `node_modules/@rjsf/core/lib/components/Form.jsx` (external dependency)  
**Issue**: The default rjsf Form component renders submit button without data-ms-id  

**Missing data-ms-id**:
- Submit button
- Form-actions container
- Cancel/Reset buttons (if configured)

**Recommended Solution**: Create custom `SubmitButton` template in `_templates/index.js`:
```jsx
function SubmitButton({ uiSchema, formContext }) {
  return (
    <div className="form-actions" data-ms-id="metadata-edit-actions">
      <button type="submit" data-ms-id="metadata-edit-submit" className="btn btn-primary">
        Save
      </button>
    </div>
  );
}
```

Then add to templates export:
```jsx
export default {
  // ... existing templates
  SubmitButton
};
```

**Impact**: Test automation cannot interact with form submission UI.

---

### 3. 🟡 **HIGH - Array Field Operation Buttons**

**File**: `geonode_mapstore_client/client/js/plugins/MetadataEditor/components/_templates/ArrayFieldItemTemplate.jsx`  
**Lines**: 44-63  
**Priority**: MEDIUM  

**Missing data-ms-id**:
- MoveUpButton (L50)
- MoveDownButton (L56)
- RemoveButton (L62)
- CopyButton (if present)

**Current Code**:
```jsx
{hasMoveUp && <MoveUpButton disabled={disabled || readonly || !hasMoveUp} ... />}
{hasMoveDown && <MoveDownButton disabled={disabled || readonly || !hasMoveDown} ... />}
{hasRemove && <RemoveButton disabled={disabled || readonly} ... />}
```

**Recommended Solution**: Modify button templates in `_templates/index.js`:
```jsx
function AddButton({ onClick, disabled, uiSchema, registry, index, field }) {
  return (
    <Button
      disabled={disabled}
      className="square-button-md"
      onClick={onClick}
      variant="primary"
      data-ms-id={`array-field-${field}-add`}
    >
      <Glyphicon glyph="plus" />
    </Button>
  );
}

function MoveUpButton({ onClick, disabled, index, idSchema }) {
  return (
    <Button
      disabled={disabled}
      className="square-button-md"
      onClick={onClick}
      data-ms-id={`array-item-${index}-move-up`}
    >
      <Glyphicon glyph="arrow-up" />
    </Button>
  );
}

function MoveDownButton({ onClick, disabled, index }) {
  return (
    <Button
      disabled={disabled}
      className="square-button-md"
      onClick={onClick}
      data-ms-id={`array-item-${index}-move-down`}
    >
      <Glyphicon glyph="arrow-down" />
    </Button>
  );
}

function RemoveButton({ onClick, disabled, index }) {
  return (
    <Button
      disabled={disabled}
      className="square-button-md"
      onClick={onClick}
      data-ms-id={`array-item-${index}-remove`}
    >
      <Glyphicon glyph="trash" />
    </Button>
  );
}
```

**Impact**: Cannot test array field manipulations (add/remove/reorder items).

---

### 4. 🟡 **HIGH - Autocomplete Component**

**File**: `geonode_mapstore_client/client/js/plugins/MetadataEditor/components/Autocomplete.jsx`  
**Lines**: 38-63  
**Priority**: MEDIUM  

**Missing data-ms-id**:
- Form group container (L38)
- Label element (L39)
- SelectInfiniteScroll wrapper (L56)
- Error message element (L63)

**Current Code**:
```jsx
<div id={id} className={`form-group${className ? " " + className : ""}...`}>
  {showLabel ? <label className="control-label" htmlFor={id}>
    {title || name}
    ...
  </label> : null}
  <SelectInfiniteScroll {...props} />
  {error}
</div>
```

**Recommended Solution**:
```jsx
<div id={id} className={`form-group...`} data-ms-id={`${id}-group`}>
  {showLabel ? <label className="control-label" htmlFor={id} data-ms-id={`${id}-label`}>
    {title || name}
    ...
  </label> : null}
  <SelectInfiniteScroll 
    {...props}
    data-ms-id={`${id}-autocomplete`}
  />
  {error && <div data-ms-id={`${id}-error`}>{error}</div>}
</div>
```

**Impact**: Cannot test autocomplete field interactions.

---

### 5. 🟡 **MEDIUM - Field Template (Labels & Wrappers)**

**File**: `geonode_mapstore_client/client/js/plugins/MetadataEditor/components/_templates/FieldTemplate.jsx`  
**Lines**: 14-28  
**Priority**: MEDIUM  

**Missing data-ms-id**:
- Label wrapper (L15-17)
- WrapIfAdditionalTemplate wrapper

**Current Code**:
```jsx
return (
  <WrapIfAdditionalTemplate {...props}>
    {displayLabel &&
      <label className={`control-label...`} htmlFor={id}>
        {label}
        {required && <span className="required">{' '}*</span>}
        {description ? <>{' '}{description}</> : null}
      </label>}
    {children}
    {errors}
    {help}
  </WrapIfAdditionalTemplate>
);
```

**Recommended Solution**:
```jsx
return (
  <WrapIfAdditionalTemplate {...props} data-ms-id={`${id}-wrapper`}>
    {displayLabel &&
      <label 
        className={`control-label...`} 
        htmlFor={id}
        data-ms-id={`${id}-label`}
      >
        {label}
        {required && <span className="required">{' '}*</span>}
        {description ? <>{' '}{description}</> : null}
      </label>}
    {children}
    {errors}
    {help}
  </WrapIfAdditionalTemplate>
);
```

**Impact**: Test automation cannot reliably find form field labels.

---

### 6. 🟡 **MEDIUM - Array Field Template (Add Button)**

**File**: `geonode_mapstore_client/client/js/plugins/MetadataEditor/components/_templates/ArrayFieldTemplate.jsx`  
**Lines**: 40-48  
**Priority**: MEDIUM  

**Missing data-ms-id**:
- AddButton component (L44-48)

**Current Code**:
```jsx
{canAdd && (
  <AddButton
    className="array-item-add"
    onClick={onAddClick}
    disabled={disabled || readonly}
    uiSchema={uiSchema}
    registry={registry}
  />
)}
```

**Recommended Solution**: Pass data-ms-id to AddButton:
```jsx
{canAdd && (
  <AddButton
    className="array-item-add"
    onClick={onAddClick}
    disabled={disabled || readonly}
    uiSchema={uiSchema}
    registry={registry}
    data-ms-id={`array-field-${idSchema.$id}-add`}
  />
)}
```

And update `AddButton` in `_templates/index.js`:
```jsx
function AddButton({ onClick, disabled, data-ms-id }) {
  return (
    <Button
      disabled={disabled}
      className="square-button-md"
      onClick={onClick}
      variant="primary"
      data-ms-id={data-ms-id}
    >
      <Glyphicon glyph="plus" />
    </Button>
  );
}
```

**Impact**: Cannot test array field additions.

---

### 7. 🟡 **MEDIUM - Metadata Group Navigation Buttons**

**File**: `geonode_mapstore_client/client/js/plugins/MetadataEditor/components/_templates/ObjectFieldTemplate.jsx`  
**Lines**: 42-75 (RootMetadata component)  
**Priority**: MEDIUM  

**Missing data-ms-id**:
- Group expand/collapse button (L46-49)
- Group property navigation button (L56-59)
- Metadata title navigation button (L90)

**Current Code**:
```jsx
<li>
  <Button className={`${groupError ? 'gn-metadata-error' : ''}...`} size="xs" onClick={() => setExpanded(...)}>
    <Glyphicon glyph={expanded ? "bottom" : "next"} />{' '}{title}...
  </Button>
  {expanded ? <ul>
    {group.map((property) => (
      <li key={property.name}>
        <Button size="xs" className={...} onClick={() => scrollIntoView(...)}>
          {property.title}...
        </Button>
      </li>
    ))}
  </ul> : null}
</li>
```

**Recommended Solution**:
```jsx
<li>
  <Button 
    className={...}
    size="xs"
    data-ms-id={`metadata-group-${groupKey}-toggle`}
    onClick={() => setExpanded(...)}
  >
    <Glyphicon glyph={expanded ? "bottom" : "next"} />{' '}{title}...
  </Button>
  {expanded ? <ul>
    {group.map((property) => (
      <li key={property.name}>
        <Button 
          size="xs"
          className={...}
          data-ms-id={`metadata-group-${groupKey}-${property.name}`}
          onClick={() => scrollIntoView(...)}
        >
          {property.title}...
        </Button>
      </li>
    ))}
  </ul> : null}
</li>

// Also add to metadata title navigation:
{metadataTitle ? (
  <li>
    <Button 
      size="xs"
      data-ms-id="metadata-title-nav"
      onClick={() => scrollIntoView(metadataTitleId)}
    >
      <Message msgId="gnviewer.metadataFor" /> {metadataTitle}
    </Button>
  </li>
) : null}
```

**Impact**: Cannot test metadata section navigation.

---

### 8. 🟢 **LOW - Title Field Template**

**File**: `geonode_mapstore_client/client/js/plugins/MetadataEditor/components/_templates/TitleFieldTemplate.jsx`  
**Lines**: 10-18  
**Priority**: LOW  

**Missing data-ms-id**:
- Label element (L11-16)

**Current Code**:
```jsx
<label className={formContext?.capitalizeTitle ? 'capitalize' : ''}>
  {title}
  {required && <span className="required">{' '}*</span>}
  {description ? <>{' '}{description}</> : null}
</label>
```

**Recommended Solution**:
```jsx
<label 
  className={formContext?.capitalizeTitle ? 'capitalize' : ''}
  data-ms-id={`${id}-title`}
>
  {title}
  {required && <span className="required">{' '}*</span>}
  {description ? <>{' '}{description}</> : null}
</label>
```

**Impact**: Minor - mainly for semantic test targeting.

---

### 9. 🟢 **LOW - Rich Text Editor**

**File**: `geonode_mapstore_client/client/js/plugins/MetadataEditor/components/_widgets/RichTextEditor.jsx`  
**Lines**: 14-27  
**Priority**: LOW  

**Missing data-ms-id**:
- Editor container wrapper

**Current Code**:
```jsx
<Editor
  {...props}
  editorState={editorState}
  onEditorStateChange={(newEditorState) => {
    ...
  }}
/>
```

**Recommended Solution**:
```jsx
<div data-ms-id={`${props.id}-rich-editor`} className="gn-rich-text-editor">
  <Editor
    {...props}
    editorState={editorState}
    onEditorStateChange={(newEditorState) => {
      ...
    }}
  />
</div>
```

**Impact**: Cannot specifically target rich text editor fields.

---

### 10. 🟢 **LOW - Select Widget**

**File**: `geonode_mapstore_client/client/js/plugins/MetadataEditor/components/_widgets/SelectWidget.jsx`  
**Lines**: 11  
**Priority**: LOW  

**Issue**: Passes through to DefaultSelectWidget without wrapping

**Recommended Solution**:
```jsx
function SelectWidget(props) {
  const { id } = props;
  return (
    <div data-ms-id={`${id}-select-widget`}>
      <DefaultSelectWidget {...props} />
    </div>
  );
}
```

**Impact**: Minor - affects select field targeting only.

---

### 11. 🟢 **LOW - Textarea Widget**

**File**: `geonode_mapstore_client/client/js/plugins/MetadataEditor/components/_widgets/TextareaWidget.jsx`  
**Lines**: 18-21  
**Priority**: LOW  

**Issue**: If using DefaultTextareaWidget, no data-ms-id is added

**Recommended Solution**:
```jsx
function TextareaWidget(props) {
  const { id, options = {}, value, onChange } = props;
  if (options?.['geonode-ui:richTextEditor']) {
    return (
      <Suspense fallback={null}>
        <RichTextEditor
          id={id}
          value={value}
          onChange={onChange}
        />
      </Suspense>
    );
  }
  return (
    <div data-ms-id={`${id}-textarea-widget`}>
      <DefaultTextareaWidget {...props} />
    </div>
  );
}
```

**Impact**: Minor - affects textarea field targeting only.

---

### 12. 🟢 **LOW - Object Field Container**

**File**: `geonode_mapstore_client/client/js/plugins/MetadataEditor/components/_templates/ObjectFieldTemplate.jsx`  
**Lines**: 120-130 (non-root ObjectField)  
**Priority**: LOW  

**Missing data-ms-id**:
- ObjectField container div (L121)

**Recommended Solution**:
```jsx
<div id={idSchema.$id} data-ms-id={`${idSchema.$id}-object-field`}>
  {/* existing content */}
</div>
```

**Impact**: Cannot target nested object fields.

---

### 13. 🟢 **LOW - Array Field Description/Title**

**File**: `geonode_mapstore_client/client/js/plugins/MetadataEditor/components/_templates/ArrayFieldTemplate.jsx`  
**Lines**: 36-43  
**Priority**: LOW  

**Missing data-ms-id**:
- Array field header container

**Recommended Solution**:
```jsx
<div id={idSchema.$id} className="field-array" data-ms-id={`${idSchema.$id}-array-field`}>
  <div className="field-array-header" data-ms-id={`${idSchema.$id}-header`}>
    {/* existing header content */}
  </div>
  {/* rest of content */}
</div>
```

**Impact**: Cannot target array fields as a whole.

---

## Implementation Priority & Action Items

### Phase 1: CRITICAL (Do First)
- [ ] **SelectInfiniteScroll**: Add custom react-select components with data-ms-id
- [ ] **Submit Button**: Create rjsf SubmitButton template override with data-ms-id
- [ ] **Array Buttons**: Update button templates (AddButton, MoveUpButton, MoveDownButton, RemoveButton)

### Phase 2: HIGH (Do Soon)
- [ ] **Autocomplete**: Add data-ms-id to form group, label, and component wrapper
- [ ] **FieldTemplate**: Add data-ms-id to label and wrapper elements
- [ ] **Group Navigation**: Add data-ms-id to metadata group buttons

### Phase 3: MEDIUM (Do Later)
- [ ] **RichTextEditor**: Add container wrapper with data-ms-id
- [ ] **SelectWidget**: Wrap with data-ms-id container
- [ ] **TextareaWidget**: Wrap with data-ms-id container

### Phase 4: LOW (Optional)
- [ ] **ObjectField**: Add data-ms-id to object field containers
- [ ] **ArrayField**: Add data-ms-id to array field containers
- [ ] **TitleField**: Add data-ms-id to title labels

---

## Testing Recommendations

After implementing data-ms-id attributes:

1. **Verify with Cypress**:
   ```javascript
   cy.get('[data-ms-id="metadata-autocomplete-option-value1"]').click();
   cy.get('[data-ms-id="array-item-0-remove"]').click();
   cy.get('[data-ms-id="metadata-edit-submit"]').click();
   ```

2. **Test all form scenarios**:
   - Simple text fields
   - Autocomplete/select fields
   - Rich text editor fields
   - Array fields (add, remove, reorder)
   - Nested object fields
   - Required field validation

3. **Validate with UI inspection**:
   - Inspect HTML to confirm data-ms-id presence
   - Check for data-ms-id naming consistency
   - Verify no duplicate data-ms-id values

---

## Summary Table

| Component | File | Line(s) | Missing data-ms-id | Priority |
|-----------|------|---------|-----------------|----------|
| SelectInfiniteScroll | SelectInfiniteScroll.jsx | 145-163 | Options, Menu, Control | HIGH |
| Form Submit | rjsf Form.jsx | external | Submit Button, Form Actions | HIGH |
| Array Buttons | index.js | 22-50 | Add, MoveUp, MoveDown, Remove | MEDIUM |
| Autocomplete | Autocomplete.jsx | 38-63 | Group, Label, Select, Error | MEDIUM |
| FieldTemplate | FieldTemplate.jsx | 14-28 | Label, Wrapper | MEDIUM |
| Group Nav | ObjectFieldTemplate.jsx | 42-75 | Group Toggle, Property Nav | MEDIUM |
| RichEditor | RichTextEditor.jsx | 14-27 | Container | LOW |
| SelectWidget | SelectWidget.jsx | 11 | Widget Wrapper | LOW |
| TextareaWidget | TextareaWidget.jsx | 18-21 | Widget Wrapper | LOW |
| ObjectField | ObjectFieldTemplate.jsx | 120-130 | Container | LOW |
| ArrayField | ArrayFieldTemplate.jsx | 36-43 | Header Container | LOW |
| **TOTAL** | — | — | **19+ attributes** | — |

---

## Notes

- The `applyMetadataMsIdTags()` function already maps field IDs to data-ms-id values for the main form fields
- Consider creating a utility function for consistent data-ms-id naming patterns
- react-select requires custom `components` prop to support data-ms-id on options
- rjsf may need custom template overrides for button rendering
- Test thoroughly after implementation to ensure no regression

