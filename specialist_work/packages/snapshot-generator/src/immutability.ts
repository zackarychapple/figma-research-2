import { ImmutabilityViolationError, DeepReadonly } from './types';

/**
 * Deep freezes an object recursively, preventing any modifications.
 * Handles circular references using a WeakSet to track visited objects.
 *
 * @param obj - The object to freeze
 * @param visited - WeakSet to track visited objects (prevents infinite loops)
 * @returns The frozen object
 */
export function deepFreeze<T>(obj: T, visited = new WeakSet<any>()): DeepReadonly<T> {
  // Handle primitive types and null
  if (obj === null || typeof obj !== 'object') {
    return obj as DeepReadonly<T>;
  }

  // Check for circular references
  if (visited.has(obj)) {
    return obj as DeepReadonly<T>;
  }

  // Add to visited set
  visited.add(obj);

  // Freeze the object itself
  Object.freeze(obj);

  // Recursively freeze all properties
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = (obj as any)[prop];

    // Only process if it's an object and not already frozen
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value, visited);
    }
  });

  // Also freeze symbol properties
  Object.getOwnPropertySymbols(obj).forEach((sym) => {
    const value = (obj as any)[sym];

    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value, visited);
    }
  });

  return obj as DeepReadonly<T>;
}

/**
 * Verifies that an object is deeply frozen and immutable.
 *
 * @param obj - The object to verify
 * @param path - Current path in the object tree (for error reporting)
 * @param visited - WeakSet to track visited objects
 * @returns true if the object is fully frozen, throws error otherwise
 */
export function verifyImmutability(
  obj: any,
  path: string = 'root',
  visited = new WeakSet<any>()
): boolean {
  // Handle primitive types and null
  if (obj === null || typeof obj !== 'object') {
    return true;
  }

  // Check for circular references
  if (visited.has(obj)) {
    return true;
  }

  visited.add(obj);

  // Check if the object itself is frozen
  if (!Object.isFrozen(obj)) {
    throw new ImmutabilityViolationError(
      `Object at path '${path}' is not frozen`
    );
  }

  // Check all properties recursively
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = obj[prop];
    const currentPath = `${path}.${prop}`;

    if (value && typeof value === 'object') {
      verifyImmutability(value, currentPath, visited);
    }
  });

  // Check symbol properties
  Object.getOwnPropertySymbols(obj).forEach((sym) => {
    const value = obj[sym];
    const currentPath = `${path}.[${sym.toString()}]`;

    if (value && typeof value === 'object') {
      verifyImmutability(value, currentPath, visited);
    }
  });

  return true;
}

/**
 * Attempts to modify an object and verifies that it remains unchanged.
 * Used for testing immutability enforcement.
 *
 * @param obj - The object to test
 * @returns true if modification was prevented, false otherwise
 */
export function testImmutability(obj: any): boolean {
  if (obj === null || typeof obj !== 'object') {
    return true;
  }

  try {
    // Test 1: Try to add a new property
    const testKey = `__test_${Date.now()}__`;
    (obj as any)[testKey] = 'test value';

    // If we can read it back, the object is mutable
    if ((obj as any)[testKey] === 'test value') {
      return false;
    }

    // Test 2: Try to modify an existing property
    const keys = Object.keys(obj);
    if (keys.length > 0) {
      const firstKey = keys[0];
      const originalValue = (obj as any)[firstKey];
      (obj as any)[firstKey] = 'modified';

      // If the value changed, the object is mutable
      if ((obj as any)[firstKey] !== originalValue) {
        return false;
      }
    }

    // Test 3: Try to delete a property
    if (keys.length > 0) {
      const firstKey = keys[0];
      delete (obj as any)[firstKey];

      // If the property was deleted, the object is mutable
      if (!(firstKey in obj)) {
        return false;
      }
    }

    // All tests passed - object is immutable
    return true;
  } catch (error) {
    // Errors (like TypeError in strict mode) indicate immutability
    return true;
  }
}

/**
 * Creates a deep clone of an object before freezing it.
 * This ensures the original object remains unfrozen.
 *
 * @param obj - The object to clone and freeze
 * @returns A frozen deep clone of the object
 */
export function cloneAndFreeze<T>(obj: T): DeepReadonly<T> {
  // Handle primitive types and null
  if (obj === null || typeof obj !== 'object') {
    return obj as DeepReadonly<T>;
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    const cloned = obj.map((item) => cloneAndFreeze(item)) as any;
    return deepFreeze(cloned);
  }

  // Handle plain objects
  const cloned: any = {};
  for (const key of Object.keys(obj)) {
    cloned[key] = cloneAndFreeze((obj as any)[key]);
  }

  return deepFreeze(cloned);
}

/**
 * Checks if an object is frozen (but not necessarily deeply frozen).
 *
 * @param obj - The object to check
 * @returns true if the object is frozen
 */
export function isFrozen(obj: any): boolean {
  if (obj === null || typeof obj !== 'object') {
    return true;
  }
  return Object.isFrozen(obj);
}

/**
 * Checks if an object is deeply frozen (all nested objects are frozen).
 *
 * @param obj - The object to check
 * @param visited - WeakSet to track visited objects
 * @returns true if the object is deeply frozen
 */
export function isDeeplyFrozen(obj: any, visited = new WeakSet<any>()): boolean {
  if (obj === null || typeof obj !== 'object') {
    return true;
  }

  if (visited.has(obj)) {
    return true;
  }

  visited.add(obj);

  if (!Object.isFrozen(obj)) {
    return false;
  }

  // Check all properties
  for (const key of Object.getOwnPropertyNames(obj)) {
    const value = obj[key];
    if (value && typeof value === 'object') {
      if (!isDeeplyFrozen(value, visited)) {
        return false;
      }
    }
  }

  // Check symbol properties
  for (const sym of Object.getOwnPropertySymbols(obj)) {
    const value = obj[sym];
    if (value && typeof value === 'object') {
      if (!isDeeplyFrozen(value, visited)) {
        return false;
      }
    }
  }

  return true;
}
