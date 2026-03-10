import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  nombre: string;
  password: string;
  rol: 'Administrador' | 'Registro' | 'Consulta';
  activo: boolean;
  ultimoLogin: Date | null;
  creadoEn: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-z0-9_]+$/,
  },
  nombre: { type: String, required: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  rol: {
    type: String,
    enum: ['Administrador', 'Registro', 'Consulta'],
    default: 'Registro',
  },
  activo: { type: Boolean, default: true },
  ultimoLogin: { type: Date, default: null },
  creadoEn: { type: Date, default: Date.now },
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Never return password in JSON
UserSchema.set('toJSON', {
  transform(_doc: any, ret: any) {
    delete ret.password;
    return ret;
  },
});

export default mongoose.model<IUser>('User', UserSchema);
