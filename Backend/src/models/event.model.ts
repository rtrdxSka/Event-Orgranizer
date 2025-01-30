import mongoose from "mongoose";

// Interfaces for the document methods
interface VotingOption {
  optionName: string;
  votes: mongoose.Types.ObjectId[];
}

interface VotingCategory {
  categoryName: string;
  options: VotingOption[];
}

// Main Event Document interface
export interface EventDocument extends mongoose.Document {
  name: string;
  description: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  customFields: Map<string, any>;
  votingCategories: VotingCategory[];
  // Add method types to the interface
  addVote: (categoryName: string, optionName: string, userId: mongoose.Types.ObjectId) => Promise<void>;
}

// Main Event Schema
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

// Method to handle voting with proper typing
eventSchema.methods.addVote = async function(
  this: EventDocument,
  categoryName: string,
  optionName: string,
  userId: mongoose.Types.ObjectId
): Promise<void> {
  const category = this.votingCategories.find((c: VotingCategory) => c.categoryName === categoryName);
  if (!category) throw new Error('Category not found');

  const option = category.options.find((o: VotingOption) => o.optionName === optionName);
  if (!option) throw new Error('Option not found');

  // Remove vote from other options in this category first
  category.options.forEach((o: VotingOption) => {
    o.votes = o.votes.filter((v: mongoose.Types.ObjectId) => !v.equals(userId));
  });

  // Add vote to selected option
  if (!option.votes.some((v: mongoose.Types.ObjectId) => v.equals(userId))) {
    option.votes.push(userId);
  }

  await this.save();
};

const EventModel = mongoose.model<EventDocument>("Event", eventSchema);

export default EventModel;