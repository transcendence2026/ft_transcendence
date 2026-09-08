import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './message.schema.js';

@Injectable()
export class MessagesService {
  constructor(@InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>) {}

  findAll() {
    return this.messageModel.find({}, { _id: 0 }).sort({ created_at: -1 }).lean();
  }
}