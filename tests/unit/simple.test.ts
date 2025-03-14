/**
 * Simple unit test to verify the unit test setup works
 */
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

// Declare global for TypeScript
declare global {
  var testHelpers: {
    isVerbose: boolean;
    createTestFile: (fileName: string, content: string) => string;
    getTestDir: () => string;
  };
}

suite('Simple Unit Test Suite', () => {
  test('should pass a basic assertion', () => {
    assert.strictEqual(1 + 1, 2);
  });

  test('should be able to create and read a test file', () => {
    // Use the global testHelpers to create a test file
    const testContent = 'Hello, world!';
    const filePath = global.testHelpers.createTestFile('test.txt', testContent);
    
    // Verify the file exists
    assert.strictEqual(fs.existsSync(filePath), true);
    
    // Verify the file content
    const content = fs.readFileSync(filePath, 'utf8');
    assert.strictEqual(content, testContent);
  });

  test('should have access to the test directory', () => {
    const testDir = global.testHelpers.getTestDir();
    
    // Verify the test directory exists
    assert.strictEqual(fs.existsSync(testDir), true);
    
    // Verify it's a directory
    assert.strictEqual(fs.statSync(testDir).isDirectory(), true);
  });
});