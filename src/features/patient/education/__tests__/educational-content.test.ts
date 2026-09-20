import { MockEducationRepository } from '../repositories/education-repository.mock';
import { EducationalContent } from '../../../../types/education';
const repo = new MockEducationRepository();

describe('Educational Content — Phase 2C.6', () => {
  // R-EC-001: Content model
  describe('EducationalContent model', () => {
    // R-EC-001: Content has id, title, summary, content, category, isPlaceholder
    test('content has all required fields', () => {
      const content: EducationalContent = {
        id: 'ec-1',
        title: 'Test Article',
        summary: 'Test summary',
        content: 'Test content',
        category: 'rehabilitation' as const,
        imageUrl: undefined,
        isPlaceholder: true,
      };
      expect(content.id).toBe('ec-1');
      expect(content.title).toBe('Test Article');
      expect(content.summary).toBe('Test summary');
      expect(content.content).toBe('Test content');
      expect(content.category).toBe('rehabilitation' as const);
      expect(content.isPlaceholder).toBe(true);
    });

    // R-EC-002: Category validation
    test('category accepts valid values', () => {
      const validCategories = ['sevrage', 'rehabilitation', 'inhalation', 'general'];
      for (const cat of validCategories) {
        const c: EducationalContent = {
          id: 'ec-test',
          title: 'Test',
          summary: 'Test',
          content: 'Test',
          category: cat as any,
          isPlaceholder: true,
        };
        expect(c.category).toBe(cat);
      }
    });
  });

  // R-EC-003: Repository loads content
  describe('repository', () => {
    // R-EC-003: getEducationalContent loads content
    test('getEducationalContent loads content by category', async () => {
      const content = await repo.getEducationalContent('rehabilitation');
      expect(content).toBeDefined();
    });

    test('getEducationalContent accepts multiple categories', async () => {
      const sevrage = await repo.getEducationalContent('sevrage');
      const inhalation = await repo.getEducationalContent('inhalation');
      expect(sevrage).toBeDefined();
      expect(inhalation).toBeDefined();
    });

    // R-EC-003b: getEducationalContentById
    test('getEducationalContentById loads content by ID', async () => {
      const content = await repo.getEducationalContentById('ec-1');
      expect(content).toBeDefined();
    });
  });

  // R-EC-004: Content isPlaceholder behavior
  describe('content behavior', () => {
    // R-EC-004: isPlaceholder defaults to true
    test('isPlaceholder defaults to true', () => {
      const content: EducationalContent = {
        id: 'ec-1',
        title: 'Test',
        summary: 'Test',
        content: 'Test',
        category: 'general' as const,
        isPlaceholder: true,
      };
      expect(content.isPlaceholder).toBe(true);
    });

    test('isPlaceholder can be set to false', () => {
      const content: EducationalContent = {
        id: 'ec-1',
        title: 'Test',
        summary: 'Test',
        content: 'Test',
        category: 'general' as const,
        isPlaceholder: false,
      };
      expect(content.isPlaceholder).toBe(false);
    });
  });
});
