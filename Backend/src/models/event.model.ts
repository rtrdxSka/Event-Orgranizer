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
    uppercase: true,
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
    maxDates: { type: Number, default: 0 }
  },
  eventPlaces: {
    allowUserAdd: { type: Boolean, default: true },
    places: { type: [String], default: [] },
    maxPlaces: { type: Number, default: 0 }
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

// eventSchema.methods.addVote = async function(
//   this: EventDocument,
//   categoryName: string,
//   optionName: string,
//   userId: mongoose.Types.ObjectId
// ): Promise<void> {
//   const category = this.votingCategories.find(c => c.categoryName === categoryName);
//   if (!category) throw new Error('Category not found');

//   const option = category.options.find(o => o.optionName === optionName);
//   if (!option) throw new Error('Option not found');

//   category.options.forEach(o => {
//     o.votes = o.votes.filter(v => !v.equals(userId));
//   });

//   if (!option.votes.some(v => v.equals(userId))) {
//     option.votes.push(userId);
//   }

//   await this.save();
// };

// eventSchema.post('save', async function(doc) {
//   if (!doc.eventLink) {
//     // Only set the eventLink if it's not already set
//     const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
//     doc.eventLink = `${baseUrl}/event/submit/${doc.eventUUID}`;
    
//     // Save the document again to update the eventLink
//     // But don't run this hook again for this save operation to avoid infinite loop
//     await doc.save({ validateBeforeSave: false });
//   }
// });


const EventModel = mongoose.model<EventDocument>("Event", eventSchema);

export default EventModel;