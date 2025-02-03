import mongoose from "mongoose";

interface VotingOption {
  optionName: string;
  votes: mongoose.Types.ObjectId[];
}

interface VotingCategory {
  categoryName: string;
  options: VotingOption[];
}

export interface EventDocument extends mongoose.Document {
  name: string;
  description: string;
  eventCode: string;
  eventDate: Date | null;
  place: string | null;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
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
  eventCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true
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

eventSchema.methods.addVote = async function(
  this: EventDocument,
  categoryName: string,
  optionName: string,
  userId: mongoose.Types.ObjectId
): Promise<void> {
  const category = this.votingCategories.find(c => c.categoryName === categoryName);
  if (!category) throw new Error('Category not found');

  const option = category.options.find(o => o.optionName === optionName);
  if (!option) throw new Error('Option not found');

  category.options.forEach(o => {
    o.votes = o.votes.filter(v => !v.equals(userId));
  });

  if (!option.votes.some(v => v.equals(userId))) {
    option.votes.push(userId);
  }

  await this.save();
};

const EventModel = mongoose.model<EventDocument>("Event", eventSchema);

export default EventModel;