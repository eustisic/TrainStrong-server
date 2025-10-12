// Simple API test runner
// Run with: tsx tests/test-runner.ts

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  response?: any;
}

class APITester {
  private results: TestResult[] = [];

  async get(path: string, name: string): Promise<void> {
    try {
      const response = await fetch(`${BASE_URL}${path}`);
      const data = await response.json();
      
      this.results.push({
        name,
        passed: response.ok,
        response: data
      });
    } catch (error) {
      this.results.push({
        name,
        passed: false,
        error: (error as Error).message
      });
    }
  }

  async post(path: string, body: any, name: string): Promise<void> {
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      
      this.results.push({
        name,
        passed: response.ok,
        response: data
      });
    } catch (error) {
      this.results.push({
        name,
        passed: false,
        error: (error as Error).message
      });
    }
  }

  printResults(): void {
    console.log('\n=== API Test Results ===\n');
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    this.results.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.name}`);
      
      if (!result.passed) {
        console.log(`   Error: ${result.error || 'Request failed'}`);
      }
      
      if (result.response) {
        console.log(`   Response: ${JSON.stringify(result.response, null, 2)}`);
      }
      console.log('');
    });
    
    console.log(`\nSummary: ${passed}/${total} tests passed\n`);
  }
}

async function runTests() {
  const tester = new APITester();
  
  console.log('Starting API tests...');
  console.log('Make sure the server is running on http://localhost:3000\n');

  // Basic health checks
  await tester.get('/health', 'Health check');
  await tester.get('/', 'Root endpoint');

  // Workout endpoints
  await tester.get('/api/workouts', 'Get all workouts');
  await tester.get('/api/workouts/1', 'Get workout by ID');
  
  // Create a test workout
  await tester.post('/api/workouts', {
    name: 'Test Workout',
    category: 'strength',
    equipment: 'dumbbell',
    description: 'A test workout',
    instructions: 'Perform correctly',
    workout_data: {
      type: 'strength',
      sets: 3,
      reps: 12,
      weight_kg: 20,
      rest_seconds: 60
    },
    is_public: true
  }, 'Create test workout');

  // Workout endpoints (note: these require user_id which may not exist yet)
  await tester.get('/api/workouts?user_id=1', 'Get workouts for user 1');
  await tester.get('/api/workouts/1', 'Get workout by ID');

  // Dashboard
  await tester.get('/api/dashboard?user_id=1', 'Get dashboard data');

  tester.printResults();
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests, APITester };