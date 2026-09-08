import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import bcrypt from 'bcryptjs';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ required: true, unique: true, trim: true })
  username!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ default: '' })
  password!: string;

  async comparePassword(candidatePassword: string): Promise<boolean> {
      return this.password ? bcrypt.compare(candidatePassword, this.password) : false;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    next();
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});