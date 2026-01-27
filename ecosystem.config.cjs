module.exports = {
    apps: [{
        name: "fabzclean",
        script: "./dist-server/server.js",
        instances: 1,
        exec_mode: "fork",
        env: {
            NODE_ENV: "production",
            PORT: 5000
        },
        max_memory_restart: "1G",
        log_date_format: "YYYY-MM-DD HH:mm:ss",
        error_file: "./logs/err.log",
        out_file: "./logs/out.log",
        merge_logs: true,
        time: true
    }]
}
