import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Basic test to ensure test runner is working
describe('App basic tests', () => {
  it('Should run a simple math test correctly', () => {
    expect(1 + 1).toBe(2);
  });
});
