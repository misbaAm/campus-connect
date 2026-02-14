import mongoose from 'mongoose';

const CATEGORIES = ['Tech', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Fest', 'Competition'];

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    posterUrl: { type: String, default: '' },
    registrationLink: { type: String, default: '' },
    deadline: { type: Date, required: true },
    eventDate: { type: Date, required: true },
    category: { type: String, enum: CATEGORIES, required: true },
    tags: [{ type: String, trim: true }],
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

eventSchema.index({ category: 1 });
eventSchema.index({ eventDate: 1 });
eventSchema.index({ deadline: 1 });

export const Event = mongoose.model('Event', eventSchema);
export { CATEGORIES };
