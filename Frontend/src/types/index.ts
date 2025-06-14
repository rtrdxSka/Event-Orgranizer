export interface User {
  _id: string;
  email: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Session {
  _id: string;
  userAgent?: string;
  createdAt: string;
  isCurrent?: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
}

export type FieldType = "text" | "list" | "radio" | "checkbox";

export const FIELD_TYPES: Record<string, FieldType> = {
  TEXT: "text",
  LIST: "list",
  RADIO: "radio",
  CHECKBOX: "checkbox",
};

export interface BaseField {
  id: number;
  type: FieldType;
  title: string;
  placeholder: string;
  value: string;
  required: boolean;
  readonly: boolean;
}

export interface TextField extends BaseField {
  type: "text";
}

export interface RadioField extends BaseField {
  type: "radio";
  options: Array<{
    id: number;
    label: string;
  }>;
  selectedOption: number | null;
  maxOptions: number;
  allowUserAddOptions: boolean;
}

export interface CheckboxField extends BaseField {
  type: "checkbox";
  options: Array<{
    id: number;
    label: string;
    checked: boolean;
  }>;
  maxOptions: number;
  allowUserAddOptions: boolean;
}

export interface ListField extends BaseField {
  type: "list";
  values: string[];
  maxEntries: number;
  allowUserAdd: boolean;
}

export type Field = TextField | ListField | RadioField | CheckboxField;

export type TextFieldSettings = Partial<Omit<TextField, "id" | "type">>;
export type ListFieldSettings = Partial<Omit<ListField, "id" | "type">>;
export type RadioFieldSettings = Partial<Omit<RadioField, "id" | "type">>;
export type CheckboxFieldSettings = Partial<Omit<CheckboxField, "id" | "type">>;
export type FieldSettings =
  | TextFieldSettings
  | ListFieldSettings
  | RadioFieldSettings
  | CheckboxFieldSettings;

export interface DragItem {
  type: FieldType;
}

export interface EventFormData {
  name: string;
  description: string;
  eventDates: {
    dates: string[];
    maxDates: number;
    allowUserAdd: boolean;
    maxVotes: number;
  };
  place: {
    places: string[];
    maxPlaces: number;
    allowUserAdd: boolean;
    maxVotes: number;
  };
   closesBy: string;
}

export const initialFormData: EventFormData = {
  name: "",
  description: "",
  eventDates: {
    dates: [""],
    maxDates: 0,
    allowUserAdd: true,
    maxVotes: 1
  },
  place: {
    places: [""],
    maxPlaces: 0,
    allowUserAdd: true,
    maxVotes: 1
  },
    closesBy: (() => {
    // Set default to 7 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    defaultDate.setHours(23, 59, 0, 0); // Set to end of day
    return defaultDate.toISOString().slice(0, 16); // Format for datetime-local input
  })()
};

// Define a type for the event creation payload
export type CreateEventPayload = {
  name: string;
  description: string;
  customFields: Record<string, {
    type: FieldType;
    title: string;
    placeholder: string;
    value: string;
    required: boolean;
    readonly: boolean;
    options?: Array<{
      id: number;
      label: string;
      checked?: boolean;
    }>;
    selectedOption?: number | null;
    maxOptions?: number;
    allowUserAddOptions?: boolean;
    values?: string[];
    maxEntries?: number;
    allowUserAdd?: boolean;
  }>;
  eventDates: {
    dates: string[];
    maxDates: number;
    allowUserAdd: boolean;
  };
  eventPlaces: {
    places: string[];
    maxPlaces: number;
    allowUserAdd: boolean;
  };
  votingCategories: Array<{
    categoryName: string;
    options: Array<{
      optionName: string;
      votes: string[];
    }>;
  }>;
};

// Define a type for the event response
export type EventResponse = {
  status: string;
  data: {
    event: {
      _id: string;
      name: string;
      description: string;
      customFields: Record<string, {
        type: FieldType;
        title: string;
        placeholder: string;
        value: string;
        required: boolean;
        readonly: boolean;
        options?: Array<{
          id: number;
          label: string;
          checked?: boolean;
        }>;
        selectedOption?: number | null;
        maxOptions?: number;
        allowUserAddOptions?: boolean;
        values?: string[];
        maxEntries?: number;
        allowUserAdd?: boolean;
      }>;
      eventDates: {
        dates: string[];
        maxDates: number;
        allowUserAdd: boolean;
      };
      eventPlaces: {
        places: string[];
        maxPlaces: number;
        allowUserAdd: boolean;
      };
      votingCategories: Array<{
        categoryName: string;
        options: Array<{
          optionName: string;
          votes: string[];
        }>;
      }>;
      createdBy: string;
      createdAt: string;
      updatedAt: string;
    };
  };
};

export interface EventGet {
  status: 'open' | 'closed' | 'finalized';
  otherResponsesCount: number;
  _id: string;
  name: string;
  description: string;
  eventUUID: string;
  createdBy: string;
  createdAt: string;
  eventDate: string | null;
  place: string | null;
  eventDates: {
    dates: string[];
    maxDates: number;
    allowUserAdd: boolean;
    maxVotes: number;
  };
  eventPlaces: {
    places: string[];
    maxPlaces: number;
    allowUserAdd: boolean;
    maxVotes: number;
  };
  customFields?: Record<string, {
    id: unknown;
    maxVotes: number | undefined;
    type: FieldType;
    title: string;
    placeholder: string;
    value: string;
    required: boolean;
    readonly: boolean;
    options?: Array<{
      id: number;
      label: string;
      checked?: boolean;
    }>;
    selectedOption?: number | null;
    maxOptions?: number;
    allowUserAddOptions?: boolean;
    values?: string[];
    maxEntries?: number;
    allowUserAdd?: boolean;
  }>;
  votingCategories?: Array<{
    categoryName: string;
    options: Array<{
      optionName: string;
      votes: string[];
      _id: string;
    }>;
    _id: string;
  }>;
  updatedAt: string;
  __v: number;
}

type CustomFieldValue =
  | string // for text fields
  | string[] // for list fields
  | {
      // for radio fields
      value: string;
      userAddedOptions: string[];
    }
  | {
      // for checkbox fields
      userAddedOptions: string[];
      [optionId: string]: boolean | string[]; // option IDs as keys with boolean values, plus userAddedOptions
    };

//eventResponse types
export interface EventResponsePayload {
  eventId: string;
  selectedDates: string[];
  selectedPlaces: string[];
  suggestedDates: string[];
  suggestedPlaces: string[];
  customFields: Record<string, CustomFieldValue>;
  votingCategories: VotingCategory[];
}

export interface VotingCategory {
  categoryName: string;
  options: VotingOption[];
  _id?: string;
}

export interface VotingOption {
  optionName: string;
  votes: string[];
  _id?: string;
  addedBy?: string;
}

export interface EventResponseSuccess {
  status: string;
  data: {
    response: {
      eventId: string;
      userId: string;
      userEmail: string;
      userName?: string;
      fieldResponses: FieldResponse[];
      suggestedDates: string[];
      suggestedPlaces: string[];
      suggestedOptions: Record<string, string[]>;  // New structure - category name to array of options
      _id: string;
      createdAt: string;
      updatedAt: string;
    };
    votingCategories: VotingCategory[];
  }
}

export interface EventResponseData {
  eventId: string;
  userId: string;
  userEmail: string;
  fieldResponses: FieldResponse[];
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export interface FieldResponse {
  fieldId: string;
  type: string;
  response: string | string[];
}

export interface UserEventResponse {
  fieldResponses: FieldResponse[];
  userVotes: Record<string, string[]>;
  userAddedOptions: Record<string, string[]>;
  userSuggestedDates: string[];
  userSuggestedPlaces: string[];
  hasResponse: boolean;
}

export interface SuggestedOption {
  categoryName: string;
  optionName: string;
}

export interface OtherUserResponsesData {
  event: {
    _id: string;
    name: string;
    description: string;
  };
  uniqueSuggestions: {
    dates: string[];
    places: string[];
    customFields: Record<string, string[]>;
  };
}


export interface TextFieldResponseData {
  fieldId: string;
  categoryName: string;
  responses: Array<{
    userId: string;
    userEmail: string;
    userName?: string;
    response: string;
  }>;
}

export interface EventOwnerResponse {
  event: EventGet;
  responses: EventResponseData[];
  chartsData: Array<{
    categoryName: string;
    options: Array<{
      optionName: string;
      voteCount: number;
      voters: string[];
      voterDetails: Array<{
        _id: string;
        email: string;
        name?: string;
      }>;
      addedBy?: {
        _id: string;
        email: string;
        name?: string;
      } | null;
    }>;
  }>;
  listFieldsData: Array<{
    fieldId: string;
    categoryName: string;
    fieldType: 'list';
    options: Array<{
      optionName: string;
      voteCount: number;
      voters: string[];
      voterDetails: Array<{
        _id: string;
        email: string;
        name?: string;
      }>;
      isOriginal?: boolean;
    }>;
  }>;
  textFieldsData: TextFieldResponseData[]; // New field for text responses
}

// Finalization types
export interface FinalizeSelections {
  categorySelections: Record<string, string>;
  listSelections: Record<string, string[]>;
  textSelections: Record<string, string>;
  checkboxSelections?: Record<string, string[]>;
}

export interface FinalizeData {
  date: string | null;
  place: string | null;
  customFields: Record<string, string | string[]>;
}

export interface FinalizeEventResponse {
  status: string;
  message?: string;
  data?: {
    eventId: string;
    finalizedAt: string;
    [key: string]: unknown;
  };
}

export interface FinalizedEvent {
  _id: string;
  name: string;
  description: string;
  eventUUID: string;
  status: 'finalized';
  eventDate: string | null;
  place: string | null;
  customFields?: Record<string, unknown>;
  finalizedAt: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventStatusResponse {
  status: string;
  message?: string;
  data?: {
    eventId: string;
    status: string;
    updatedAt: string;
  };
}

export interface RemoveOptionResponse {
  status: string;
  message?: string;
  data?: {
    eventId: string;
    removedOption: string;
    categoryName: string;
  };
}

export interface GoogleCalendarEventResponse {
  event: {
    htmlLink: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface CustomFieldData {
  id: number;
  type: FieldType;
  title: string;
  placeholder: string;
  required: boolean;
  optional?: boolean;
  // Text field specific
  value?: string;
  readonly?: boolean;
  // List field specific
  values?: string[];
  maxEntries?: number;
  allowUserAdd?: boolean;
  // Radio/Checkbox field specific
  options?: Array<{ id: number; label: string }>;
  maxOptions?: number;
  allowUserAddOptions?: boolean;
}

export interface CustomFieldSelection {
  fieldId: string;
  fieldType: string; // 'text' | 'radio' | 'checkbox' | 'list'
  fieldTitle: string;
  selection: string | string[] | { [key: string]: boolean | string[] }; // Covers all field types
  voterDetails?: Array<{ _id: string; email: string; name?: string }>;
}

export interface FinalizedEventData {
  event: EventGet;
  finalizedEvent: {
    finalizedDate: string | null;
    finalizedPlace: string | null;
    customFieldSelections: Record<string, CustomFieldSelection>;
    finalizedAt: string;
    finalizedBy: string;
  };
  organizer: {
    _id: string;
    email: string;
    name?: string;
  };
}

