import {DatabaseSync} from 'node:sqlite';
import {afterEach,describe,expect,it} from 'vitest';
import {failureStatus,recoverInterruptedJobs} from '../src/server/renderJobs.mjs';

describe('render job recovery and retry transitions',()=>{
  let db;
  afterEach(()=>{db?.close();db=undefined});

  it('requeues interrupted work and finalizes cancellation requests',()=>{
    db=new DatabaseSync(':memory:');
    db.exec(`CREATE TABLE render_jobs(
      id TEXT PRIMARY KEY,status TEXT,progress INTEGER,cancel_requested INTEGER,
      updated_at TEXT,finished_at TEXT,error_code TEXT,error_message TEXT
    )`);
    const insert=db.prepare('INSERT INTO render_jobs VALUES(?,?,?,?,?,?,?,?)');
    insert.run('retry-me','running',42,0,'old',null,null,null);
    insert.run('cancel-me','running',68,1,'old',null,null,null);
    insert.run('already-queued','queued',0,0,'old',null,null,null);

    expect(recoverInterruptedJobs(db,'2026-11-08T12:00:00.000Z')).toBe(2);
    expect(db.prepare('SELECT * FROM render_jobs WHERE id=?').get('retry-me')).toMatchObject({
      status:'queued',progress:0,updated_at:'2026-11-08T12:00:00.000Z',cancel_requested:0,
    });
    expect(db.prepare('SELECT * FROM render_jobs WHERE id=?').get('cancel-me')).toMatchObject({
      status:'cancelled',progress:68,updated_at:'2026-11-08T12:00:00.000Z',finished_at:'2026-11-08T12:00:00.000Z',
      error_code:'CANCELLED',error_message:'Render cancelled during worker recovery',
    });
    expect(db.prepare('SELECT * FROM render_jobs WHERE id=?').get('already-queued')).toMatchObject({status:'queued',progress:0,updated_at:'old'});
  });

  it('retries failures until the attempt limit, then marks the job failed',()=>{
    expect(failureStatus(1,3)).toBe('queued');
    expect(failureStatus(2,3)).toBe('queued');
    expect(failureStatus(3,3)).toBe('failed');
  });
});
