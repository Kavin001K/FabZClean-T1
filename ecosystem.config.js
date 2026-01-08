module.exports = {
    apps: [
        {
            name: "fabzclean-app",
            script: "server/minimal-server.ts",
            interpreter: "node",
            interpreter_args: "--import tsx",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "1G",
            env: {
                NODE_ENV: "development",
                PORT: 5000,
            },
            env_production: {
                NODE_ENV: "production",
                PORT: 5000,
                HOST: "0.0.0.0",
                // WhatsApp Integration
                MSG91_AUTH_KEY: "480091AbJuma92Ie692de24aP1",
                MSG91_INTEGRATED_NUMBER: "15558125705",
                MSG91_NAMESPACE: "1520cd50_8420_404b_b634_4808f5f33034",
                MSG91_TEMPLATE_NAME: "v",
                MSG91_NAMESPACE_Bill: "1520cd50_8420_404b_b634_4808f5f33034",
                MSG91_TEMPLATE_NAME_Bill: "bill",
                MSG91_NAMESPACE_Invoice: "1520cd50_8420_404b_b634_4808f5f33034",
                MSG91_TEMPLATE_NAME_Invoice: "invoice_fabzclean",
                // Session Secret
                SESSION_SECRET: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4eWF0ZnZqam52anh3eWhoaHFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxMzk1MCwiZXhwIjoyMDc4Nzg5OTUwfQ.pKUCrFN7DJc5Z2-VThlOlRn3yuxnoIYgntvBO3HKjzg"
            },
            error_file: "./logs/err.log",
            out_file: "./logs/out.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss Z"
        },
    ],
};
