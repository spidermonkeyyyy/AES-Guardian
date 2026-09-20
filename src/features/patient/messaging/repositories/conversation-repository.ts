import {
  Conversation,
  CommunicationTask,
  MessageSender,
} from '../../../../types/communication';

export interface ConversationRepository {
  getConversationsForPatient(patientId: string): Promise<Conversation[]>;
  getConversationById(id: string): Promise<Conversation | null>;
  sendPatientMessage(conversationId: string, text: string): Promise<Conversation>;
  markRead(conversationId: string, viewer: MessageSender): Promise<Conversation>;
  getPatientTasks(patientId: string): Promise<CommunicationTask[]>;
  completeTask(taskId: string): Promise<void>;
}