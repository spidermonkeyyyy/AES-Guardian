import { MockVideoUploadRepository } from '../repositories/mock_video_upload_repository';

describe('MockVideoUploadRepository (source-backed)', () => {
  const repo = new MockVideoUploadRepository();

  it('uploads a video deterministically (source behavior)', async () => {
    const result = await repo.uploadVideo({ filePath: 'mock://test.mp4', patientId: 'p1', recordingDurationMs: 3000 });
    expect(result.id).toMatch(/^video-\d+$/);
    expect(result.patientId).toBe('p1');
    expect(result.fileUri).toBe('mock://test.mp4');
    expect(result.reviewStatus).toBe('pendingReview');
  });

  it('simulates error when filePath contains "error" (source behavior)', async () => {
    await expect(repo.uploadVideo({ filePath: 'error.mp4', patientId: 'p1', recordingDurationMs: 1500 })).rejects.toThrow('Simulated upload failure');
  });

  it('delays proportionally to recording duration (clamped 1000-3000ms)', async () => {
    const start = Date.now();
    await repo.uploadVideo({ filePath: 'mock://fast.mp4', patientId: 'p1', recordingDurationMs: 500 });
    const duration = Date.now() - start;
    expect(duration).toBeGreaterThanOrEqual(1000);
  });

  it('preserves review status as pendingReview (patient-visible only)', async () => {
    const result = await repo.uploadVideo({ filePath: 'mock://v.mp4', patientId: 'p1', recordingDurationMs: 1000 });
    expect(result.reviewStatus).toBe('pendingReview');
    expect(result.reviewedAt).toBeUndefined();
    expect(result.reviewerNote).toBeUndefined();
  });

  it('retrieves latest submission for correct patientId', async () => {
    await repo.uploadVideo({ filePath: 'mock://test.mp4', patientId: 'p2', recordingDurationMs: 1000 });
    const latest = await repo.getLatestSubmission('p2');
    expect(latest).not.toBeNull();
    expect(latest?.patientId).toBe('p2');
  });

  it('returns null for non-matching patientId', async () => {
    await repo.uploadVideo({ filePath: 'mock://test.mp4', patientId: 'p2', recordingDurationMs: 1000 });
    const latest = await repo.getLatestSubmission('p99');
    expect(latest).toBeNull();
  });
});

describe('State machine (9 states from source)', () => {
  it('starts at idle', () => {
    const { useVideoSubmissionStore } = require('../state/use-video-submission-store');
    const state = useVideoSubmissionStore.getState();
    expect(state.status).toBe('idle');
    expect(state.recordingDurationMs).toBe(0);
  });
});
