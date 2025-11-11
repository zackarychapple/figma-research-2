import { describe, it, expect } from 'vitest';
import {
  parseSemVer,
  compareSemVer,
  getVersionChangeType,
  incrementVersion,
  satisfiesRange,
  isPrerelease,
  isStable,
  getBaseVersion,
} from '../src/versioning';
import { ValidationError } from '../src/types';

describe('Versioning', () => {
  describe('parseSemVer', () => {
    it('should parse a basic version', () => {
      const result = parseSemVer('1.2.3');
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
      });
    });

    it('should parse version with prerelease', () => {
      const result = parseSemVer('1.2.3-beta.1');
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: 'beta.1',
      });
    });

    it('should parse version with build metadata', () => {
      const result = parseSemVer('1.2.3+build.123');
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        build: 'build.123',
      });
    });

    it('should parse version with prerelease and build', () => {
      const result = parseSemVer('1.2.3-alpha.1+build.456');
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: 'alpha.1',
        build: 'build.456',
      });
    });

    it('should throw for invalid version', () => {
      expect(() => parseSemVer('invalid')).toThrow(ValidationError);
      expect(() => parseSemVer('1.2')).toThrow(ValidationError);
      expect(() => parseSemVer('v1.2.3')).toThrow(ValidationError);
    });
  });

  describe('compareSemVer', () => {
    it('should compare major versions', () => {
      expect(compareSemVer('2.0.0', '1.0.0')).toBe(1);
      expect(compareSemVer('1.0.0', '2.0.0')).toBe(-1);
    });

    it('should compare minor versions', () => {
      expect(compareSemVer('1.2.0', '1.1.0')).toBe(1);
      expect(compareSemVer('1.1.0', '1.2.0')).toBe(-1);
    });

    it('should compare patch versions', () => {
      expect(compareSemVer('1.0.2', '1.0.1')).toBe(1);
      expect(compareSemVer('1.0.1', '1.0.2')).toBe(-1);
    });

    it('should return 0 for equal versions', () => {
      expect(compareSemVer('1.2.3', '1.2.3')).toBe(0);
    });

    it('should handle prerelease versions', () => {
      expect(compareSemVer('1.0.0-alpha', '1.0.0')).toBe(-1);
      expect(compareSemVer('1.0.0', '1.0.0-alpha')).toBe(1);
      expect(compareSemVer('1.0.0-alpha', '1.0.0-beta')).toBe(-1);
      expect(compareSemVer('1.0.0-beta.2', '1.0.0-beta.1')).toBe(1);
    });

    it('should ignore build metadata', () => {
      expect(compareSemVer('1.0.0+build1', '1.0.0+build2')).toBe(0);
    });
  });

  describe('getVersionChangeType', () => {
    it('should detect major change', () => {
      expect(getVersionChangeType('1.0.0', '2.0.0')).toBe('major');
    });

    it('should detect minor change', () => {
      expect(getVersionChangeType('1.0.0', '1.1.0')).toBe('minor');
    });

    it('should detect patch change', () => {
      expect(getVersionChangeType('1.0.0', '1.0.1')).toBe('patch');
    });

    it('should return none for same version', () => {
      expect(getVersionChangeType('1.0.0', '1.0.0')).toBe('none');
    });
  });

  describe('incrementVersion', () => {
    it('should increment major version', () => {
      expect(incrementVersion('1.2.3', 'major')).toBe('2.0.0');
    });

    it('should increment minor version', () => {
      expect(incrementVersion('1.2.3', 'minor')).toBe('1.3.0');
    });

    it('should increment patch version', () => {
      expect(incrementVersion('1.2.3', 'patch')).toBe('1.2.4');
    });
  });

  describe('satisfiesRange', () => {
    it('should match exact version', () => {
      expect(satisfiesRange('1.0.0', '1.0.0')).toBe(true);
      expect(satisfiesRange('1.0.0', '1.0.1')).toBe(false);
    });

    it('should handle caret range', () => {
      expect(satisfiesRange('1.2.3', '^1.0.0')).toBe(true);
      expect(satisfiesRange('1.9.9', '^1.0.0')).toBe(true);
      expect(satisfiesRange('2.0.0', '^1.0.0')).toBe(false);
    });

    it('should handle tilde range', () => {
      expect(satisfiesRange('1.2.3', '~1.2.0')).toBe(true);
      expect(satisfiesRange('1.2.9', '~1.2.0')).toBe(true);
      expect(satisfiesRange('1.3.0', '~1.2.0')).toBe(false);
    });

    it('should handle comparison operators', () => {
      expect(satisfiesRange('2.0.0', '>=1.0.0')).toBe(true);
      expect(satisfiesRange('0.9.0', '>=1.0.0')).toBe(false);
      expect(satisfiesRange('2.0.0', '>1.0.0')).toBe(true);
      expect(satisfiesRange('1.0.0', '>1.0.0')).toBe(false);
      expect(satisfiesRange('0.9.0', '<=1.0.0')).toBe(true);
      expect(satisfiesRange('1.1.0', '<=1.0.0')).toBe(false);
      expect(satisfiesRange('0.9.0', '<1.0.0')).toBe(true);
      expect(satisfiesRange('1.0.0', '<1.0.0')).toBe(false);
    });
  });

  describe('isPrerelease', () => {
    it('should detect prerelease versions', () => {
      expect(isPrerelease('1.0.0-alpha')).toBe(true);
      expect(isPrerelease('1.0.0-beta.1')).toBe(true);
      expect(isPrerelease('1.0.0')).toBe(false);
    });
  });

  describe('isStable', () => {
    it('should detect stable versions', () => {
      expect(isStable('1.0.0')).toBe(true);
      expect(isStable('1.0.0-alpha')).toBe(false);
    });
  });

  describe('getBaseVersion', () => {
    it('should extract base version', () => {
      expect(getBaseVersion('1.2.3')).toBe('1.2.3');
      expect(getBaseVersion('1.2.3-alpha')).toBe('1.2.3');
      expect(getBaseVersion('1.2.3+build')).toBe('1.2.3');
      expect(getBaseVersion('1.2.3-alpha+build')).toBe('1.2.3');
    });
  });
});
