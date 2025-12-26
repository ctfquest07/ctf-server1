module.exports = {
    apps: [{
        name: "ctf-backend",
        script: "./server.js",
        instances: "max", // Utilize all CPU cores
        exec_mode: "cluster", // Enable clustering for performance
        env: {
            NODE_ENV: "development",
        },
        env_production: {
            NODE_ENV: "production",
            PORT: 10000
        },
        // Error handling
        max_memory_restart: '1G',
        restart_delay: 3000,
        exp_backoff_restart_delay: 100
    }]
};
