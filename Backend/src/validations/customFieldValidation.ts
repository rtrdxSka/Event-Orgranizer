// utils/customFieldValidation.ts
import { BAD_REQUEST } from "../constants/http";
import appAssert from "../utils/appAssert";


interface CustomFieldOption {
  id: number;
  label: string;
  checked?: boolean;
}

interface CustomField {
  type: 'text' | 'radio' | 'checkbox' | 'list';
  title: string;
  placeholder?: string;
  required?: boolean;
  readonly?: boolean;
  value?: string;
  options?: CustomFieldOption[];
  values?: string[];
  maxEntries?: number;
  allowUserAdd?: boolean;
  selectedOption?: number | null;
}

/**
 * Validates custom fields and returns a Map with validated fields
 * @param customFields Object containing custom fields to validate
 * @returns Map with validated custom fields
 */
export const validateAndConvertCustomFields = (
  customFields: Record<string, CustomField>
): Map<string, CustomField> => {
  const customFieldsMap = new Map<string, CustomField>();

  Object.entries(customFields).forEach(([key, field]) => {
    validateCustomField(field);
    customFieldsMap.set(key, field);
  });

  return customFieldsMap;
};

/**
 * Validates a single custom field based on its type
 * @param field The custom field to validate
 */
const validateCustomField = (field: CustomField): void => {
  switch (field.type) {
    case "text":
      validateTextField(field);
      break;
    case "radio":
      validateRadioField(field);
      break;
    case "checkbox":
      validateCheckboxField(field);
      break;
    case "list":
      validateListField(field);
      break;
    default:
      appAssert(false, BAD_REQUEST, `Unknown field type: ${field.type}`);
  }
};

/**
 * Validates text field constraints
 */
const validateTextField = (field: CustomField): void => {
  if (field.readonly && (!field.value || field.value.trim() === "")) {
    appAssert(false, BAD_REQUEST, `Read-only text field "${field.title}" must have a value`);
  }
};

/**
 * Validates radio field constraints
 */
const validateRadioField = (field: CustomField): void => {
  if (!field.options || field.options.length < 2) {
    appAssert(false, BAD_REQUEST, `Radio field "${field.title}" must have at least 2 options`);
  }

  if (field.readonly && field.selectedOption === null) {
    appAssert(false, BAD_REQUEST, `Read-only radio field "${field.title}" must have a selected option`);
  }

  // Validate option labels
  field.options.forEach((option, index) => {
    if (!option.label || option.label.trim() === "") {
      appAssert(false, BAD_REQUEST, `Option ${index + 1} in field "${field.title}" must have a label`);
    }
  });
};

/**
 * Validates checkbox field constraints
 */
const validateCheckboxField = (field: CustomField): void => {
  if (!field.options || field.options.length < 1) {
    appAssert(false, BAD_REQUEST, `Checkbox field "${field.title}" must have at least 1 option`);
  }

  // Validate option labels
  field.options.forEach((option, index) => {
    if (!option.label || option.label.trim() === "") {
      appAssert(false, BAD_REQUEST, `Option ${index + 1} in field "${field.title}" must have a label`);
    }
  });
};

/**
 * Validates list field constraints
 */
const validateListField = (field: CustomField): void => {
  if (field.readonly) {
    validateReadonlyListField(field);
  } else {
    validateEditableListField(field);
  }

  // Validate max entries constraint
  if (field.maxEntries && field.maxEntries > 0 && field.values && field.values.length > field.maxEntries) {
    appAssert(
      false, 
      BAD_REQUEST, 
      `Number of entries in list field "${field.title}" (${field.values.length}) exceeds maximum allowed (${field.maxEntries})`
    );
  }
};

/**
 * Validates readonly list field specific constraints
 */
const validateReadonlyListField = (field: CustomField): void => {
  if (field.allowUserAdd) {
    appAssert(false, BAD_REQUEST, `Read-only list field "${field.title}" cannot allow users to add entries`);
  }

  if (field.maxEntries && field.maxEntries > 0 && field.values && field.values.length !== field.maxEntries) {
    appAssert(
      false, 
      BAD_REQUEST, 
      `Read-only list field "${field.title}" must have exactly ${field.maxEntries} entries, but has ${field.values.length}`
    );
  }

  if (field.values && field.values.some(v => !v || v.trim() === "")) {
    appAssert(false, BAD_REQUEST, `All entries in read-only list field "${field.title}" must have values`);
  }
};

/**
 * Validates editable list field specific constraints
 */
const validateEditableListField = (field: CustomField): void => {
  if (!field.allowUserAdd) {
    appAssert(false, BAD_REQUEST, `List field "${field.title}" must allow users to add entries`);
  }

  if (field.values) {
    const hasEmptyField = field.values.some(v => v.trim() === '');
    const hasRoomForMore = (field.maxEntries ?? 0) === 0 || field.values.length < (field.maxEntries ?? 0);
    
    if (!hasEmptyField && !hasRoomForMore) {
      appAssert(false, BAD_REQUEST, `List field "${field.title}" is full and does not allow more entries`);
    }
  }
};