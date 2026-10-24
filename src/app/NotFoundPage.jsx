import { EmptyState } from '../shared/ui/bits.jsx';
import { Page } from './Page.jsx';

export function NotFoundPage() {
  return (
    <Page title="Page not found">
      <EmptyState
        icon="alert"
        title="There’s nothing at this address"
        action={
          <a className="btn btn-primary" href="#/">
            Go to Home
          </a>
        }
      >
        The link may be out of date, or the item was removed when the demo data was reset.
      </EmptyState>
    </Page>
  );
}
