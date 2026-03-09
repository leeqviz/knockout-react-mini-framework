import { MainEntryPoint } from '@/modules/main/entry-point';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('MainEntryPoint', () => {
  it('must render and display user with name Test', () => {
    render(<MainEntryPoint router={null} />);

    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
