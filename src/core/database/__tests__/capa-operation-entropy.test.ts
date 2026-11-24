import {
  CapaOperationEntropyUnavailableError,
  createCapaOperationId,
} from '../capa-operation-utils';

describe('CAPA operation secure identity generation', () => {
  const originalCrypto = Object.getOwnPropertyDescriptor(globalThis, 'crypto');

  afterEach(() => {
    if (originalCrypto) {
      Object.defineProperty(globalThis, 'crypto', originalCrypto);
    } else {
      delete (globalThis as any).crypto;
    }
  });

  test('fails closed when randomUUID and getRandomValues are unavailable', () => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: undefined,
    });
    expect(() => createCapaOperationId()).toThrow(
      CapaOperationEntropyUnavailableError,
    );
  });

  test('fails closed when crypto methods throw', () => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        randomUUID: () => {
          throw new Error('entropy unavailable');
        },
        getRandomValues: () => {
          throw new Error('entropy unavailable');
        },
      },
    });
    expect(() => createCapaOperationId()).toThrow(
      CapaOperationEntropyUnavailableError,
    );
  });

  test('uses crypto randomUUID without a weak fallback', () => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        randomUUID: () => '11111111-1111-4111-8111-111111111111',
      },
    });
    expect(createCapaOperationId()).toBe(
      '11111111-1111-4111-8111-111111111111',
    );
  });

  test('rejects empty, malformed and invalid randomUUID output', () => {
    for (const value of ['', 'not-a-uuid', '11111111-1111-1111-1111-111111111111']) {
      Object.defineProperty(globalThis, 'crypto', {
        configurable: true,
        value: { randomUUID: () => value },
      });
      expect(() => createCapaOperationId()).toThrow(
        CapaOperationEntropyUnavailableError,
      );
    }
  });

  test('getRandomValues unusable output fails before identifier use', () => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        getRandomValues: (bytes: Uint8Array) => bytes,
      },
    });
    expect(() => createCapaOperationId()).toThrow(
      CapaOperationEntropyUnavailableError,
    );
  });
});
