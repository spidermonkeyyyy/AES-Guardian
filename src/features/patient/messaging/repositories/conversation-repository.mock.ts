import { ConversationRepository } from './conversation-repository';
import {
  Conversation,
  CommunicationTask,
  Message,
  MessageSender,
  MessageStatus,
  MessageType,
  CareRequest,
  CareRequestType,
  CareRequestStatus,
  TaskType,
  TaskStatus,
} from '../../../../types/communication';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const NURSE_ID = 'n1';

const ANCHOR = new Date('2026-01-15T10:00:00Z');

function iso(date: Date): string {
  return date.toISOString();
}

function nowOffset(days: number, hours: number = 0): Date {
  return new Date(ANCHOR.getTime() - days * DAY_MS - hours * HOUR_MS);
}

/**
 * Mock implementation of the patient-facing ConversationRepository.
 * Reproduces audited Flutter MockConversationRepository behavior:
 * - 1 seeded conversation for patient p1 (id: conv_p1)
 * - 3 messages: 1 careUpdate (read), 1 patient text reply (read), 1 followUp (sent)
 * - 1 care request (pending) + 1 task (open) generated together
 * - NO internal notes (stripped — patient never sees them per source)
 * - Deterministic timestamps anchored at kMockConversationSeedAnchor
 * - markRead mutates message status based on viewer
 * - sendPatientMessage appends to messages list
 * - No artificial delays in Flutter mock (Duration.zero) — preserved
 */
export class MockConversationRepository implements ConversationRepository {
  private _conversations: Conversation[] = [];
  private _tasks: CommunicationTask[] = [];
  private _idCounter = 0;

  constructor() {
    this._seed();
  }

  private _newId(prefix: string): string {
    this._idCounter += 1;
    return `${prefix}_${this._idCounter}`;
  }

  private _seed(): void {
    const conv1Messages: Message[] = [
      {
        id: 'm_p1_1',
        conversationId: 'conv_p1',
        sender: 'careTeam',
        type: 'careUpdate',
        text: 'Votre suivi a été examiné. Vos dernières données sont stables par rapport à votre référence.',
        createdAt: iso(nowOffset(0, 3)),
        status: 'read',
        actionLabel: 'Voir mon suivi',
        actionRoute: '/patient/monitoring',
      },
      {
        id: 'm_p1_2',
        conversationId: 'conv_p1',
        sender: 'patient',
        type: 'text',
        text: 'Merci pour votre retour.',
        createdAt: iso(nowOffset(0, 2)),
        status: 'read',
      },
      {
        id: 'm_p1_3',
        conversationId: 'conv_p1',
        sender: 'careTeam',
        type: 'followUp',
        text: 'Nous vous recontacterons si une nouvelle vérification est nécessaire. Continuez votre suivi habituel.',
        createdAt: iso(nowOffset(0, 0)),
        status: 'sent',
        actionLabel: 'Ouvrir',
        actionRoute: '/patient/monitoring',
      },
    ];

    const conv1CareRequest: CareRequest = {
      id: 'cr_p1_1',
      conversationId: 'conv_p1',
      patientId: 'p1',
      type: 'newMonitoring',
      reason: 'Suivi de routine hebdomadaire',
      requestedData: ['spo2', 'dyspnea'],
      status: 'pending',
      createdAt: iso(nowOffset(0, 1)),
      dueDate: iso(nowOffset(-3)),
      createdByNurseId: NURSE_ID,
    };

    const conv1: Conversation = {
      id: 'conv_p1',
      patientId: 'p1',
      patientName: 'Patient P1',
      patientSummary: 'BPCO · GOLD III',
      messages: conv1Messages,
      careRequests: [conv1CareRequest],
      tasks: [],
      createdAt: iso(nowOffset(20)),
      updatedAt: iso(nowOffset(0, 0)),
      unreadCount: 1, // one careTeam message status=sent
    };

    this._conversations = [conv1];

    // Task generated from the care request
    this._tasks = [
      {
        id: 'task_p1_1',
        patientId: 'p1',
        conversationId: 'conv_p1',
        type: 'monitoring',
        title: 'Nouveau suivi respiratoire',
        description: 'Suivi de routine hebdomadaire',
        actionRoute: '/patient/monitoring',
        status: 'open',
        createdAt: iso(nowOffset(0, 1)),
        dueDate: iso(nowOffset(-3)),
        linkedCareRequestId: 'cr_p1_1',
      },
    ];
  }

  async getConversationsForPatient(patientId: string): Promise<Conversation[]> {
    // Patient repo strips internal notes (Flutter: getConversationsForPatient returns patient-safe view)
    return this._conversations
      .filter((c) => c.patientId === patientId)
      .map((c) => ({
        ...c,
        messages: c.messages.map((m) => ({ ...m })),
        careRequests: c.careRequests.map((r) => ({ ...r })),
        tasks: c.tasks.map((t) => ({ ...t })),
      }));
  }

  async getConversationById(id: string): Promise<Conversation | null> {
    const c = this._conversations.find((conv) => conv.id === id);
    if (!c) return null;
    return {
      ...c,
      messages: c.messages.map((m) => ({ ...m })),
      careRequests: c.careRequests.map((r) => ({ ...r })),
      tasks: c.tasks.map((t) => ({ ...t })),
    };
  }

  async sendPatientMessage(
    conversationId: string,
    text: string,
  ): Promise<Conversation> {
    const idx = this._conversations.findIndex((c) => c.id === conversationId);
    if (idx === -1) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
    const c = this._conversations[idx];
    if (text.trim() === '') {
      throw new Error('Message text cannot be empty');
    }
    const newMessage: Message = {
      id: this._newId('m_p'),
      conversationId: c.id,
      sender: 'patient',
      type: 'text',
      text: text.trim(),
      createdAt: iso(new Date()),
      status: 'sent',
    };
    const updated: Conversation = {
      ...c,
      messages: [...c.messages, newMessage],
      updatedAt: iso(new Date()),
    };
    this._conversations[idx] = updated;
    return {
      ...updated,
      messages: updated.messages.map((m) => ({ ...m })),
      careRequests: updated.careRequests.map((r) => ({ ...r })),
      tasks: updated.tasks.map((t) => ({ ...t })),
    };
  }

  async markRead(
    conversationId: string,
    viewer: MessageSender,
  ): Promise<Conversation> {
    const idx = this._conversations.findIndex((c) => c.id === conversationId);
    if (idx === -1) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
    const c = this._conversations[idx];
    // Flutter: "Marks messages not authored by [viewer] as read"
    const updatedMessages = c.messages.map((m) => {
      if (m.sender !== viewer && m.status !== 'read') {
        return { ...m, status: 'read' as MessageStatus };
      }
      return m;
    });
    const updated: Conversation = {
      ...c,
      messages: updatedMessages,
      unreadCount: 0,
      updatedAt: iso(new Date()),
    };
    this._conversations[idx] = updated;
    return {
      ...updated,
      messages: updated.messages.map((m) => ({ ...m })),
      careRequests: updated.careRequests.map((r) => ({ ...r })),
      tasks: updated.tasks.map((t) => ({ ...t })),
    };
  }

  async getPatientTasks(patientId: string): Promise<CommunicationTask[]> {
    return this._tasks
      .filter((t) => t.patientId === patientId)
      .map((t) => ({ ...t }));
  }

  async completeTask(taskId: string): Promise<void> {
    const idx = this._tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) {
      throw new Error(`Task ${taskId} not found`);
    }
    this._tasks[idx] = { ...this._tasks[idx], status: 'done' };
  }
}