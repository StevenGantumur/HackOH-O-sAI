import { Icon } from '../shared/ui/Icon.jsx';
import './teamup.css';

export function TeamUpButtons({ onPractice, onCategories }) {
  return (
    <section className="teamup-practice" aria-label="Practice before your next demo">
      <button type="button" className="teamup-practice-card" onClick={onPractice} disabled={!onPractice}>
        <span className="teamup-action-icon"><Icon name="target" /></span>
        <span><strong>Practice problems</strong><span>Warm up with a small, real-world problem.</span></span>
        <span aria-hidden="true">↗</span>
      </button>
      <button type="button" className="teamup-practice-card" onClick={onCategories} disabled={!onCategories}>
        <span className="teamup-action-icon"><Icon name="folder" /></span>
        <span><strong>Explore categories</strong><span>Find your lane. Or try something new.</span></span>
        <span aria-hidden="true">↗</span>
      </button>
    </section>
  );
}
