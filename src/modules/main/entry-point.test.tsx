import { appStore } from '@/shared/store';
import {
  mockedRouterContextValue,
  renderWithRouterContext,
} from '@/tests/mocks/router';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MainContainer } from './components/main-container';
import { MainEntryPoint } from './entry-point';

describe('MainEntryPoint', () => {
  beforeEach(() => {
    appStore.getState().reset();
  });

  afterEach(() => {
    cleanup();
  });

  it('must render and display label and input linked with Knockout', () => {
    render(<MainEntryPoint router={mockedRouterContextValue} />);
    const label = screen.getByLabelText('Linked with Knockout: ', {
      exact: false,
    });
    expect(label).toBeInTheDocument();
  });

  it('must render and display input linked with Knockout', () => {
    render(<MainEntryPoint router={mockedRouterContextValue} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toBeInTheDocument();
  });

  it('must call navigate function', () => {
    const routerContextValue = renderWithRouterContext(<MainContainer />, {});
    const button = screen.getByRole('button', { name: 'Go to test' });
    button.click();
    expect(routerContextValue.navigate).toHaveBeenCalledWith('/test');
  });
});
