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

**Total: 57 tests passing across 2 test suites**

### SupabaseService Tests (20 tests)

Location: [src/app/services/supabase.service.spec.ts](src/app/services/supabase.service.spec.ts)

**Coverage:**
- ✅ `roomExists()` - Room existence validation (3 tests)
  - Returns true when room exists
  - Returns false when room doesn't exist
  - Handles database errors gracefully
- ✅ `createRoom()` - Room creation validation (1 test)
  - Throws error when room already exists
- ✅ `joinRoom()` - Room joining validation (1 test)
  - Throws error when room doesn't exist
- ✅ `getCurrentUserId()` - User ID management (2 tests)
  - Returns current user ID
  - Returns empty string when no user ID is set
- ✅ State Management (3 tests)
  - Initializes with default empty state
  - Provides readonly state signal
  - Has correct state structure
- ✅ Room ID Validation (3 tests)
  - Queries database with correct room ID
  - Handles special characters in room ID
  - Handles empty room ID
- ✅ Error Scenarios (4 tests)
  - Handles network errors
  - Handles timeout errors
  - Handles connection errors in createRoom
  - Handles connection errors in joinRoom
- ✅ Boolean Conversion (3 tests)
  - Converts truthy responses to true
  - Converts null responses to false
  - Converts undefined responses to false

### HomeComponent Logic Tests (37 tests)

Location: [src/app/components/home/home.component.spec.ts](src/app/components/home/home.component.spec.ts)

**Coverage:**
- ✅ Signal State Management (8 tests)
  - userName signal initialization and updates
  - roomId signal initialization and updates
  - showJoinForm signal toggle behavior
  - joinAsAdmin signal updates
  - joinError signal updates
- ✅ Room ID Generation (3 tests)
  - Generates 8-character room IDs
  - Generates alphanumeric room IDs
  - Generates unique room IDs
- ✅ Form Validation Logic (6 tests)
  - Validates empty/non-empty userName
  - Validates empty/non-empty roomId
  - Trims whitespace from inputs
- ✅ Join Flow Logic (5 tests)
  - Shows PIN dialog when joinAsAdmin is true
  - Doesn't show PIN dialog when joinAsAdmin is false
  - Clears errors appropriately
  - Sets error when validation fails
- ✅ Navigation State Logic (3 tests)
  - Creates correct state for room creation
  - Creates correct state for joining without admin
  - Creates correct state for joining with admin
- ✅ Error Handling Logic (4 tests)
  - Handles room validation failure
  - Handles room validation success
  - Prevents navigation when room doesn't exist
  - Allows navigation when room exists
- ✅ PIN Dialog Logic (8 tests)
  - Determines PIN requirements correctly
  - Handles dialog cancellation
  - Handles dialog confirmation with/without PIN

### Key Features Tested

1. **Room Validation**
   - Room existence checks before navigation (inline error handling)
   - Prevents joining non-existent rooms
   - Prevents creating duplicate rooms
   - Validates room IDs with special characters

2. **Join-as-Admin Checkbox**
   - Signal state management for checkbox
   - Conditional PIN dialog display
   - Navigation state includes admin context

3. **Error Handling**
   - Database errors are caught and propagated
   - Network and timeout errors handled
   - Inline error messages (joinError signal)
   - Error clearing on form toggle

4. **State Management**
   - Angular Signals for reactive state
   - Initial state initialization
   - User ID management
   - Room state structure validation

5. **Form Validation**
   - Input trimming
   - Empty field validation
   - Room ID format validation

6. **PIN Dialog Logic**
   - Optional for room creation
   - Required when joining as admin
   - Dialog cancellation handling
   - Empty PIN handling (skipped)

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
