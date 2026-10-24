import { useState } from 'react';
import { formatFullDate, timeAgo } from '../../shared/format.js';
import { href, updateQuery, useRoute } from '../../shared/router.js';
import { filesInProject, getUser, membershipOf, versionsForFile } from '../../shared/selectors.js';
import { useData, useMe } from '../../shared/store.js';
import { Avatar } from '../../shared/ui/Avatar.jsx';
import { EmptyState } from '../../shared/ui/bits.jsx';
import { Icon } from '../../shared/ui/Icon.jsx';
import { FileViewer } from './FileViewer.jsx';
import { UploadModal } from './UploadModal.jsx';
import { FILE_TYPES, fileIcon, filesHref, fileType } from './fileMetadata.js';
import './versions.css';

export function FilesPanel({ project }) {
  const data = useData();
  const me = useMe();
  const { query } = useRoute();
  const [uploadFor, setUploadFor] = useState(null);
  const canEdit = Boolean(membershipOf(data, me.id, project.id));
  const files = filesInProject(data, project.id)
    .map((file) => ({ file, versions: versionsForFile(data, file.id) }))
    .sort((a, b) => Date.parse(b.versions.at(-1)?.created_at ?? 0) - Date.parse(a.versions.at(-1)?.created_at ?? 0));
  const selected = files.find(({ file }) => file.id === query.get('file'));
  const search = query.get('fileq') ?? '';
  const type = query.get('filetype') ?? '';
  const filtered = files.filter(({ file, versions }) => file.name.toLowerCase().includes(search.trim().toLowerCase()) && (!type || fileType(file, versions.at(-1)) === type));
  const versionCount = files.reduce((sum, entry) => sum + entry.versions.length, 0);
  const contributors = new Set(files.flatMap(({ versions }) => versions.map((version) => version.author_id))).size;
  const latest = files[0]?.versions.at(-1);
  const author = latest && getUser(data, latest.author_id);
  const listHref = filesHref(project.id, query);

  if (!canEdit) return <EmptyState icon="lock" title="Project files are for members">Join this project to access its files and version history.</EmptyState>;

  return (
    <section className="repo-files" aria-label="Project files">
      <nav className="repo-breadcrumbs" aria-label="File navigation">
        <a href={href(`/projects/${project.id}`)}>{project.title}</a><span aria-hidden="true">/</span>
        <a href={listHref} aria-current={!query.get('file') ? 'page' : undefined}>Files</a>
        {selected && <><span aria-hidden="true">/</span><span aria-current="page">{selected.file.name}</span></>}
      </nav>
      {query.get('file') ? selected ? (
        <FileViewer key={selected.file.id} project={project} {...selected} canEdit={canEdit} onUpload={() => setUploadFor({ fileId: selected.file.id })} />
      ) : (
        <EmptyState icon="file" title="File unavailable" action={<a className="btn btn-quiet" href={listHref}>Back to files</a>}>This file is no longer available in this project.</EmptyState>
      ) : (
        <>
          <header className="repo-toolbar">
            <div className="repo-title"><h2>Files</h2><span className="repo-count" aria-label={`${files.length} files`}>{files.length}</span></div>
            <div className="repo-controls">
              <label className="repo-search"><Icon name="search" size={16} /><span className="visually-hidden">Search files</span><input type="search" placeholder="Find a file…" value={search} onChange={(event) => updateQuery({ fileq: event.target.value })} /></label>
              <label><span className="visually-hidden">File type</span><select className="select" value={type} onChange={(event) => updateQuery({ filetype: event.target.value })}><option value="">All file types</option>{Object.entries(FILE_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <button className="btn btn-primary btn-sm" type="button" onClick={() => setUploadFor({ fileId: null })}><Icon name="upload" size={16} />Upload</button>
            </div>
          </header>
          {files.length ? (
            <div className="repo-browser">
              <div className="repo-activity">
                <div className="repo-activity-message"><Avatar user={author} size={26} /><strong>{author?.name ?? 'Unknown contributor'}</strong><span title={latest?.message}>{latest?.message ?? 'No versions yet'}</span></div>
                <span className="repo-activity-count"><Icon name="history" size={15} />{versionCount} versions</span>
              </div>
              <div className="repo-column-head" aria-hidden="true"><span>Name</span><span>Latest update</span><span>Contributor</span><span>Updated</span><span>History</span></div>
              {filtered.length ? <ul className="repo-rows">
                {filtered.map(({ file, versions }) => {
                  const latestVersion = versions.at(-1);
                  const contributor = latestVersion && getUser(data, latestVersion.author_id);
                  return <li className="repo-row" key={file.id}>
                    <a className="repo-row-link" href={filesHref(project.id, query, { file: file.id })} aria-label={`Open ${file.name}`}>
                      <span className="repo-filename"><Icon name={fileIcon(fileType(file, latestVersion))} size={19} /><span title={file.name}>{file.name}</span><span className="repo-version">v{versions.length}</span></span>
                      <span className="repo-message" title={latestVersion?.message}>{latestVersion?.message ?? 'No version message'}</span>
                      <span className="repo-contributor"><Avatar user={contributor} size={22} /><span>{contributor?.name ?? 'Unknown'}</span></span>
                      <span className="repo-date">{latestVersion ? <time dateTime={latestVersion.created_at} title={formatFullDate(latestVersion.created_at)}>{timeAgo(latestVersion.created_at)}</time> : '—'}</span>
                    </a>
                    <a className="repo-history-link" href={filesHref(project.id, query, { file: file.id, fileView: 'history' })} aria-label={`History of ${file.name}`} title="Version history"><Icon name="history" size={17} /><span className="repo-mobile-history">History</span></a>
                  </li>;
                })}
              </ul> : <EmptyState icon="search" title="No matching files" action={<button type="button" className="btn btn-quiet btn-sm" onClick={() => updateQuery({ fileq: null, filetype: null })}>Clear filters</button>}>Try another filename or file type.</EmptyState>}
              <footer className="repo-footer"><span role="status">{filtered.length} of {files.length} files</span><span>{contributors} contributor{contributors === 1 ? '' : 's'} · All versions preserved</span></footer>
            </div>
          ) : <EmptyState icon="folder" title="Your project’s work belongs here" action={<button className="btn btn-primary" type="button" onClick={() => setUploadFor({ fileId: null })}>Upload your first file</button>}>Share a draft, dataset, image or design. Every upload keeps a version your team can revisit.</EmptyState>}
          <p className="repo-note"><Icon name="history" size={15} />Every file has a history. Open one to inspect, compare or restore a version.</p>
        </>
      )}
      {uploadFor && <UploadModal project={project} fileId={uploadFor.fileId} onClose={() => setUploadFor(null)} />}
    </section>
  );
}
