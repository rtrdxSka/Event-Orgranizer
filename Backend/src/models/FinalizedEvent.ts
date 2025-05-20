// models/finalizedEvent.model.ts
import mongoose from "mongoose";

interface CustomFieldSelection {
  fieldId: string;
  fieldType: string; // 'text' | 'radio' | 'checkbox' | 'list'
  fieldTitle: string;
  selection: any; // string, string[], or object depending on type
  voterDetails?: any[]; // People who voted for this selection
}

export interface FinalizedEventDocument extends mongoose.Document {
  eventId: mongoose.Types.ObjectId;
  finalizedDate: string | null;
  finalizedPlace: string | null;
  customFieldSelections: Record<string, CustomFieldSelection>;
  finalizedAt: Date;
  finalizedBy: mongoose.Types.ObjectId;
}

const finalizedEventSchema = new mongoose.Schema<FinalizedEventDocument>({
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Event", 
    required: true,
    index: true
  },
  finalizedDate: {
    type: String,
    default: null
  },
  finalizedPlace: {
    type: String,
    default: null
  },
  customFieldSelections: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  finalizedAt: { 
    type: Date, 
    default: Date.now, 
    required: true 
  },
  finalizedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }
});

const FinalizedEventModel = mongoose.model<FinalizedEventDocument>(
  "FinalizedEvent", 
  finalizedEventSchema
);

export default FinalizedEventModel;