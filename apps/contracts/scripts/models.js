import mongoose from 'mongoose';

// ─── Account ──────────────────────────────────────────────────────────────────

const accountSchema = new mongoose.Schema({
  address:         { type: String, required: true, unique: true },
  privateKey:      { type: String, required: true },
  role:            { type: String, enum: ['creator', 'fan'], default: 'fan' },
  network:         { type: String, default: 'celo' },

  // Creator-specific
  username:        { type: String, default: null },
  isRegistered:    { type: Boolean, default: false },

  // Stats
  interactionCount: { type: Number, default: 0 },
  lastInteraction:  { type: Date,   default: null },
  createdAt:        { type: Date,   default: Date.now },
});

// ─── InteractionLog ───────────────────────────────────────────────────────────

const interactionLogSchema = new mongoose.Schema({
  txHash:          { type: String,  default: null },
  accountAddress:  { type: String,  required: true },
  toAddress:       { type: String,  default: null },   // creator address for messages
  actionType:      {
    type: String,
    enum: [
      'register',
      'sendMessage',
      'sendPriorityMessage',
      'replyToMessage',
      'publishToWall',
      'likeWallPost',
      'claimEarnings',
      'fund',
      'error',
    ],
    required: true,
  },
  status:   { type: String, enum: ['success', 'failed', 'skipped', 'pending'], default: 'pending' },
  gasUsed:  { type: String, default: null },
  errorMsg: { type: String, default: null },
  meta:     { type: mongoose.Schema.Types.Mixed, default: null }, // extra data (e.g. messageIndex)
  timestamp: { type: Date, default: Date.now },
});

export const Account       = mongoose.model('Account',       accountSchema);
export const InteractionLog = mongoose.model('InteractionLog', interactionLogSchema);
