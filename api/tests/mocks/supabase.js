function createMockQueryBuilder() {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    count: jest.fn().mockReturnThis(),
  };
  return chain;
}

function createMockSupabaseClient() {
  return {
    from: jest.fn().mockImplementation(() => createMockQueryBuilder()),
    auth: {
      admin: {
        getUserById: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      signInWithPassword: jest.fn().mockResolvedValue({ data: { session: null, user: null }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  };
}

function resetMockSupabase() {
  jest.clearAllMocks();
}

module.exports = { createMockSupabaseClient, createMockQueryBuilder, resetMockSupabase };
