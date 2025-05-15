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
   closesBy: ""
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

export interface EventGet {
  _id: string;
  name: string;
  description: string;
  eventUUID: string;
  createdBy: string;
  createdAt: string;
  eventDate: string | null;
  place: string | null;
  eventDates?: {
    dates: string[];
    maxDates: number;
    allowUserAdd: boolean;
    maxVotes: number;
  };
  eventPlaces?: {
    places: string[];
    maxPlaces: number;
    allowUserAdd: boolean;
    maxVotes: number;
  };
  customFields?: Record<string, any>;
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

//eventResponse types
export interface EventResponsePayload {
  eventId: string;
  selectedDates: string[];
  selectedPlaces: string[];
  suggestedDates: string[];
  suggestedPlaces: string[];
  customFields: Record<string, any>;
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
  response: any;
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
  responses: any[];
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
      addedBy?: any;
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