// backend/tests/setup.ts
import { Pool } from 'pg';
import { testDatabaseConfig } from '../src/config/database';

let testPool: Pool;

beforeAll(async () => {
  // Setup test database
  testPool = new Pool(testDatabaseConfig);
  
  // Create test tables
  await testPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      date_of_birth DATE NOT NULL,
      age INTEGER NOT NULL,
      is_eligible BOOLEAN NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
});

beforeEach(async () => {
  // Clean up test data before each test
  await testPool.query('DELETE FROM users');
});

afterAll(async () => {
  // Clean up and close connections
  await testPool.query('DROP TABLE IF EXISTS users');
  await testPool.end();
});

// Make the pool available to tests
global.testPool = testPool;

---

// backend/tests/server.test.ts
import request from 'supertest';
import app from '../src/server';
import { Pool } from 'pg';

// Mock the database pool
jest.mock('pg', () => {
  const mPool = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn()
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('Eligibility API', () => {
  let mockPool: jest.Mocked<Pool>;

  beforeEach(() => {
    mockPool = new Pool() as jest.Mocked<Pool>;
    jest.clearAllMocks();
    
    // Mock successful database connection
    (mockPool.connect as jest.Mock).mockImplementation((callback) => {
      callback(null, {}, () => {});
    });
  });

  describe('POST /api/check-eligibility', () => {
    it('should return eligible for user over 18', async () => {
      const mockQueryResult = {
        rows: [{ id: 1, created_at: new Date() }]
      };
      
      (mockPool.query as jest.Mock).mockResolvedValue(mockQueryResult);

      const response = await request(app)
        .post('/api/check-eligibility')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01'
        });

      expect(response.status).toBe(201);
      expect(response.body.eligible).toBe(true);
      expect(response.body.message).toBe('You are eligible for the program');
      expect(response.body.age).toBeGreaterThanOrEqual(18);
      expect(response.body.id).toBe(1);
    });

    it('should return not eligible for user under 18', async () => {
      const mockQueryResult = {
        rows: [{ id: 2, created_at: new Date() }]
      };
      
      (mockPool.query as jest.Mock).mockResolvedValue(mockQueryResult);

      const response = await request(app)
        .post('/api/check-eligibility')
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          dateOfBirth: '2010-01-01'
        });

      expect(response.status).toBe(201);
      expect(response.body.eligible).toBe(false);
      expect(response.body.message).toBe('You are not eligible for the program');
      expect(response.body.age).toBeLessThan(18);
    });

    it('should return validation error for invalid input', async () => {
      const response = await request(app)
        .post('/api/check-eligibility')
        .send({
          firstName: '',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('First name must be at least 1 character long');
    });

    it('should return validation error for future date of birth', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const response = await request(app)
        .post('/api/check-eligibility')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: futureDate.toISOString().split('T')[0]
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Date of birth cannot be in the future');
    });

    it('should return validation error for invalid name characters', async () => {
      const response = await request(app)
        .post('/api/check-eligibility')
        .send({
          firstName: 'John123',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('First name must contain only letters, spaces, hyphens, and apostrophes');
    });

    it('should handle database errors gracefully', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/check-eligibility')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database connection failed');
    });
  });

  describe('GET /api/stats', () => {
    it('should return user statistics', async () => {
      const mockStatsResult = {
        rows: [{
          total_users: '10',
          eligible_users: '7',
          ineligible_users: '3',
          average_age: '25.5'
        }]
      };
      
      (mockPool.query as jest.Mock).mockResolvedValue(mockStatsResult);

      const response = await request(app)
        .get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body.statistics).toEqual({
        totalUsers: 10,
        eligibleUsers: 7,
        ineligibleUsers: 3,
        averageAge: 25.5
      });
    });

    it('should handle empty database', async () => {
      const mockStatsResult = {
        rows: [{
          total_users: '0',
          eligible_users: '0',
          ineligible_users: '0',
          average_age: null
        }]
      };
      
      (mockPool.query as jest.Mock).mockResolvedValue(mockStatsResult);

      const response = await request(app)
        .get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body.statistics).toEqual({
        totalUsers: 0,
        eligibleUsers: 0,
        ineligible Users: 0,
        averageAge: 0
      });
    });
  });

  describe('GET /health', () => {
    it('should return healthy status when database is connected', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({ rows: [{ 1: 1 }] });

      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.database).toBe('connected');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return unhealthy status when database is disconnected', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('unhealthy');
      expect(response.body.database).toBe('disconnected');
    });
  });

  describe('GET /ready', () => {
    it('should return ready status when database is available', async () => {
      (mockPool.query as jest.Mock).mockResolvedValue({ rows: [{ 1: 1 }] });

      const response = await request(app)
        .get('/ready');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ready');
    });

    it('should return not ready status when database is unavailable', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .get('/ready');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('not ready');
    });
  });

  describe('GET /api', () => {
    it('should return API documentation', async () => {
      const response = await request(app)
        .get('/api');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Eligibility Checker API');
      expect(response.body.version).toBe('1.0.0');
      expect(response.body.endpoints).toBeDefined();
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Not Found');
    });
  });

  describe('Rate limiting', () => {
    it('should allow requests within rate limit', async () => {
      const mockQueryResult = {
        rows: [{ id: 1, created_at: new Date() }]
      };
      
      (mockPool.query as jest.Mock).mockResolvedValue(mockQueryResult);

      // Make a few requests within the limit
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/check-eligibility')
          .send({
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01'
          });
        
        expect(response.status).toBe(201);
      }
    });
  });
});

---

// backend/tests/utils/ageCalculator.test.ts
import { calculateAge, isEligible } from '../../src/utils/ageCalculator';

describe('Age Calculator', () => {
  describe('calculateAge', () => {
    it('should calculate age correctly for a birthday that has passed this year', () => {
      const dateOfBirth = '1990-01-01';
      const age = calculateAge(dateOfBirth);
      const expectedAge = new Date().getFullYear() - 1990;
      
      expect(age).toBeGreaterThanOrEqual(expectedAge - 1);
      expect(age).toBeLessThanOrEqual(expectedAge);
    });

    it('should calculate age correctly for a birthday that has not passed this year', () => {
      const today = new Date();
      const futureMonth = today.getMonth() + 2;
      const year = today.getFullYear() - 25;
      const dateOfBirth = new Date(year, futureMonth, 15).toISOString().split('T')[0];
      
      const age = calculateAge(dateOfBirth);
      expect(age).toBe(24); // Should be 24, not 25, since birthday hasn't passed
    });

    it('should handle date objects', () => {
      const dateOfBirth = new Date('1990-01-01');
      const age = calculateAge(dateOfBirth);
      
      expect(typeof age).toBe('number');
      expect(age).toBeGreaterThan(0);
    });

    it('should throw error for invalid date', () => {
      expect(() => {
        calculateAge('invalid-date');
      }).toThrow('Invalid date of birth');
    });

    it('should throw error for future date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      expect(() => {
        calculateAge(futureDate);
      }).toThrow('Date of birth cannot be in the future');
    });

    it('should handle leap year birthdays correctly', () => {
      const leapYearBirth = '2000-02-29';
      const age = calculateAge(leapYearBirth);
      
      expect(typeof age).toBe('number');
      expect(age).toBeGreaterThan(0);
    });
  });

  describe('isEligible', () => {
    it('should return true for age 18 and above', () => {
      expect(isEligible(18)).toBe(true);
      expect(isEligible(25)).toBe(true);
      expect(isEligible(65)).toBe(true);
    });

    it('should return false for age below 18', () => {
      expect(isEligible(17)).toBe(false);
      expect(isEligible(16)).toBe(false);
      expect(isEligible(0)).toBe(false);
    });

    it('should use custom minimum age', () => {
      expect(isEligible(20, 21)).toBe(false);
      expect(isEligible(21, 21)).toBe(true);
      expect(isEligible(25, 21)).toBe(true);
    });
  });
});

---

// backend/tests/integration/api.integration.test.ts
import request from 'supertest';
import { Pool } from 'pg';
import app from '../../src/server';
import { testDatabaseConfig } from '../../src/config/database';

describe('API Integration Tests', () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool(testDatabaseConfig);
    
    // Create test table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        date_of_birth DATE NOT NULL,
        age INTEGER NOT NULL,
        is_eligible BOOLEAN NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  });

  beforeEach(async () => {
    // Clean up before each test
    await pool.query('DELETE FROM users');
  });

  afterAll(async () => {
    await pool.query('DROP TABLE IF EXISTS users');
    await pool.end();
  });

  describe('Full User Journey', () => {
    it('should complete a full eligible user journey', async () => {
      // Submit eligibility check
      const eligibilityResponse = await request(app)
        .post('/api/check-eligibility')
        .send({
          firstName: 'Alice',
          lastName: 'Johnson',
          dateOfBirth: '1985-06-15'
        });

      expect(eligibilityResponse.status).toBe(201);
      expect(eligibilityResponse.body.eligible).toBe(true);
      expect(eligibilityResponse.body.id).toBeDefined();

      // Check statistics
      const statsResponse = await request(app)
        .get('/api/stats');

      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.statistics.totalUsers).toBe(1);
      expect(statsResponse.body.statistics.eligibleUsers).toBe(1);
      expect(statsResponse.body.statistics.ineligibleUsers).toBe(0);
    });

    it('should handle multiple users correctly', async () => {
      // Add eligible user
      await request(app)
        .post('/api/check-eligibility')
        .send({
          firstName: 'Bob',
          lastName: 'Smith',
          dateOfBirth: '1990-01-01'
        });

      // Add ineligible user
      await request(app)
        .post('/api/check-eligibility')
        .send({
          firstName: 'Charlie',
          lastName: 'Brown',
          dateOfBirth: '2010-01-01'
        });

      // Check statistics
      const statsResponse = await request(app)
        .get('/api/stats');

      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.statistics.totalUsers).toBe(2);
      expect(statsResponse.body.statistics.eligibleUsers).toBe(1);
      expect(statsResponse.body.statistics.ineligibleUsers).toBe(1);
    });
  });
});