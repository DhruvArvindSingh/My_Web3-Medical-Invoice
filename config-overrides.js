const webpack = require('webpack');

module.exports = function override(config, env) {
    // Minimal polyfills for Web3 functionality only
    config.resolve.fallback = {
        ...config.resolve.fallback,
        "crypto": false,
        "stream": false,
        "buffer": false,
        "process": false,
        "path": false,
        "os": false,
        "fs": false,
        "net": false,
        "tls": false,
        "child_process": false,
    };

    // Add minimal plugins for Web3
    config.plugins = [
        ...config.plugins,
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ];

    return config;
}; 