import { useId, useState } from 'react';
import { Modal } from '../../shared/ui/Dialog.jsx';
import { prepProblems } from './problems.js';
import './prep.css';

export function PrepBank({ onClose, category = '' }) {
  const searchId = useId();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const needle = search.trim().toLowerCase();
  const matches = prepProblems.filter((problem) =>
    [problem.title, problem.company, ...problem.topics].join(' ').toLowerCase().includes(needle));
  const selected = prepProblems.find((problem) => problem.id === selectedId);

  return (
    <Modal title="Test prep bank" description="Three Easy questions from FastPrep. Summarized prompts with original demo examples." onClose={onClose}>
      <div className="prep-bank">
        {category && category !== 'Coding' && <p className="muted small">This demo includes coding questions. You can practice {category.toLowerCase()} by reviewing requirements, tests, or explanations with a partner.</p>}
        <label htmlFor={searchId}>Search problems</label>
        <input id={searchId} type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, company, or topic…" />
        <p className="muted small" role="status">{matches.length} {matches.length === 1 ? 'problem' : 'problems'} · Easy</p>
        <div className="prep-list">
          {matches.map((problem) => <button type="button" className="prep-choice" key={problem.id} aria-pressed={selectedId === problem.id} onClick={() => setSelectedId(problem.id)}>
            <strong>{problem.title}</strong>
            <span>{problem.company} · {problem.topics.join(', ')}</span>
          </button>)}
          {!matches.length && <p>No matching problems. Try another title or topic.</p>}
        </div>
        {selected ? <article className="prep-detail" aria-labelledby={`${searchId}-title`}>
          <h3 id={`${searchId}-title`}>{selected.title}</h3>
          <p>{selected.summary}</p>
          <h4>Demo example</h4>
          <pre>{selected.example.input}{'\n'}Expected: {selected.example.output}</pre>
          <h4>Test these cases</h4>
          <ul>{selected.checks.map((check) => <li key={check}>{check}</li>)}</ul>
          <h4>Try it with a partner</h4>
          <p>{selected.partnerExercise}</p>
          <a className="btn btn-outline btn-sm" href={selected.sourceUrl} target="_blank" rel="noreferrer">Read full question on FastPrep ↗</a>
        </article> : <p className="muted">Choose a question to see its prompt and a demo example.</p>}
        <p className="muted small">Demo practice only. Attempts and completed demos are not saved. The full question and constraints are available at the source link.</p>
      </div>
    </Modal>
  );
}
