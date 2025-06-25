/**
 * Jest Configuration
 * Configure testing environment and settings
 */
module.exports = {
    // Test environment
    testEnvironment: 'node',

    // Test match patterns
    testMatch: [
        '**/test/**/*.test.js',
        '**/test/**/*.spec.js'
    ],

    // Coverage settings
    collectCoverage: true,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'core/**/*.js',
        'charms/**/*.js',
        'runtime/**/*.js',
        '!**/node_modules/**'
    ],
    coverageReporters: [
        'text',
        'lcov',
        'clover',
        'html'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },

    // Test timeout
    testTimeout: 10000,

    // Setup files
    setupFilesAfterEnv: [
        '<rootDir>/test/setup.js'
    ],

    // Module aliases
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
    },

    // Global variables
    globals: {
        TEST_MODE: true
    },

    // Verbose output
    verbose: true,

    // Clear mock calls between tests
    clearMocks: true,

    // Detect memory leaks
    detectLeaks: true,

    // Error handling
    bail: false,
    notify: true,

    // Watch settings
    watchPlugins: [
        'jest-watch-typeahead/filename',
        'jest-watch-typeahead/testname'
    ],

    // Report settings
    reporters: [
        'default',
        [
            'jest-junit',
            {
                outputDirectory: 'reports/junit',
                outputName: 'junit.xml',
                classNameTemplate: '{classname}',
                titleTemplate: '{title}',
                ancestorSeparator: ' › ',
                usePathForSuiteName: true
            }
        ]
    ],

    // Specific module settings
    transform: {
        '^.+\\.jsx?$': 'babel-jest'
    },

    // Module file extensions
    moduleFileExtensions: [
        'js',
        'json',
        'node'
    ],

    // Test environment variables
    testEnvironmentOptions: {
        NODE_ENV: 'test'
    },

    // Custom resolver
    resolver: undefined,

    // Project root
    rootDir: '.',

    // Display settings
    displayName: {
        name: 'DeepCode',
        color: 'blue'
    },

    // Cache settings
    cache: true,
    cacheDirectory: '.jest-cache',

    // Error formatting
    errorOnDeprecated: true,
    prettierPath: null,

    // Ignore patterns
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/'
    ],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/test/'
    ],
    watchPathIgnorePatterns: [
        '/node_modules/',
        '/dist/'
    ],

    // Maximum number of concurrent workers
    maxWorkers: '50%',

    // Prevent test isolation
    maxConcurrency: 5
};
