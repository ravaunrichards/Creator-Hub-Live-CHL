import assert from 'node:assert/strict';
import { closeOrphanedLiveRooms, closeLiveKitRoom } from '../src/live-room-lifecycle.js';

// Canonical contract for the upgraded reconciliation module: sessions are
// ended only after LiveKit confirms the host participant is absent, a present
// host refreshes the server-side heartbeat, transient LiveKit errors never end
// a session, and sessions inside the stale-after window are left untouched.
const now = Date.parse('2026-10-16T20:00:00.000Z');
const quiet = { info() {}, warn() {}, error() {} };

function row(overrides = {}) {
  return {
    id: 'session-1', host_id: 'host-1', room_name: 'chl_room_123',
    started_at: '2026-10-16T18:00:00.000Z',
    updated_at: '2026-10-16T19:55:00.000Z', status: 'live', ended_at: null,
    ...overrides,
  };
}

function mockDb(rows, { updateError = null } = {}) {
  const updates = [];
  const db = {
    from(table) {
      assert.equal(table, 'live_sessions');
      return {
        select(columns) {
          assert.equal(columns, 'id,host_id,room_name,started_at,updated_at,status,ended_at');
          return { eq() { return this; }, is() { return Promise.resolve({ data: rows, error: null }); } };
        },
        update(values) {
          updates.push(values);
          const chain = {
            eq() { return this; }, is() { return this; }, select() { return this; },
            maybeSingle() { return Promise.resolve({ data: updateError ? null : { id: 'session-1' }, error: updateError }); },
          };
          return chain;
        },
      };
    },
  };
  return { db, updates };
}

async function run() {
  // A connected host refreshes the heartbeat and keeps the session live.
  {
    const { db, updates } = mockDb([row()]);
    const result = await closeOrphanedLiveRooms({
      client: db, livekitUrl: 'wss://example.livekit.cloud', apiKey: 'key', apiSecret: 'secret', now,
      logger: quiet,
      roomService: {
        async listRooms() { return [{ name: 'chl_room_123', numParticipants: 2 }]; },
        async listParticipants() { return [{ identity: 'host-1' }, { identity: 'viewer-1' }]; },
      },
    });
    assert.deepEqual(result, { scanned: 1, ended: 0, refreshed: 1 });
    assert.equal(updates[0].updated_at, new Date(now).toISOString(), 'a connected host refreshes the server-side heartbeat');
  }

  // A room that exists but no longer contains its host is closed and ended.
  {
    const { db, updates } = mockDb([row()]);
    let deleted = '';
    const result = await closeOrphanedLiveRooms({
      client: db, livekitUrl: 'wss://example.livekit.cloud', apiKey: 'key', apiSecret: 'secret', now,
      logger: quiet,
      roomService: {
        async listRooms() { return [{ name: 'chl_room_123', numParticipants: 1 }]; },
        async listParticipants() { return [{ identity: 'viewer-1' }]; },
        async deleteRoom(name) { deleted = name; },
      },
    });
    assert.deepEqual(result, { scanned: 1, ended: 1, refreshed: 0 });
    assert.equal(deleted, 'chl_room_123', 'a room without its host is closed');
    assert.equal(updates.at(-1).status, 'ended');
    assert.equal(updates.at(-1).viewer_count, 0);
  }

  // A missing LiveKit room must be removed from live listings (host absent).
  {
    const { db, updates } = mockDb([row()]);
    const result = await closeOrphanedLiveRooms({
      client: db, livekitUrl: 'wss://example.livekit.cloud', apiKey: 'key', apiSecret: 'secret', now,
      logger: quiet, roomService: {
        async listRooms() { return []; },
        async listParticipants() { throw new Error('must not be called when room is absent'); },
      },
    });
    assert.deepEqual(result, { scanned: 1, ended: 1, refreshed: 0 });
    assert.equal(updates[0].status, 'ended', 'a missing LiveKit room must be removed from live listings');
  }

  // Transient LiveKit errors must never end a session.
  {
    const { db, updates } = mockDb([row()]);
    const result = await closeOrphanedLiveRooms({
      client: db, livekitUrl: 'wss://example.livekit.cloud', apiKey: 'key', apiSecret: 'secret', now,
      logger: quiet, roomService: { async listRooms() { throw new Error('temporary network outage'); } },
    });
    assert.deepEqual(result, { scanned: 1, ended: 0, refreshed: 0 });
    assert.equal(updates.length, 0, 'unknown LiveKit state must not end a session');
  }

  // Fresh sessions inside the stale-after window are left untouched.
  {
    const fresh = row({ updated_at: new Date(now - 30_000).toISOString() });
    const { db, updates } = mockDb([fresh]);
    const result = await closeOrphanedLiveRooms({
      client: db, livekitUrl: 'wss://example.livekit.cloud', apiKey: 'key', apiSecret: 'secret', now,
      logger: quiet, roomService: { async listRooms() { throw new Error('must not query fresh heartbeat'); } },
    });
    assert.deepEqual(result, { scanned: 1, ended: 0, refreshed: 0 });
    assert.equal(updates.length, 0, 'fresh sessions must be left untouched');
  }

  // An explicit end can close the LiveKit room directly.
  {
    let deleted = '';
    const result = await closeLiveKitRoom('chl_room_123', {
      livekitUrl: 'wss://example.livekit.cloud', apiKey: 'key', apiSecret: 'secret', logger: quiet,
      roomService: { async deleteRoom(name) { deleted = name; } },
    });
    assert.deepEqual(result, { closed: true });
    assert.equal(deleted, 'chl_room_123');
  }

  console.log('PASS — a connected host refreshes the heartbeat and stays live');
  console.log('PASS — a room without its host is closed and ended');
  console.log('PASS — a missing LiveKit room is removed from live listings');
  console.log('PASS — transient LiveKit failures never end sessions');
  console.log('PASS — fresh sessions inside the stale window are preserved');
  console.log('PASS — explicit end can close the LiveKit room');
}

await run();
