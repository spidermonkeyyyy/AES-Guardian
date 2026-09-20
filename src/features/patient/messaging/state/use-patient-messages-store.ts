import { create } from 'zustand';
import {
  PatientMessagesState,
  Conversation,
  CommunicationTask,
  MessageSender,
} from '../../../../types/communication';
import { MockConversationRepository } from '../repositories/conversation-repository.mock';

export interface PatientMessagesActions {
  load: () => Promise<void>;
  openConversation: (conversationId: string) => Promise<void>;
  sendMessage: (text: string) => Promise<boolean>;
  completeTask: (taskId: string) => Promise<void>;
  reset: () => void;
}

const repo = new MockConversationRepository();

export const usePatientMessagesStore = create<
  PatientMessagesState & PatientMessagesActions & {
    conversation: Conversation | null;
    openTasks: CommunicationTask[];
    hasOpenTasks: boolean;
  }
>((set, get) => ({
  // ─── State ───────────────────────────────────────────────────────────────
  conversations: [],
  tasks: [],
  isLoading: false,
  errorMessage: null,

  // ─── Derived (computed, not stored — mirrors Flutter getters) ────────────
  get conversation(): Conversation | null {
    const { conversations } = get();
    return conversations.length === 0 ? null : conversations[0];
  },
  get openTasks(): CommunicationTask[] {
    return get().tasks.filter((t) => t.status === 'open');
  },
  get hasOpenTasks(): boolean {
    return get().openTasks.length > 0;
  },

  // ─── Actions ─────────────────────────────────────────────────────────────

  load: async () => {
    set({ isLoading: true, errorMessage: null });
    try {
      // Flutter: provider is patient-scoped via authState; here we default to 'p1' for mock
      const patientId = 'p1';
      const conversations = await repo.getConversationsForPatient(patientId);
      const tasks = await repo.getPatientTasks(patientId);
      set({ conversations, tasks, isLoading: false });
    } catch (_e) {
      set({
        isLoading: false,
        errorMessage: 'Impossible de charger vos messages.',
      });
    }
  },

  openConversation: async (conversationId: string) => {
    await repo.markRead(conversationId, 'patient' as MessageSender);
    await get().load();
  },

  sendMessage: async (text: string) => {
    const conv = get().conversation;
    if (conv === null || text.trim() === '') return false;
    set({ isLoading: true });
    try {
      await repo.sendPatientMessage(conv.id, text);
      await get().load();
      return true;
    } catch (_e) {
      set({
        isLoading: false,
        errorMessage: "Impossible d'envoyer le message.",
      });
      return false;
    }
  },

  completeTask: async (taskId: string) => {
    await repo.completeTask(taskId);
    await get().load();
  },

  reset: () => {
    set({
      conversations: [],
      tasks: [],
      isLoading: false,
      errorMessage: null,
    });
  },
}));