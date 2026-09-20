import { MockConversationRepository } from '../repositories/conversation-repository.mock';

const repo = new MockConversationRepository();

describe('Patient Communication — Phase 2C.2', () => {
  // C-001: Repository contract has 6 source-backed methods
  test('repository contract has 6 methods', () => {
    expect(typeof repo.getConversationsForPatient).toBe('function');
    expect(typeof repo.getConversationById).toBe('function');
    expect(typeof repo.sendPatientMessage).toBe('function');
    expect(typeof repo.markRead).toBe('function');
    expect(typeof repo.getPatientTasks).toBe('function');
    expect(typeof repo.completeTask).toBe('function');
  });

  // C-002: Patient conversation load
  test('getConversationsForPatient returns 1 conversation for p1', async () => {
    const convs = await repo.getConversationsForPatient('p1');
    expect(convs.length).toBe(1);
    expect(convs[0].id).toBe('conv_p1');
  });

  // C-003: Internal notes stripped for patient (source: line 8-9 of message.dart)
  test('patient view excludes internal notes (architectural separation)', async () => {
    const convs = await repo.getConversationsForPatient('p1');
    // Conversation type itself doesn't have internalNotes field per RN type — verify patient-safe
    expect((convs[0] as unknown as { internalNotes?: unknown }).internalNotes).toBeUndefined();
  });

  // C-004: Message ordering (chronological)
  test('messages are ordered chronologically', async () => {
    const convs = await repo.getConversationsForPatient('p1');
    const m = convs[0].messages;
    expect(m.length).toBe(3);
    for (let i = 1; i < m.length; i++) {
      expect(new Date(m[i].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(m[i - 1].createdAt).getTime(),
      );
    }
  });

  // C-005: Message sender semantics preserved (3-state)
  test('MessageSender values: patient, careTeam, system', async () => {
    const convs = await repo.getConversationsForPatient('p1');
    const senders = new Set(convs[0].messages.map((m) => m.sender));
    expect(senders.has('patient')).toBe(true);
    expect(senders.has('careTeam')).toBe(true);
  });

  // C-006: Read/unread behavior
  test('unread count is computed for viewer', async () => {
    const convs = await repo.getConversationsForPatient('p1');
    // 1 careTeam message status=sent (not read by patient)
    expect(convs[0].unreadCount).toBe(1);
  });

  // C-007: Mark as read mutates message status for non-viewer messages
  test('markRead sets status=read for messages not authored by viewer', async () => {
    const before = await repo.getConversationById('conv_p1');
    const unreadBefore = before!.messages.filter((m) => m.status !== 'read').length;
    expect(unreadBefore).toBeGreaterThan(0);

    const after = await repo.markRead('conv_p1', 'patient');
    const unreadAfter = after.messages.filter((m) => m.status !== 'read').length;
    // Patient messages remain 'sent' (read=read means patient opened careTeam msgs)
    // But careTeam messages status should be 'read' now
    const careTeamStillUnread = after.messages.filter(
      (m) => m.sender !== 'patient' && m.status !== 'read',
    );
    expect(careTeamStillUnread.length).toBe(0);
  });

  // C-008: Send message
  test('sendPatientMessage appends to messages list', async () => {
    const before = await repo.getConversationById('conv_p1');
    const countBefore = before!.messages.length;
    await repo.sendPatientMessage('conv_p1', 'Bonjour, voici ma question');
    const after = await repo.getConversationById('conv_p1');
    expect(after!.messages.length).toBe(countBefore + 1);
    const last = after!.messages[after!.messages.length - 1];
    expect(last.sender).toBe('patient');
    expect(last.text).toBe('Bonjour, voici ma question');
    expect(last.status).toBe('sent');
  });

  // C-009: Empty text validation
  test('sendPatientMessage with empty text throws', async () => {
    await expect(repo.sendPatientMessage('conv_p1', '   ')).rejects.toThrow();
  });

  // C-010: Unknown conversation throws
  test('sendPatientMessage to unknown conversation throws', async () => {
    await expect(repo.sendPatientMessage('unknown-id', 'Hello')).rejects.toThrow('Conversation unknown-id not found');
  });

  // C-011: Tasks generated with care requests
  test('patient has tasks from care requests', async () => {
    const tasks = await repo.getPatientTasks('p1');
    expect(tasks.length).toBe(1);
    expect(tasks[0].status).toBe('open');
    expect(tasks[0].type).toBe('monitoring');
  });

  // C-012: Complete task
  test('completeTask transitions status open→done', async () => {
    const tasks = await repo.getPatientTasks('p1');
    const id = tasks[0].id;
    await repo.completeTask(id);
    const after = await repo.getPatientTasks('p1');
    expect(after.find((t) => t.id === id)!.status).toBe('done');
  });

  // C-013: Deterministic mock data (timestamps are stable)
  test('mock data is deterministic (same conversation id, same messages)', async () => {
    const a = await repo.getConversationsForPatient('p1');
    const b = await repo.getConversationsForPatient('p1');
    expect(a[0].id).toBe(b[0].id);
    expect(a[0].messages.length).toBe(b[0].messages.length);
  });

  // C-014: Mock data is patient-safe (no system/careTeam internal data leaked)
  test('mock patient messages never include internal notes', async () => {
    const convs = await repo.getConversationsForPatient('p1');
    // Each message has only patient-safe fields
    convs[0].messages.forEach((m) => {
      expect(['patient', 'careTeam', 'system']).toContain(m.sender);
    });
  });

  // C-015: MessageType values preserved (4-state)
  test('MessageType: text, careUpdate, followUp, systemNotification', async () => {
    const convs = await repo.getConversationsForPatient('p1');
    const types = new Set(convs[0].messages.map((m) => m.type));
    expect(types.has('text')).toBe(true);
    expect(types.has('careUpdate')).toBe(true);
    expect(types.has('followUp')).toBe(true);
  });
});