import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

interface VotingOption {
  optionName: string;
  votes: mongoose.Types.ObjectId[];
}

interface VotingCategory {
  categoryName: string;
  options: VotingOption[];
}

interface EventDates {
  allowUserAdd: boolean;
  dates: string[];
  maxDates: number;
  maxVotes: number;
}

interface EventPlaces {
  allowUserAdd: boolean;
  places: string[];
  maxPlaces: number;
}

export interface EventDocument extends mongoose.Document {
  name: string;
  description: string;
  eventUUID: string;
  eventDate: Date | null;
  place: string | null;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  eventDates: EventDates;
  eventPlaces: EventPlaces;
  customFields: Map<string, any>;
  votingCategories: VotingCategory[];
  addVote: (categoryName: string, optionName: string, userId: mongoose.Types.ObjectId) => Promise<void>;
}

const eventSchema = new mongoose.Schema<EventDocument>({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String, 
    required: true 
  },
  eventUUID: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => uuidv4()
    // Don't set a default here, we'll set it in the pre-save middleware
  },
  eventDate: {
    type: Date,
    default: null
  },
  place: {
    type: String,
    default: null
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    required: true 
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  eventDates: {
    allowUserAdd: { type: Boolean, default: true },
    dates: { type: [String], default: [] },
    maxDates: { type: Number, default: 0 },
    maxVotes: { type: Number, default: 1 }
  },
  eventPlaces: {
    allowUserAdd: { type: Boolean, default: true },
    places: { type: [String], default: [] },
    maxPlaces: { type: Number, default: 0 },
    maxVotes: { type: Number, default: 1 }
  },
  votingCategories: {
    type: [{
      categoryName: { type: String, required: true },
      options: [{
        optionName: { type: String, required: true },
        votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
      }]
    }],
    default: []
  }
}, {
  timestamps: true
});



const EventModel = mongoose.model<EventDocument>("Event", eventSchema);

export default EventModel;