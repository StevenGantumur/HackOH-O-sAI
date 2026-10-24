import { navigate } from '../shared/router.js';
import { DEFAULT_USER_ID, switchDemoUser } from '../shared/session.js';
import { store } from '../shared/store.js';
import { Modal } from '../shared/ui/Dialog.jsx';
import { useToast } from '../shared/ui/Toast.jsx';

export function ResetDemoModal({ onClose }) {
  const toast = useToast();
  function reset() {
    store.reset();
    switchDemoUser(DEFAULT_USER_ID);
    onClose();
    navigate('/');
    toast({ tone: 'success', title: 'Demo data reset' });
  }
  return (
    <Modal
      title="Reset the demo data?"
      description="Every project, task, submission, file and message in this browser goes back to the original sample data. Other browsers are not affected."
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={reset}>
            Reset demo data
          </button>
        </>
      }
    />
  );
}
