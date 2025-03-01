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

interface BaseField {
  id: number;
  type: FieldType;
  title: string;
  placeholder: string;
  value: string;
  required: boolean;
  readonly: boolean;
}

export interface TextField extends BaseField {
  type: 'text';
}

export interface RadioField extends BaseField {
  type: 'radio';
  options: Array<{
    id: number;
    label: string;
  }>;
  selectedOption: number | null;
}

export interface ListField extends BaseField {
  type: 'list';
  values: string[];
  maxEntries: number;
  allowUserAdd: boolean;
}

export interface EventFormData {
  name: string;
  description: string;
  eventDate: string;
  place: string;
}

export interface CheckboxField {
  id: number;
  type: 'checkbox';
  title: string;
  placeholder: string;
  value: string;
  required: boolean;
  readonly: boolean;
  options: Array<{ id: number; label: string; checked: boolean }>;
}