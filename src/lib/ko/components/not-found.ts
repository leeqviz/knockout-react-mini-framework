import { NotFoundViewModel } from '@/lib/ko/models/not-found';

export const notFoundComponent: KnockoutComponentTypes.Config<
  typeof NotFoundViewModel
> = {
  viewModel: NotFoundViewModel,
  template: /*html*/ `
      <div>
        <h2>404</h2>
        <p>Page not found</p>
      </div>
    `,
};
