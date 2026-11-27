import assert from 'node:assert/strict'
import test from 'node:test'
import { getGroupPermissionContext, getGroupPermissions } from '../core/group-permissions.js'

test('group permissions match phone JIDs and LIDs from Baileys participant metadata', () => {
    const participants = [
        { id: 'alice@lid', jid: '15550001@s.whatsapp.net', lid: 'alice@lid', admin: 'admin' },
        { id: 'bot@lid', jid: '15550002@s.whatsapp.net', lid: 'bot@lid', admin: 'superadmin' }
    ]

    assert.deepEqual(
        getGroupPermissions(participants, '15550001:4@s.whatsapp.net', '15550002@s.whatsapp.net'),
        { isAdmin: true, isBotAdmin: true }
    )
    assert.deepEqual(
        getGroupPermissions(participants, 'alice@lid', 'bot@lid'),
        { isAdmin: true, isBotAdmin: true }
    )
})

test('group permission metadata failures remain distinguishable and deny permissions', async () => {
    const metadataError = new Error('metadata unavailable')
    const context = await getGroupPermissionContext({
        groupMetadata: async () => { throw metadataError }
    }, 'group@g.us', 'user@s.whatsapp.net', 'bot@s.whatsapp.net')

    assert.equal(context.metadataError, metadataError)
    assert.deepEqual(context.participants, [])
    assert.equal(context.isAdmin, false)
    assert.equal(context.isBotAdmin, false)
})

test('group permission metadata must include a participants list', async () => {
    const context = await getGroupPermissionContext({
        groupMetadata: async () => ({})
    }, 'group@g.us', 'user@s.whatsapp.net', 'bot@s.whatsapp.net')

    assert.ok(context.metadataError instanceof Error)
    assert.equal(context.isAdmin, false)
    assert.equal(context.isBotAdmin, false)
})