// models/eventResponse.model.ts
import mongoose from "mongoose";

interface FieldResponse {
  fieldId: string;
  type: string; 
  response: any;
}

// Type definition for the MongoDB document
export interface EventResponseDocument extends mongoose.Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  fieldResponses: FieldResponse[];
  
  // Keep these two arrays for backward compatibility and ease of use
  suggestedDates: string[];
  suggestedPlaces: string[];
  
  // New structure: Map where keys are category names and values are arrays of option names
  suggestedOptions: Record<string, string[]>;
  
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB schema definition
const eventResponseSchema = new mongoose.Schema<EventResponseDocument>({
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Event", 
    required: true,
    index: true
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  userEmail: {
    type: String,
    required: true,
    trim: true
  },
  fieldResponses: [{
    fieldId: { type: String, required: true },
    type: { type: String, required: true },
    response: { type: mongoose.Schema.Types.Mixed }
  }],
  suggestedDates: [String],
  suggestedPlaces: [String],
  suggestedOptions: {
    type: Map,
    of: [String],
    default: () => new Map()
  }
}, {
  timestamps: true
});

// Create a compound unique index to ensure one response per user per event
eventResponseSchema.index({ eventId: 1, userId: 1 }, { unique: true });

const EventResponseModel = mongoose.model<EventResponseDocument>("EventResponse", eventResponseSchema);

export default EventResponseModel;