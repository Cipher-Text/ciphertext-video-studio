export function recoverInterruptedJobs(db, timestamp) {
  return db.prepare(`
    UPDATE render_jobs
    SET status=CASE WHEN cancel_requested=1 THEN 'cancelled' ELSE 'queued' END,
        progress=CASE WHEN cancel_requested=1 THEN progress ELSE 0 END,
        updated_at=?,
        finished_at=CASE WHEN cancel_requested=1 THEN ? ELSE finished_at END,
        error_code=CASE WHEN cancel_requested=1 THEN 'CANCELLED' ELSE error_code END,
        error_message=CASE WHEN cancel_requested=1 THEN 'Render cancelled during worker recovery' ELSE error_message END
    WHERE status='running'
  `).run(timestamp, timestamp).changes;
}

export function failureStatus(attempt, maxAttempts) {
  return attempt < maxAttempts ? 'queued' : 'failed';
}
