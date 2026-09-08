import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema()
export class Message {
  @Prop({ required: true })
  text!: string;

  @Prop({ required: true })
  sender!: string;

  @Prop({ default: Date.now })
  created_at!: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);