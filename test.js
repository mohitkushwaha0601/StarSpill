/**
 * Astro Roast - Test Suite
 * Tests zodiac calculation, API endpoints, and edge cases
 */

const API_URL = 'http://localhost:8000/api/roast';

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Test cases for zodiac boundaries
const zodiacBoundaryTests = [
    { dob: '21-03-1995', expected: 'aries', name: 'Start of Aries' },
    { dob: '19-04-1995', expected: 'aries', name: 'End of Aries' },
    { dob: '20-04-1995', expected: 'taurus', name: 'Start of Taurus' },
    { dob: '20-05-1995', expected: 'taurus', name: 'End of Taurus' },
    { dob: '21-05-1995', expected: 'gemini', name: 'Start of Gemini' },
    { dob: '20-06-1995', expected: 'gemini', name: 'End of Gemini' },
    { dob: '21-06-1995', expected: 'cancer', name: 'Start of Cancer' },
    { dob: '22-07-1995', expected: 'cancer', name: 'End of Cancer' },
    { dob: '23-07-1995', expected: 'leo', name: 'Start of Leo' },
    { dob: '22-08-1995', expected: 'leo', name: 'End of Leo' },
    { dob: '23-08-1995', expected: 'virgo', name: 'Start of Virgo' },
    { dob: '22-09-1995', expected: 'virgo', name: 'End of Virgo' },
    { dob: '23-09-1995', expected: 'libra', name: 'Start of Libra' },
    { dob: '22-10-1995', expected: 'libra', name: 'End of Libra' },
    { dob: '23-10-1995', expected: 'scorpio', name: 'Start of Scorpio' },
    { dob: '21-11-1995', expected: 'scorpio', name: 'End of Scorpio' },
    { dob: '22-11-1995', expected: 'sagittarius', name: 'Start of Sagittarius' },
    { dob: '21-12-1995', expected: 'sagittarius', name: 'End of Sagittarius' },
    { dob: '22-12-1995', expected: 'capricorn', name: 'Start of Capricorn' },
    { dob: '19-01-1996', expected: 'capricorn', name: 'End of Capricorn' },
    { dob: '20-01-1996', expected: 'aquarius', name: 'Start of Aquarius' },
    { dob: '18-02-1996', expected: 'aquarius', name: 'End of Aquarius' },
    { dob: '19-02-1996', expected: 'pisces', name: 'Start of Pisces' },
    { dob: '20-03-1996', expected: 'pisces', name: 'End of Pisces' }
];

// Test cases for roast intensities
const intensityTests = [
    { intensity: 'mild', name: 'Mild intensity' },
    { intensity: 'savage', name: 'Savage intensity' },
    { intensity: 'nuclear', name: 'Nuclear intensity' }
];

// Test cases for various obsessions
const obsessionTests = [
    { obsession: 'Cricket', name: 'Short obsession' },
    { obsession: 'Coding until 3 AM', name: 'Long obsession' },
    { obsession: 'Coffee ☕', name: 'With emoji' },
    { obsession: 'AI & Machine Learning', name: 'With special chars' }
];

// Edge case tests
const edgeCaseTests = [
    {
        name: 'Missing name',
        data: { name: '', dob: '15-08-1995', obsession: 'Cricket', roast_intensity: 'mild' },
        shouldFail: true
    },
    {
        name: 'Missing DOB',
        data: { name: 'Test', dob: '', obsession: 'Cricket', roast_intensity: 'mild' },
        shouldFail: true
    },
    {
        name: 'Invalid DOB format',
        data: { name: 'Test', dob: '1995-08-15', obsession: 'Cricket', roast_intensity: 'mild' },
        shouldFail: true
    },
    {
        name: 'Invalid intensity',
        data: { name: 'Test', dob: '15-08-1995', obsession: 'Cricket', roast_intensity: 'extreme' },
        shouldFail: true
    },
    {
        name: 'Missing obsession',
        data: { name: 'Test', dob: '15-08-1995', obsession: '', roast_intensity: 'mild' },
        shouldFail: true
    }
];

// Helper function to make API call
async function makeRoastRequest(data) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        return { status: response.status, data: result };
    } catch (error) {
        return { status: 0, error: error.message };
    }
}

// Test runner
async function runTests() {
    console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════╗
║           🔮 ASTRO ROAST - TEST SUITE 🔮                ║
╚══════════════════════════════════════════════════════════╝
${colors.reset}`);

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    // Test 1: API Health Check
    console.log(`\n${colors.blue}━━━ TEST 1: API Health Check ━━━${colors.reset}\n`);
    try {
        const healthResponse = await fetch('http://localhost:8000/');
        const healthData = await healthResponse.json();
        
        if (healthData.status === 'running') {
            console.log(`${colors.green}✓ API is running${colors.reset}`);
            passedTests++;
        } else {
            console.log(`${colors.red}✗ API health check failed${colors.reset}`);
            failedTests++;
        }
        totalTests++;
    } catch (error) {
        console.log(`${colors.red}✗ Cannot connect to API: ${error.message}${colors.reset}`);
        failedTests++;
        totalTests++;
        console.log(`\n${colors.red}ERROR: Backend server is not running!${colors.reset}`);
        console.log(`Please start the backend server first: cd backend && npm start\n`);
        return;
    }

    // Test 2: Zodiac Boundary Tests
    console.log(`\n${colors.blue}━━━ TEST 2: Zodiac Boundary Tests (${zodiacBoundaryTests.length} tests) ━━━${colors.reset}\n`);
    
    for (const test of zodiacBoundaryTests) {
        totalTests++;
        
        const result = await makeRoastRequest({
            name: 'Test User',
            dob: test.dob,
            obsession: 'Testing',
            roast_intensity: 'mild'
        });

        if (result.status === 200 && result.data.success && result.data.zodiac === test.expected) {
            console.log(`${colors.green}✓${colors.reset} ${test.name}: ${test.dob} → ${test.expected}`);
            passedTests++;
        } else {
            console.log(`${colors.red}✗${colors.reset} ${test.name}: Expected ${test.expected}, got ${result.data.zodiac || 'error'}`);
            failedTests++;
        }
    }

    // Test 3: Roast Intensity Tests
    console.log(`\n${colors.blue}━━━ TEST 3: Roast Intensity Tests (${intensityTests.length} tests) ━━━${colors.reset}\n`);
    
    for (const test of intensityTests) {
        totalTests++;
        
        const result = await makeRoastRequest({
            name: 'Test User',
            dob: '15-08-1995',
            obsession: 'Testing',
            roast_intensity: test.intensity
        });

        if (result.status === 200 && result.data.success) {
            console.log(`${colors.green}✓${colors.reset} ${test.name}: Roast generated`);
            passedTests++;
        } else {
            console.log(`${colors.red}✗${colors.reset} ${test.name}: Failed to generate roast`);
            failedTests++;
        }
    }

    // Test 4: Various Obsessions
    console.log(`\n${colors.blue}━━━ TEST 4: Various Obsessions (${obsessionTests.length} tests) ━━━${colors.reset}\n`);
    
    for (const test of obsessionTests) {
        totalTests++;
        
        const result = await makeRoastRequest({
            name: 'Test User',
            dob: '15-08-1995',
            obsession: test.obsession,
            roast_intensity: 'mild'
        });

        if (result.status === 200 && result.data.success) {
            console.log(`${colors.green}✓${colors.reset} ${test.name}: "${test.obsession}"`);
            passedTests++;
        } else {
            console.log(`${colors.red}✗${colors.reset} ${test.name}: Failed`);
            failedTests++;
        }
    }

    // Test 5: Edge Cases
    console.log(`\n${colors.blue}━━━ TEST 5: Edge Cases (${edgeCaseTests.length} tests) ━━━${colors.reset}\n`);
    
    for (const test of edgeCaseTests) {
        totalTests++;
        
        const result = await makeRoastRequest(test.data);

        const didFail = result.status !== 200 || !result.data.success;
        
        if (test.shouldFail && didFail) {
            console.log(`${colors.green}✓${colors.reset} ${test.name}: Correctly rejected`);
            passedTests++;
        } else if (!test.shouldFail && !didFail) {
            console.log(`${colors.green}✓${colors.reset} ${test.name}: Passed`);
            passedTests++;
        } else {
            console.log(`${colors.red}✗${colors.reset} ${test.name}: Unexpected result`);
            failedTests++;
        }
    }

    // Test 6: Full Integration Test
    console.log(`\n${colors.blue}━━━ TEST 6: Full Integration Test ━━━${colors.reset}\n`);
    totalTests++;
    
    const fullTestResult = await makeRoastRequest({
        name: 'Rahul Kumar',
        dob: '15-08-1995',
        obsession: 'Cricket',
        roast_intensity: 'savage'
    });

    if (fullTestResult.status === 200 && fullTestResult.data.success) {
        console.log(`${colors.green}✓ Full integration test passed${colors.reset}`);
        console.log(`  Name: ${fullTestResult.data.name}`);
        console.log(`  Zodiac: ${fullTestResult.data.zodiac_symbol} ${fullTestResult.data.zodiac.toUpperCase()}`);
        console.log(`  Roast length: ${fullTestResult.data.roast.length} chars`);
        console.log(`  Verdict length: ${fullTestResult.data.astro_verdict.length} chars`);
        passedTests++;
    } else {
        console.log(`${colors.red}✗ Full integration test failed${colors.reset}`);
        if (fullTestResult.data.error) {
            console.log(`  Error: ${fullTestResult.data.error}`);
        }
        failedTests++;
    }

    // Summary
    console.log(`\n${colors.cyan}
╔══════════════════════════════════════════════════════════╗
║                     TEST SUMMARY                        ║
╚══════════════════════════════════════════════════════════╝
${colors.reset}`);
    
    console.log(`Total Tests:  ${totalTests}`);
    console.log(`${colors.green}Passed:       ${passedTests}${colors.reset}`);
    console.log(`${colors.red}Failed:       ${failedTests}${colors.reset}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

    if (failedTests === 0) {
        console.log(`${colors.green}🎉 ALL TESTS PASSED! 🎉${colors.reset}\n`);
    } else {
        console.log(`${colors.yellow}⚠️  Some tests failed. Please review the output above.${colors.reset}\n`);
    }
}

// Run tests
runTests();
