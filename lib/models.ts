import mongoose, { Schema, Document } from 'mongoose';

// ── Nonce ─────────────────────────────────────────────────────────────────────
export interface INonce extends Document {
  address: string;
  nonce: string;
  expiresAt: Date;
}

const NonceSchema = new Schema<INonce>({
  address: { type: String, required: true, lowercase: true, index: true },
  nonce: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

// Auto-delete expired nonces via MongoDB TTL index
NonceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Nonce = mongoose.models.Nonce ?? mongoose.model<INonce>('Nonce', NonceSchema);

// ── User session ──────────────────────────────────────────────────────────────
export interface IUser extends Document {
  address: string;
  lastLogin: Date;
}

const UserSchema = new Schema<IUser>({
  address: { type: String, required: true, lowercase: true, unique: true },
  lastLogin: { type: Date, default: Date.now },
});

export const User = mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);
