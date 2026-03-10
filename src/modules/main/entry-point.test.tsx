import { MainEntryPoint } from '@/modules/main';
import { mockRouterContextValue } from '@/tests/mocks';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('MainEntryPoint', () => {
  render(<MainEntryPoint router={mockRouterContextValue} />);
  it('must render and display label and input linked with Knockout', () => {
    const input = screen.getByLabelText('Linked with Knockout: ', {
      exact: false,
    });
    expect(input).toBeInTheDocument();
  });
  it('must render and display input linked with Knockout', () => {
    const input = screen.getByRole('spinbutton');
    expect(input).toBeInTheDocument();
  });
});
