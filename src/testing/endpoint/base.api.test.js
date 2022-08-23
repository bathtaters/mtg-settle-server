// Copy this test as a starting point for testing new Model APIs (Remove .skip from describe block)

const server = require('../../../engine/server')
const request = require('supertest')(server)
const { getApiHeader } = require('../../../engine/testing/endpoint.utils')

const apiPrefix = '/api/base' // change 'base' to Model title

describe.skip('Test Base model API', () => {
  let header, testId
  beforeAll(() => getApiHeader().then((token) => header = token))

  test('Confirm login works', async () => {
    await request.get(apiPrefix).set(header).expect(200).expect('Content-Type', /json/)
  })

  test('Create entry (POST)', async () => {
    const res = await request.post(apiPrefix).set(header).expect(200).expect('Content-Type', /json/)
      .send({
        // Set fields of new item
        data: "test"
      })
    expect(res.body).toEqual({ id: expect.any(Number) })
    testId = res.body.id
  })

  test('Retrieve entry (GET)', async () => {
    const res = await request.get(`${apiPrefix}/${testId}`).set(header).expect(200).expect('Content-Type', /json/)
    expect(res.body).toEqual({
      // Expected fields (Including default values that will be auto set)
      id: testId,
      data: "test"
    })
  })

  test('Update entry (PUT)', async () => {
    const update = await request.put(`${apiPrefix}/${testId}`).set(header).expect(200).expect('Content-Type', /json/)
      .send({
        // Field(s) to update
        data: "new"
      })
    expect(update.body).toEqual({ success: true })

    const res = await request.get(`${apiPrefix}/${testId}`).set(header).expect(200).expect('Content-Type', /json/)
    expect(res.body).toEqual({
      // Confirm that only updated field(s) changed
      id: testId,
      data: "new"
    })
  })

  test('Delete (DELETE)', async () => {
    const del = await request.delete(`${apiPrefix}/${testId}`).set(header).expect(200).expect('Content-Type', /json/)
    expect(del.body).toEqual({ success: true })

    const res = await request.get(apiPrefix).set(header).expect(200).expect('Content-Type', /json/)
    expect(res.body).toHaveLength(0)
    expect(res.body).toEqual([])
  })
})