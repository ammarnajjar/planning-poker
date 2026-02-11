# Testing Guide

This document describes the testing setup and coverage for the Planning Poker application.

## Testing Framework

The project uses [Vitest](https://vitest.dev/) as the testing framework. Vitest is a modern, fast unit testing framework that works well with TypeScript and provides excellent developer experience.

### Why Vitest?

- **Modern**: Built for modern JavaScript/TypeScript projects
- **Fast**: Faster than Karma/Jasmine (deprecated testing tools)
- **Compatible**: Works with Vite and modern build tools
- **Simple**: Easy to set up and use with minimal configuration

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run tests in watch mode
```bash
npm test -- --watch
```

## Test Coverage

### SupabaseService Tests

Location: [src/app/services/supabase.service.spec.ts](src/app/services/supabase.service.spec.ts)

**Coverage:**
- ✅ `roomExists()` - verifies room existence checking
  - Returns true when room exists
  - Returns false when room doesn't exist
  - Handles database errors gracefully
- ✅ `createRoom()` - verifies room creation validation
  - Throws error when room already exists
- ✅ `joinRoom()` - verifies room joining validation
  - Throws error when room doesn't exist
- ✅ `getCurrentUserId()` - verifies user ID retrieval
  - Returns current user ID
  - Returns empty string when no user ID is set
- ✅ State Management - verifies initial state
  - Initializes with default empty state

### Key Features Tested

1. **Room Validation**
   - Room existence checks before navigation
   - Prevents joining non-existent rooms
   - Prevents creating duplicate rooms

2. **Error Handling**
   - Database errors are caught and propagated
   - User-friendly error messages
   - Validation before operations

3. **State Management**
   - Initial state is correct
   - User ID management works correctly

## Test Structure

Tests follow the AAA (Arrange-Act-Assert) pattern:

```typescript
it('should return true when room exists', async () => {
  // Arrange - Set up test data and mocks
  const mockData = { id: 'TEST123' };
  mockSupabase.from.mockReturnValue({...});

  // Act - Execute the function being tested
  const result = await service.roomExists('TEST123');

  // Assert - Verify the results
  expect(result).toBe(true);
});
```

## Mocking Strategy

### Supabase Client Mocking

The tests mock the Supabase client to avoid hitting the real database:

```typescript
const mockSupabase = {
  from: vi.fn(),
  removeChannel: vi.fn(),
  channel: vi.fn(),
};
```

This allows us to:
- Test in isolation without external dependencies
- Control test data and responses
- Test error scenarios
- Run tests quickly without network calls

### LocalStorage Mocking

Tests that use localStorage mock it to avoid browser dependencies:

```typescript
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
} as Storage;
```

## Future Test Enhancements

Potential areas for expanded test coverage:

1. **Component Tests**
   - HomeComponent form validation
   - RoomComponent voting logic
   - Admin controls functionality

2. **Integration Tests**
   - End-to-end room creation and joining flow
   - Real-time synchronization testing
   - Admin PIN verification flow

3. **E2E Tests**
   - Full user workflows
   - Cross-browser testing
   - Mobile responsiveness

## Notes

- **Angular Testing Complexity**: Component tests require Angular's TestBed and Zone.js setup, which adds complexity. For now, we focus on service-level unit tests that provide good coverage of business logic.

- **Supabase Warnings**: You may see warnings about "Multiple GoTrueClient instances" in test output. These are harmless and come from creating multiple service instances in tests.

- **Test Isolation**: Each test runs in isolation with fresh mocks to prevent test interdependencies.

## CI/CD Integration

Tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test -- --run

- name: Generate coverage
  run: npm run test:coverage
```

## Contributing

When adding new features:

1. Write tests first (TDD approach recommended)
2. Ensure all tests pass before committing
3. Maintain test coverage above 70%
4. Follow existing test patterns and naming conventions

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Angular Testing Guide](https://angular.io/guide/testing)
