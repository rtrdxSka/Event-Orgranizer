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
};

// Define a type for the event creation payload
export type CreateEventPayload = {
  name: string;
  description: string;
  customFields: Record<string, any>;
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
      votes: any[];
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
      customFields: Record<string, any>;
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